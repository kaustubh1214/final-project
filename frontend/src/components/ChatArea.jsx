import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import ReactMarkdown from 'react-markdown';
import { HiPaperAirplane, HiScale, HiDocumentDownload, HiSparkles } from 'react-icons/hi';
import { generatePDF } from '../utils/pdfGenerator';

export default function ChatArea({ activeChat, messages, onSendMessage, user }) {
    const { theme } = useTheme();
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
        }
    }, [input]);

    const handleSend = async () => {
        if (!input.trim() || sending) return;

        const msg = input.trim();
        setInput('');
        setSending(true);

        try {
            await onSendMessage(msg);
        } catch (err) {
            console.error('Failed to send:', err);
        } finally {
            setSending(false);
            textareaRef.current?.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleDownloadPDF = (content) => {
        generatePDF(content, activeChat?.title || 'Legal Report');
    };

    // Empty state
    if (!activeChat && messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
                <div className="text-center max-w-lg animate-fade-in-up">
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 ${theme === 'dark'
                        ? 'bg-gradient-to-br from-gold-500/10 to-gold-700/10 border border-gold-500/20'
                        : 'bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200'
                        }`}>
                        <HiScale className={`text-4xl ${theme === 'dark' ? 'text-gold-400' : 'text-primary-500'}`} />
                    </div>

                    <h2 className={`text-2xl font-bold font-[Playfair_Display] mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-800'
                        }`}>
                        Welcome to <span className={theme === 'dark' ? 'text-gradient-gold' : 'text-gradient-primary'}>NyayaVaad</span>
                    </h2>

                    <p className={`text-sm mb-8 leading-relaxed ${theme === 'dark' ? 'text-dark-200' : 'text-gray-500'
                        }`}>
                        Your AI Legal Assistant for Indian Law. Describe your legal situation
                        and I'll guide you through the process like an experienced advocate.
                    </p>

                    {/* Quick Start Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                        {[
                            { icon: '⚖️', title: 'Criminal Law', desc: 'FIR, Bail, IPC sections' },
                            { icon: '🏠', title: 'Property Law', desc: 'Land disputes, tenancy' },
                            { icon: '👨‍👩‍👧', title: 'Family Law', desc: 'Divorce, custody, maintenance' }
                        ].map((item, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setInput(`I need legal advice regarding ${item.title.toLowerCase()}. `);
                                    textareaRef.current?.focus();
                                }}
                                className={`p-4 rounded-xl text-left transition-all duration-300 hover:-translate-y-1 ${theme === 'dark'
                                    ? 'bg-dark-700/30 border border-dark-500/30 hover:border-gold-500/30 hover:bg-dark-700/50'
                                    : 'bg-white border border-gray-200 hover:border-primary-300 hover:shadow-md'
                                    }`}
                            >
                                <span className="text-2xl mb-2 block">{item.icon}</span>
                                <p className={`text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-800'
                                    }`}>{item.title}</p>
                                <p className={`text-[10px] ${theme === 'dark' ? 'text-dark-300' : 'text-gray-400'
                                    }`}>{item.desc}</p>
                            </button>
                        ))}
                    </div>

                    {/* Additional domains */}
                    <div className="flex flex-wrap justify-center gap-2">
                        {['Corporate', 'Cyber Crime', 'Consumer', 'Labor', 'Constitutional', 'Civil'].map((domain) => (
                            <button
                                key={domain}
                                onClick={() => {
                                    setInput(`I need legal help with a ${domain.toLowerCase()} law matter. `);
                                    textareaRef.current?.focus();
                                }}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${theme === 'dark'
                                    ? 'bg-dark-700/30 text-dark-200 border border-dark-500/30 hover:border-gold-500/30 hover:text-gold-400'
                                    : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
                                    }`}
                            >
                                {domain}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Input area even without active chat */}
                <div className={`absolute bottom-0 left-0 right-0 p-4 ${theme === 'dark' ? 'bg-gradient-to-t from-dark-900 via-dark-900/95 to-transparent' : 'bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent'
                    }`}>
                    <div className="max-w-3xl mx-auto">
                        <div className={`flex items-end gap-3 p-2 rounded-2xl ${theme === 'dark'
                            ? 'bg-dark-700/60 border border-dark-500/40'
                            : 'bg-white border border-gray-200 shadow-lg shadow-gray-100'
                            } backdrop-blur-xl`}>
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Describe your legal situation..."
                                rows={1}
                                className={`flex-1 resize-none px-4 py-3 text-sm outline-none bg-transparent ${theme === 'dark'
                                    ? 'text-white placeholder-dark-300'
                                    : 'text-gray-800 placeholder-gray-400'
                                    }`}
                                id="chat-input"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || sending}
                                className={`p-3 rounded-xl transition-all duration-300 ${input.trim()
                                    ? theme === 'dark'
                                        ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-dark-900 hover:shadow-lg hover:shadow-gold-500/20'
                                        : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg hover:shadow-primary-500/20'
                                    : theme === 'dark'
                                        ? 'bg-dark-600 text-dark-400'
                                        : 'bg-gray-100 text-gray-400'
                                    } ${sending ? 'opacity-50' : ''}`}
                                id="send-btn"
                            >
                                {sending ? (
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                ) : (
                                    <HiPaperAirplane size={20} className="rotate-90" />
                                )}
                            </button>
                        </div>
                        <p className={`text-center text-[10px] mt-2 ${theme === 'dark' ? 'text-dark-400' : 'text-gray-400'
                            }`}>
                            NyayaVaad provides AI-assisted legal information. Always consult a qualified lawyer for official legal advice.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col relative min-w-0">
            {/* Chat Header */}
            <div className={`flex-shrink-0 px-6 py-3 flex items-center justify-between border-b ${theme === 'dark'
                ? 'bg-dark-800/80 border-dark-600/50'
                : 'bg-white/80 border-gray-200'
                } backdrop-blur-xl`}>
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark'
                        ? 'bg-gold-500/10 border border-gold-500/20'
                        : 'bg-primary-50 border border-primary-200'
                        }`}>
                        <HiSparkles className={`text-sm ${theme === 'dark' ? 'text-gold-400' : 'text-primary-500'}`} />
                    </div>
                    <div className="min-w-0">
                        <h2 className={`text-sm font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-800'
                            }`}>{activeChat?.title || 'New Consultation'}</h2>
                        {activeChat?.legal_domain && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${theme === 'dark'
                                ? 'bg-primary-500/10 text-primary-400'
                                : 'bg-primary-50 text-primary-500'
                                }`}>
                                {activeChat.legal_domain} law
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    {messages.map((msg, idx) => (
                        <div
                            key={msg.id || idx}
                            className={`flex gap-3 animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'
                                }`}
                        >
                            {msg.role === 'assistant' && (
                                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-1 ${theme === 'dark'
                                    ? 'bg-gradient-to-br from-gold-500/20 to-gold-700/20 border border-gold-500/20'
                                    : 'bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200'
                                    }`}>
                                    <HiScale className={`text-sm ${theme === 'dark' ? 'text-gold-400' : 'text-primary-500'}`} />
                                </div>
                            )}

                            <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                    ? theme === 'dark'
                                        ? 'bg-gradient-to-r from-primary-700 to-primary-600 text-white rounded-tr-md'
                                        : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-tr-md'
                                    : msg.message_type === 'report'
                                        ? theme === 'dark'
                                            ? 'bg-dark-700/60 border border-gold-500/20 text-dark-50 rounded-tl-md'
                                            : 'bg-white border border-primary-200 text-gray-800 rounded-tl-md shadow-sm'
                                        : theme === 'dark'
                                            ? 'bg-dark-700/60 border border-dark-500/30 text-dark-50 rounded-tl-md'
                                            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-md shadow-sm'
                                    }`}>
                                    {msg.role === 'assistant' ? (
                                        <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-[Playfair_Display]">
                                            <ReactMarkdown
                                                components={{
                                                    h1: ({ node, ...props }) => <h1 className={`text-lg font-bold mb-2 mt-4 font-[Playfair_Display] ${theme === 'dark' ? 'text-gold-400' : 'text-primary-700'}`} {...props} />,
                                                    h2: ({ node, ...props }) => <h2 className={`text-base font-bold mb-2 mt-3 font-[Playfair_Display] ${theme === 'dark' ? 'text-gold-400' : 'text-primary-600'}`} {...props} />,
                                                    h3: ({ node, ...props }) => <h3 className={`text-sm font-bold mb-1 mt-2 ${theme === 'dark' ? 'text-gold-300' : 'text-primary-600'}`} {...props} />,
                                                    strong: ({ node, ...props }) => <strong className={`font-semibold ${theme === 'dark' ? 'text-gold-300' : 'text-primary-700'}`} {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 my-2" {...props} />,
                                                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 my-2" {...props} />,
                                                    li: ({ node, ...props }) => <li className="text-sm" {...props} />,
                                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                    a: ({ node, ...props }) => <a className={`underline ${theme === 'dark' ? 'text-primary-400' : 'text-primary-600'}`} target="_blank" rel="noopener noreferrer" {...props} />,
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>

                                            {/* Download Report Button */}
                                            {(msg.message_type === 'report' || (msg.role === 'assistant' && msg.content.length > 500 && (
                                                msg.content.includes('INCIDENT SUMMARY') ||
                                                msg.content.includes('APPLICABLE LAWS') ||
                                                msg.content.includes('LEGAL CLASSIFICATION') ||
                                                msg.content.includes('RECOMMENDED NEXT STEPS') ||
                                                msg.content.includes('SUGGESTED EVIDENCE') ||
                                                msg.content.includes('CHANCES OF SUCCESS') ||
                                                msg.content.includes('CHANCES OF WINNING') ||
                                                msg.content.includes('SIMILAR CASE')
                                            ))) && (
                                                    <button
                                                        onClick={() => handleDownloadPDF(msg.content)}
                                                        className={`mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${theme === 'dark'
                                                            ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-dark-900 hover:shadow-lg hover:shadow-gold-500/20'
                                                            : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg hover:shadow-primary-500/20'
                                                            }`}
                                                        id="download-report-btn"
                                                    >
                                                        <HiDocumentDownload size={16} />
                                                        Download Legal Report (PDF)
                                                    </button>
                                                )}
                                        </div>
                                    ) : (
                                        <p>{msg.content}</p>
                                    )}
                                </div>
                                <p className={`text-[10px] mt-1 px-2 ${msg.role === 'user' ? 'text-right' : ''
                                    } ${theme === 'dark' ? 'text-dark-400' : 'text-gray-400'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>

                            {msg.role === 'user' && (
                                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-1 text-xs font-bold ${theme === 'dark'
                                    ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white'
                                    : 'bg-gradient-to-br from-primary-400 to-primary-600 text-white'
                                    }`}>
                                    {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {sending && (
                        <div className="flex gap-3 animate-fade-in">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark'
                                ? 'bg-gradient-to-br from-gold-500/20 to-gold-700/20 border border-gold-500/20'
                                : 'bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200'
                                }`}>
                                <HiScale className={`text-sm ${theme === 'dark' ? 'text-gold-400' : 'text-primary-500'}`} />
                            </div>
                            <div className={`px-4 py-3 rounded-2xl rounded-tl-md ${theme === 'dark'
                                ? 'bg-dark-700/60 border border-dark-500/30'
                                : 'bg-white border border-gray-200 shadow-sm'
                                }`}>
                                <div className="flex gap-1.5">
                                    <div className={`w-2 h-2 rounded-full typing-dot ${theme === 'dark' ? 'bg-gold-400' : 'bg-primary-400'}`} />
                                    <div className={`w-2 h-2 rounded-full typing-dot ${theme === 'dark' ? 'bg-gold-400' : 'bg-primary-400'}`} />
                                    <div className={`w-2 h-2 rounded-full typing-dot ${theme === 'dark' ? 'bg-gold-400' : 'bg-primary-400'}`} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className={`flex-shrink-0 p-4 border-t ${theme === 'dark'
                ? 'bg-dark-800/80 border-dark-600/50'
                : 'bg-white/80 border-gray-200'
                } backdrop-blur-xl`}>
                <div className="max-w-3xl mx-auto">
                    <div className={`flex items-end gap-3 p-2 rounded-2xl ${theme === 'dark'
                        ? 'bg-dark-700/60 border border-dark-500/40'
                        : 'bg-gray-50 border border-gray-200'
                        }`}>
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Describe your legal situation or answer the question..."
                            rows={1}
                            disabled={sending}
                            className={`flex-1 resize-none px-4 py-3 text-sm outline-none bg-transparent ${theme === 'dark'
                                ? 'text-white placeholder-dark-300'
                                : 'text-gray-800 placeholder-gray-400'
                                } ${sending ? 'opacity-50' : ''}`}
                            id="chat-input-active"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || sending}
                            className={`p-3 rounded-xl transition-all duration-300 ${input.trim() && !sending
                                ? theme === 'dark'
                                    ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-dark-900 hover:shadow-lg hover:shadow-gold-500/20'
                                    : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg hover:shadow-primary-500/20'
                                : theme === 'dark'
                                    ? 'bg-dark-600 text-dark-400'
                                    : 'bg-gray-200 text-gray-400'
                                }`}
                            id="send-btn-active"
                        >
                            {sending ? (
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            ) : (
                                <HiPaperAirplane size={20} className="rotate-90" />
                            )}
                        </button>
                    </div>
                    <p className={`text-center text-[10px] mt-2 ${theme === 'dark' ? 'text-dark-400' : 'text-gray-400'
                        }`}>
                        Press Enter to send • Shift+Enter for new line
                    </p>
                </div>
            </div>
        </div>
    );
}
