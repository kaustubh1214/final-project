from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List

from database import get_db
from models import User, Chat, Message
from schemas import (
    ChatCreate, ChatResponse, MessageCreate, MessageResponse,
    ChatWithMessages, AIResponse
)
from auth import get_current_user
from ai_service import generate_ai_response, detect_legal_domain, check_sufficient_info, generate_chat_title

router = APIRouter(prefix="/api/chats", tags=["Chats"])


@router.post("/", response_model=ChatResponse)
async def create_chat(
    chat_data: ChatCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    new_chat = Chat(
        user_id=current_user.id,
        title=chat_data.title or "New Consultation"
    )
    db.add(new_chat)
    await db.commit()
    await db.refresh(new_chat)
    return new_chat


@router.get("/", response_model=List[ChatResponse])
async def get_chats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Chat)
        .where(Chat.user_id == current_user.id)
        .order_by(desc(Chat.updated_at))
    )
    chats = result.scalars().all()
    return chats


@router.get("/{chat_id}", response_model=ChatWithMessages)
async def get_chat(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Chat).where(Chat.id == chat_id, Chat.user_id == current_user.id)
    )
    chat = result.scalar_one_or_none()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    msgs_result = await db.execute(
        select(Message).where(Message.chat_id == chat_id).order_by(Message.created_at)
    )
    messages = msgs_result.scalars().all()
    
    return ChatWithMessages(
        chat=ChatResponse(
            id=chat.id,
            title=chat.title,
            created_at=chat.created_at,
            updated_at=chat.updated_at,
            is_report_generated=chat.is_report_generated,
            legal_domain=chat.legal_domain
        ),
        messages=[
            MessageResponse(
                id=m.id,
                chat_id=m.chat_id,
                role=m.role,
                content=m.content,
                created_at=m.created_at,
                message_type=m.message_type
            ) for m in messages
        ]
    )


@router.delete("/{chat_id}")
async def delete_chat(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Chat).where(Chat.id == chat_id, Chat.user_id == current_user.id)
    )
    chat = result.scalar_one_or_none()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    await db.delete(chat)
    await db.commit()
    return {"message": "Chat deleted successfully"}


@router.post("/{chat_id}/messages", response_model=AIResponse)
async def send_message(
    chat_id: int,
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify chat ownership
    result = await db.execute(
        select(Chat).where(Chat.id == chat_id, Chat.user_id == current_user.id)
    )
    chat = result.scalar_one_or_none()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Save user message
    user_msg = Message(
        chat_id=chat_id,
        role="user",
        content=message_data.content,
        message_type="text"
    )
    db.add(user_msg)
    await db.commit()
    
    # Get conversation history
    msgs_result = await db.execute(
        select(Message).where(Message.chat_id == chat_id).order_by(Message.created_at)
    )
    all_messages = msgs_result.scalars().all()
    
    # Build messages for context
    conversation_history = [
        {"role": m.role, "content": m.content}
        for m in all_messages[:-1]  # Exclude the current message
    ]
    
    # Detect legal domain from all user messages
    all_user_text = " ".join([m.content for m in all_messages if m.role == "user"])
    legal_domain = detect_legal_domain(all_user_text)
    
    # Update chat domain
    if legal_domain != "general":
        chat.legal_domain = legal_domain
    
    # Update chat title from first message if it's still default
    if chat.title == "New Consultation" and len([m for m in all_messages if m.role == "user"]) == 1:
        chat.title = await generate_chat_title(message_data.content)
    
    # Generate AI response
    ai_text, message_type, precedents = await generate_ai_response(
        conversation_history,
        message_data.content,
        legal_domain
    )
    
    # Save AI response
    ai_msg = Message(
        chat_id=chat_id,
        role="assistant",
        content=ai_text,
        message_type=message_type
    )
    db.add(ai_msg)
    
    # Mark report as generated if applicable
    if message_type == "report":
        chat.is_report_generated = True
    
    await db.commit()
    
    return AIResponse(
        message=ai_text,
        message_type=message_type,
        legal_domain=legal_domain,
        precedents=precedents
    )
