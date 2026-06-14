import httpx
import json
import os
import re
import asyncio
from typing import List, Dict, Optional, Tuple
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Model is configurable so it can be swapped without code changes.
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")

LEGAL_DOMAINS = {
    "criminal": ["murder", "theft", "robbery", "assault", "rape", "kidnapping", "fraud", "cheating", "forgery",
                  "ipc", "crpc", "fir", "bail", "arrest", "police", "crime", "criminal", "offense", "offence",
                  "dowry", "harassment", "stalking", "cybercrime", "extortion", "bribery", "drug"],
    "civil": ["property", "contract", "agreement", "breach", "damages", "injunction", "suit", "decree",
              "cpc", "civil", "tort", "negligence", "defamation", "nuisance", "trespass"],
    "family": ["divorce", "marriage", "custody", "alimony", "maintenance", "adoption", "guardianship",
               "domestic violence", "dowry", "child", "wife", "husband", "matrimonial", "hindu marriage",
               "muslim", "christian marriage", "special marriage"],
    "property": ["land", "property", "real estate", "possession", "title", "deed", "registration",
                 "encroachment", "partition", "tenant", "landlord", "rent", "eviction", "mutation"],
    "corporate": ["company", "director", "shareholder", "partnership", "llp", "incorporation", "merger",
                  "acquisition", "insolvency", "bankruptcy", "sebi", "rbi", "compliance", "corporate"],
    "cyber": ["cyber", "online", "internet", "hacking", "data", "privacy", "it act", "social media",
              "website", "phishing", "identity theft", "digital", "electronic", "computer"],
    "labor": ["employment", "employee", "employer", "salary", "wages", "termination", "unfair dismissal",
              "workplace", "labor", "labour", "factory", "industrial", "pf", "esi", "gratuity", "bonus"],
    "consumer": ["consumer", "product", "service", "deficiency", "complaint", "refund", "warranty",
                 "defective", "misleading", "advertisement", "e-commerce", "online shopping"],
    "constitutional": ["fundamental rights", "article", "constitution", "writ", "pil", "habeas corpus",
                       "mandamus", "freedom", "equality", "discrimination", "reservation", "right to life"]
}

SYSTEM_PROMPT = """You are NaayVadh, an expert AI Legal Assistant specializing in Indian law. You behave exactly like an experienced Indian advocate/lawyer with deep expertise across all legal domains.

YOUR CORE BEHAVIOR:
1. When a user describes an incident, you MUST ask ONE focused, legally strategic follow-up question at a time.
2. Think like a professional advocate gathering facts: timeline, jurisdiction, parties involved, intent, documents, witnesses, damages, contracts, statutory elements, and evidence.
3. NEVER ask multiple questions at once. Ask ONE question, wait for the answer, then ask the next.
4. Keep track of what information you've already gathered. NEVER repeat questions.
5. Be empathetic but professional. Use simple language the user can understand.

INFORMATION GATHERING SEQUENCE:
- First understand the basic incident/issue
- Ask about timeline (when did this happen?)
- Ask about jurisdiction (where did this happen? which state/city?)
- Ask about parties involved (who are the parties?)
- Ask about intent and circumstances
- Ask about existing documents or evidence
- Ask about witnesses
- Ask about any prior legal action taken
- Ask about desired outcome

LEGAL ANALYSIS PROTOCOL:
- Dynamically detect the legal domain from the conversation
- Identify applicable IPC, CrPC, CPC, IT Act, or other relevant Indian statutes
- Consider both primary and substitute evidence if direct proof is unavailable
- Reference relevant sections and their implications

WHEN SUFFICIENT INFO IS GATHERED:
When you believe you have enough information to prepare a comprehensive legal report, you MUST say EXACTLY:
"I have gathered sufficient information to prepare your legal report. Would you like to add anything before I generate the report?"

REPORT GENERATION:
When the user confirms they want the report, generate a structured professional legal report with these sections:
1. **INCIDENT SUMMARY** - Comprehensive factual summary of the case
2. **LEGAL CLASSIFICATION** - Domain and nature of the legal issue
3. **APPLICABLE LAWS AND SECTIONS** - All relevant statutes with section numbers and their implications
4. **SIMILAR CASE REFERENCES** - Real Indian court case precedents that are similar to this situation. For each case, mention:
   - Case name and citation
   - Brief facts of the case
   - How the court ruled
   - How it relates to the user's case
   - Whether the outcome was favorable for a party in a similar position
5. **SUGGESTED EVIDENCE** - Both primary and substitute evidence the user should gather
6. **LEGAL RISKS** - Potential challenges, risks, and weaknesses in the case
7. **RECOMMENDED NEXT STEPS** - Actionable steps the user should take, including filing deadlines
8. **CHANCES OF WINNING THE CASE** - This is a CRITICAL section. Based on ALL the information gathered, provide:
   - An overall percentage estimate of winning chances (e.g., "65-75% chances of winning")
   - Factors that STRENGTHEN the case (list each with explanation)
   - Factors that WEAKEN the case (list each with explanation)
   - Comparison with similar case outcomes
   - What can be done to IMPROVE the chances
   - A clear verdict prediction: "STRONG CASE", "MODERATE CASE", or "WEAK CASE" with reasoning

IMPORTANT RULES:
- Always respond in a professional, lawyer-like manner
- Use Indian legal terminology correctly
- Reference specific sections of law when applicable
- Be thorough but concise
- If the user mentions something outside Indian law jurisdiction, politely redirect
- Format your responses with markdown for clarity
- When providing similar cases, use REAL landmark Indian cases that are well-known and relevant
- The "CHANCES OF WINNING" section must be honest, balanced, and based on legal merit
"""


