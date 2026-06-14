import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
    HiPlus, HiChat, HiTrash, HiLogout, HiScale,
    HiSun, HiMoon, HiChevronDown, HiChevronRight,
    HiX, HiClock, HiUser
} from 'react-icons/hi';

export default function Sidebar({
    isOpen, onClose, chats, activeChat, onNewChat,
    onSelectChat, onDeleteChat, onLogout, user, loading
}) {
    const { theme, toggleTheme } = useTheme();
    const [previousChatsOpen, setPreviousChatsOpen] = useState(true);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:relative z-40 h-full flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full lg:w-0 lg:-translate-x-full'
                    } ${theme === 'dark'
                        ? 'bg-dark-800/95 border-r border-dark-600/50'
                        : 'bg-white/95 border-r border-gray-200'
                    } backdrop-blur-xl`}
            >
                <div className={`flex flex-col h-full ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200 overflow-hidden`}>
                    {/* Header */}
                    <div className={`p-4 flex items-center justify-between border-b ${theme === 'dark' ? 'border-dark-600/50' : 'border-gray-200'
                        }`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark'
                                    ? 'bg-gradient-to-br from-gold-500/20 to-gold-700/20 border border-gold-500/30'
                                    : 'bg-gradient-to-br from-primary-100 to-primary-200'
                                }`}>
                                <HiScale className={`text-lg ${theme === 'dark' ? 'text-gold-400' : 'text-primary-600'}`} />
                            </div>
                            <div>
                                <h1 className={`text-sm font-bold font-[Playfair_Display] ${theme === 'dark' ? 'text-white' : 'text-gray-800'
                                    }`}>NyayaVaad</h1>
                                <p className={`text-[10px] uppercase tracking-widest ${theme === 'dark' ? 'text-gold-500/60' : 'text-primary-400'
                                    }`}>Legal AI</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={`lg:hidden p-1.5 rounded-lg ${theme === 'dark' ? 'text-dark-300 hover:text-white hover:bg-dark-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <HiX size={18} />
                        </button>
                    </div>

                    {/* New Chat Button */}
                    <div className="p-3">
                        <button
                            onClick={onNewChat}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${theme === 'dark'
                                    ? 'bg-gradient-to-r from-gold-600/20 to-gold-500/10 text-gold-400 border border-gold-500/20 hover:from-gold-600/30 hover:to-gold-500/20 hover:border-gold-500/40'
                                    : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md hover:shadow-lg hover:shadow-primary-200'
                                }`}
                            id="new-chat-btn"
                        >
                            <HiPlus size={18} />
                            New Consultation
                        </button>
                    </div>

                    {/* Previous Chats */}
                    <div className="flex-1 overflow-y-auto px-3 pb-3">
                        <button
                            onClick={() => setPreviousChatsOpen(!previousChatsOpen)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg mb-1 transition-colors ${theme === 'dark'
                                    ? 'text-dark-200 hover:text-white hover:bg-dark-700/50'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            id="previous-chats-toggle"
                        >
                            {previousChatsOpen ? <HiChevronDown size={14} /> : <HiChevronRight size={14} />}
                            Previous Chats
                            <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${theme === 'dark' ? 'bg-dark-600 text-dark-200' : 'bg-gray-200 text-gray-500'
                                }`}>
                                {chats.length}
                            </span>
                        </button>

                        {previousChatsOpen && (
                            <div className="space-y-1 animate-fade-in">
                                {loading ? (
                                    <div className="flex justify-center py-8">
                                        <div className={`w-5 h-5 rounded-full border-2 border-t-transparent animate-spin ${theme === 'dark' ? 'border-gold-500' : 'border-primary-500'
                                            }`} />
                                    </div>
                                ) : chats.length === 0 ? (
                                    <div className={`text-center py-8 px-4 ${theme === 'dark' ? 'text-dark-300' : 'text-gray-400'
                                        }`}>
                                        <HiChat className="mx-auto text-3xl mb-2 opacity-40" />
                                        <p className="text-xs">No consultations yet</p>
                                        <p className="text-[10px] mt-1 opacity-60">Start a new consultation above</p>
                                    </div>
                                ) : (
                                    chats.map((chat) => (
                                        <div
                                            key={chat.id}
                                            className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${activeChat?.id === chat.id
                                                    ? theme === 'dark'
                                                        ? 'bg-gold-500/10 border border-gold-500/20 text-gold-300'
                                                        : 'bg-primary-50 border border-primary-200 text-primary-700'
                                                    : theme === 'dark'
                                                        ? 'text-dark-100 hover:bg-dark-700/50 border border-transparent'
                                                        : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                                                }`}
                                            onClick={() => onSelectChat(chat)}
                                        >
                                            <HiChat className={`flex-shrink-0 text-sm ${activeChat?.id === chat.id
                                                    ? theme === 'dark' ? 'text-gold-400' : 'text-primary-500'
                                                    : theme === 'dark' ? 'text-dark-400' : 'text-gray-400'
                                                }`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium truncate">{chat.title}</p>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <HiClock className="text-[10px] opacity-50" />
                                                    <span className="text-[10px] opacity-50">{formatDate(chat.updated_at)}</span>
                                                    {chat.legal_domain && (
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ml-1 ${theme === 'dark'
                                                                ? 'bg-primary-500/10 text-primary-400'
                                                                : 'bg-primary-50 text-primary-500'
                                                            }`}>
                                                            {chat.legal_domain}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                                                className={`opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all ${theme === 'dark'
                                                        ? 'text-dark-400 hover:text-red-400 hover:bg-red-500/10'
                                                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                                    }`}
                                                id={`delete-chat-${chat.id}`}
                                            >
                                                <HiTrash size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Bottom Section */}
                    <div className={`p-3 border-t space-y-2 ${theme === 'dark' ? 'border-dark-600/50' : 'border-gray-200'
                        }`}>
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${theme === 'dark'
                                    ? 'text-dark-200 hover:text-white hover:bg-dark-700/50'
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                            id="sidebar-theme-toggle"
                        >
                            {theme === 'dark' ? <HiSun size={16} /> : <HiMoon size={16} />}
                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </button>

                        {/* User Info & Logout */}
                        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${theme === 'dark' ? 'bg-dark-700/30' : 'bg-gray-50'
                            }`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${theme === 'dark'
                                    ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white'
                                    : 'bg-gradient-to-br from-primary-400 to-primary-600 text-white'
                                }`}>
                                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-xs font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-800'
                                    }`}>{user?.full_name}</p>
                                <p className={`text-[10px] truncate ${theme === 'dark' ? 'text-dark-300' : 'text-gray-400'
                                    }`}>{user?.email}</p>
                            </div>
                            <button
                                onClick={onLogout}
                                className={`p-1.5 rounded-lg transition-all ${theme === 'dark'
                                        ? 'text-dark-400 hover:text-red-400 hover:bg-red-500/10'
                                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                    }`}
                                title="Logout"
                                id="logout-btn"
                            >
                                <HiLogout size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