def detect_legal_domain(text: str) -> str:
    """Detect the legal domain from user's text."""
    text_lower = text.lower()
    domain_scores = {}
    
    for domain, keywords in LEGAL_DOMAINS.items():
        score = sum(1 for keyword in keywords if keyword in text_lower)
        if score > 0:
            domain_scores[domain] = score
    
    if domain_scores:
        return max(domain_scores, key=domain_scores.get)
    return "general"


def check_sufficient_info(messages: List[Dict]) -> bool:
    """Check if we have gathered enough information based on conversation length."""
    user_messages = [m for m in messages if m.get("role") == "user"]
    return len(user_messages) >= 5


# Current Gemini flash models (2.5 / flash-latest→3.5) are "thinking" models:
# by default they spend part of the output-token budget on internal reasoning,
# which can leave NO tokens for the actual answer (empty `parts`). We disable
# thinking for predictable text output.
THINKING_CONFIG = {"thinkingBudget": 0}


def _extract_text_from_response(data: dict) -> str:
    """Pull the answer text out of a Gemini generateContent response.

    Skips any 'thought' parts and tolerates missing fields / safety blocks,
    returning '' instead of raising so callers can fall back gracefully.
    """
    try:
        candidates = data.get("candidates") or []
        if not candidates:
            return ""
        parts = (candidates[0].get("content") or {}).get("parts") or []
        texts = [
            p.get("text", "")
            for p in parts
            if p.get("text") and not p.get("thought")
        ]
        return "".join(texts).strip()
    except (KeyError, IndexError, TypeError, AttributeError):
        return ""


async def search_legal_precedents_via_gemini(query: str, legal_domain: str, case_details: str) -> List[Dict]:
    """
    Use Gemini API to find relevant Indian legal case precedents
    instead of Indian Kanoon API.
    """
    if not GEMINI_API_KEY:
        return []

    search_prompt = f"""You are an expert Indian legal researcher. Based on the following case details and legal domain, provide exactly 5 REAL, well-known Indian court case precedents that are most relevant and similar to this situation.

Legal Domain: {legal_domain}
Search Query: {query}
Case Details: {case_details}

For EACH case, provide the following information in EXACTLY this JSON format:
[
  {{
    "title": "Full case name (e.g., State of Maharashtra vs. Prakash Daulat Rao)",
    "citation": "Case citation (e.g., AIR 1992 SC 573 or (2017) 10 SCC 1)",
    "court": "Which court decided this (e.g., Supreme Court of India, High Court of Delhi)",
    "year": "Year of judgment",
    "brief_facts": "2-3 sentence summary of the case facts",
    "ruling": "What the court decided and key legal principles established",
    "relevance": "How this case is similar to the user's situation and what it means for their case",
    "outcome_favorable": true or false (whether the outcome would be favorable for someone in the user's position),
    "url": "https://indiankanoon.org/search/?formInput=CASE_NAME"
  }}
]

CRITICAL RULES:
- Only provide REAL Indian court cases that actually exist
- Include landmark Supreme Court and High Court cases
- Focus on cases with similar facts and legal issues
- Include the actual citation if known
- Be accurate about the rulings and legal principles
- Return ONLY the JSON array, no other text"""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent",
                headers={
                    "Content-Type": "application/json",
                    "X-goog-api-key": GEMINI_API_KEY
                },
                json={
                    "contents": [{
                        "parts": [{"text": search_prompt}]
                    }],
                    "generationConfig": {
                        "temperature": 0.3,
                        "topP": 0.8,
                        "maxOutputTokens": 4096,
                        "thinkingConfig": THINKING_CONFIG
                    }
                }
            )

            if response.status_code == 200:
                data = response.json()
                try:
                    ai_text = _extract_text_from_response(data)
                    # Extract JSON from the response
                    # Try to find JSON array in the response
                    json_match = re.search(r'\[[\s\S]*\]', ai_text)
                    if json_match:
                        cases = json.loads(json_match.group())
                        results = []
                        for case in cases[:5]:
                            results.append({
                                "title": case.get("title", "Untitled Case"),
                                "citation": case.get("citation", ""),
                                "court": case.get("court", ""),
                                "year": case.get("year", ""),
                                "brief_facts": case.get("brief_facts", ""),
                                "ruling": case.get("ruling", ""),
                                "relevance": case.get("relevance", ""),
                                "outcome_favorable": case.get("outcome_favorable", False),
                                "url": case.get("url", "")
                            })
                        return results
                except (KeyError, IndexError, json.JSONDecodeError) as e:
                    print(f"Error parsing Gemini precedent response: {e}")
                    return []
            else:
                print(f"Gemini precedent search error: {response.status_code} - {response.text}")
                return []
    except Exception as e:
        print(f"Gemini precedent search exception: {e}")
        return []


async def generate_ai_response(
    messages: List[Dict],
    user_message: str,
    legal_domain: str = "general"
) -> Tuple[str, str, Optional[List[Dict]]]:
    """
    Generate AI response using Gemini API.
    Returns: (response_text, message_type, precedents)
    """
    if not GEMINI_API_KEY:
        return "API key not configured. Please set GEMINI_API_KEY.", "error", None

    # Build conversation context
    conversation_parts = []
    
    # Add system prompt
    conversation_parts.append({
        "role": "user",
        "parts": [{"text": SYSTEM_PROMPT}]
    })
    conversation_parts.append({
        "role": "model",
        "parts": [{"text": "Understood. I am NaayVadh, your AI Legal Assistant. I will behave as an experienced Indian advocate, asking strategic follow-up questions one at a time, tracking gathered information, and providing comprehensive legal analysis including similar case references and honest assessment of winning chances. How may I assist you today?"}]
    })
    
    # Add previous messages (ensuring alternating roles for Gemini API)
    for msg in messages:
        role = "user" if msg["role"] == "user" else "model"
        # Merge if same role as last message (Gemini requires alternating roles)
        if conversation_parts and conversation_parts[-1]["role"] == role:
            conversation_parts[-1]["parts"][0]["text"] += "\n" + msg["content"]
        else:
            conversation_parts.append({
                "role": role,
                "parts": [{"text": msg["content"]}]
            })
    
    # Add current message (merge if last was also user)
    if conversation_parts and conversation_parts[-1]["role"] == "user":
        conversation_parts[-1]["parts"][0]["text"] += "\n" + user_message
    else:
        conversation_parts.append({
            "role": "user",
            "parts": [{"text": user_message}]
        })

    # Determine if we should search for precedents
    precedents = None
    is_report_request = any(phrase in user_message.lower() for phrase in [
        "generate", "report", "yes", "proceed", "go ahead", "ready", "no nothing", "nothing more", "that's all", "thats all"
    ])
    
    # Check if AI previously asked about report and user is confirming
    if messages and len(messages) > 0:
        last_ai_msg = ""
        for m in reversed(messages):
            if m["role"] == "assistant":
                last_ai_msg = m["content"].lower()
                break
        
        if "sufficient information" in last_ai_msg and "report" in last_ai_msg:
            is_report_request = True
    
    message_type = "text"
    
    if is_report_request and legal_domain != "general":
        # Build case details from all user messages for better precedent search
        all_user_text = " ".join([m["content"] for m in messages if m["role"] == "user"])
        all_user_text += " " + user_message
        
        # Extract key terms for search
        key_terms = extract_key_legal_terms(all_user_text)
        search_query = f"{key_terms} {legal_domain} India" if key_terms else f"{legal_domain} law India case"
        
        # Use Gemini to find relevant case precedents (replacing Indian Kanoon)
        precedents = await search_legal_precedents_via_gemini(
            query=search_query,
            legal_domain=legal_domain,
            case_details=all_user_text
        )
        
        # Add precedent context to the prompt
        if precedents:
            precedent_text = "\n\nRELEVANT CASE PRECEDENTS FOUND (use these in your report):\n"
            favorable_count = 0
            unfavorable_count = 0
            
            for i, p in enumerate(precedents, 1):
                precedent_text += f"\n{i}. **{p['title']}**"
                if p.get('citation'):
                    precedent_text += f"\n   Citation: {p['citation']}"
                if p.get('court'):
                    precedent_text += f"\n   Court: {p['court']}"
                if p.get('year'):
                    precedent_text += f"\n   Year: {p['year']}"
                if p.get('brief_facts'):
                    precedent_text += f"\n   Facts: {p['brief_facts']}"
                if p.get('ruling'):
                    precedent_text += f"\n   Ruling: {p['ruling']}"
                if p.get('relevance'):
                    precedent_text += f"\n   Relevance to this case: {p['relevance']}"
                if p.get('url'):
                    precedent_text += f"\n   Reference: {p['url']}"
                
                if p.get('outcome_favorable'):
                    favorable_count += 1
                else:
                    unfavorable_count += 1
            
            precedent_text += f"\n\nPRECEDENT ANALYSIS SUMMARY:"
            precedent_text += f"\n- Cases with FAVORABLE outcomes for similar position: {favorable_count}"
            precedent_text += f"\n- Cases with UNFAVORABLE outcomes for similar position: {unfavorable_count}"
            
            precedent_text += "\n\nIMPORTANT INSTRUCTIONS FOR REPORT GENERATION:"
            precedent_text += "\n1. Incorporate these real case precedents in the 'SIMILAR CASE REFERENCES' section."
            precedent_text += "\n2. For each similar case, explain HOW it relates to the user's situation."
            precedent_text += "\n3. In the 'CHANCES OF WINNING THE CASE' section, you MUST provide:"
            precedent_text += "\n   - A percentage estimate of winning chances"
            precedent_text += "\n   - Factors strengthening the case"
            precedent_text += "\n   - Factors weakening the case"
            precedent_text += "\n   - Comparison with similar case outcomes listed above"
            precedent_text += "\n   - What can be done to improve chances"
            precedent_text += "\n   - Overall verdict: STRONG CASE / MODERATE CASE / WEAK CASE"
            precedent_text += "\n4. Generate the COMPLETE structured legal report now with ALL sections."
            
            # Merge with last user message or add as new
            if conversation_parts[-1]["role"] == "user":
                conversation_parts[-1]["parts"][0]["text"] += precedent_text
            else:
                conversation_parts.append({
                    "role": "user",
                    "parts": [{"text": precedent_text}]
                })
        else:
            # Even without precedents, instruct to include winning chances
            extra_instruction = "\n\nIMPORTANT: Even without specific case precedents, you MUST include:"
            extra_instruction += "\n1. A 'SIMILAR CASE REFERENCES' section with well-known relevant Indian cases you know about."
            extra_instruction += "\n2. A 'CHANCES OF WINNING THE CASE' section with percentage estimate, strengthening/weakening factors, and overall verdict."
            extra_instruction += "\nGenerate the COMPLETE structured legal report now with ALL sections."
            
            if conversation_parts[-1]["role"] == "user":
                conversation_parts[-1]["parts"][0]["text"] += extra_instruction
            else:
                conversation_parts.append({
                    "role": "user",
                    "parts": [{"text": extra_instruction}]
                })
        
        message_type = "report"

    max_retries = 3
    retry_delays = [10, 20, 40]  # seconds

    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent",
                    headers={
                        "Content-Type": "application/json",
                        "X-goog-api-key": GEMINI_API_KEY
                    },
                    json={
                        "contents": conversation_parts,
                        "generationConfig": {
                            "temperature": 0.7,
                            "topP": 0.9,
                            "topK": 40,
                            "maxOutputTokens": 8192,
                            "thinkingConfig": THINKING_CONFIG
                        }
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    ai_text = _extract_text_from_response(data)

                    if not ai_text:
                        # Empty response (e.g. safety block or no content returned)
                        return "I apologize, I encountered an issue processing my response. Could you please rephrase your question?", "error", None

                    # Check if AI is asking about report readiness
                    if "sufficient information" in ai_text.lower() and "report" in ai_text.lower():
                        message_type = "follow_up"

                    return ai_text, message_type, precedents
                elif response.status_code == 429 or response.status_code >= 500:
                    # 429 = rate limit (needs longer backoff); 5xx = transient
                    # Gemini overload/unavailability (503/500/502/504) — retry both.
                    if attempt < max_retries - 1:
                        delay = retry_delays[attempt] if response.status_code == 429 else (attempt + 1) * 3
                        print(f"Transient Gemini error {response.status_code}. Retrying in {delay}s... (attempt {attempt + 1}/{max_retries})")
                        await asyncio.sleep(delay)
                        continue
                    elif response.status_code == 429:
                        return "⚠️ The AI service is currently at capacity (rate limit reached). Please wait a moment and try again. If this persists, the API quota may need to be upgraded.", "error", None
                    else:
                        return "⚠️ The AI service is temporarily unavailable. Please try again in a moment.", "error", None
                else:
                    error_detail = response.text
                    print(f"Gemini API error {response.status_code}: {error_detail}")
                    return f"I'm experiencing a temporary issue (Error {response.status_code}). Please try again shortly.", "error", None
                    
        except httpx.TimeoutException:
            if attempt < max_retries - 1:
                print(f"Timeout on attempt {attempt + 1}. Retrying...")
                await asyncio.sleep(5)
                continue
            return "The request took too long. Please try again.", "error", None
        except Exception as e:
            print(f"Gemini API exception: {e}")
            return f"An unexpected error occurred. Please try again.", "error", None


def extract_key_legal_terms(text: str) -> str:
    """Extract key legal terms from conversation text for precedent search."""
    legal_keywords = [
        "murder", "theft", "robbery", "assault", "rape", "kidnapping", "fraud", "cheating",
        "divorce", "custody", "maintenance", "alimony", "property", "land", "tenant",
        "contract", "agreement", "breach", "negligence", "defamation",
        "cyber", "hacking", "data breach", "online fraud",
        "employment", "termination", "wages", "harassment",
        "consumer", "defective product", "refund",
        "fundamental rights", "discrimination", "writ",
        "bail", "anticipatory bail", "fir", "chargesheet",
        "company", "director", "shareholder", "insolvency",
        "section 302", "section 376", "section 420", "section 498a",
        "ipc", "crpc", "cpc", "it act", "dowry",
        "domestic violence", "stalking", "threat", "extortion",
        "accident", "compensation", "medical negligence", "malpractice",
        "eviction", "possession", "encroachment", "partition",
        "cheque bounce", "dishonour", "section 138"
    ]
    
    text_lower = text.lower()
    found_terms = [term for term in legal_keywords if term in text_lower]
    
    return " ".join(found_terms[:5]) if found_terms else ""


async def generate_chat_title(user_message: str) -> str:
    """Generate a concise legal case title from the user's first message using Gemini."""
    if not GEMINI_API_KEY:
        return user_message[:50]

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent",
                headers={
                    "Content-Type": "application/json",
                    "X-goog-api-key": GEMINI_API_KEY
                },
                json={
                    "contents": [{
                        "parts": [{
                            "text": f"Generate a short professional legal case title (maximum 6 words) for this incident. Only return the title, nothing else. No quotes.\n\nIncident: {user_message}"
                        }]
                    }],
                    "generationConfig": {
                        "temperature": 0.3,
                        "maxOutputTokens": 50,
                        "thinkingConfig": THINKING_CONFIG
                    }
                }
            )

            if response.status_code == 200:
                data = response.json()
                title = _extract_text_from_response(data).strip('"\'')
                return title[:60] if title else user_message[:50]
    except Exception as e:
        print(f"Title generation error: {e}")

    # Fallback to truncated message
    return user_message[:50]
