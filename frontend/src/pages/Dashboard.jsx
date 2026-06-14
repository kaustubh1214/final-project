import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import { BackgroundAnimation } from '../components/LegalScene3D';
import api from '../utils/api';
import { getApiErrorMessage } from '../utils/errors';
import { HiMenuAlt2 } from 'react-icons/hi';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();

    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loadingChats, setLoadingChats] = useState(true);

    const fetchChats = useCallback(async () => {
        try {
            const res = await api.get('/chats/');
            setChats(res.data);
        } catch (err) {
            console.error('Error fetching chats:', err);
            // 401s are handled globally (redirect to login); only surface real failures.
            if (err?.response?.status !== 401) {
                toast.error(getApiErrorMessage(err, 'Failed to load your consultations.'));
            }
        } finally {
            setLoadingChats(false);
        }
    }, []);

    useEffect(() => {
        fetchChats();
    }, [fetchChats]);

    const createNewChat = async () => {
        try {
            const res = await api.post('/chats/', { title: 'New Consultation' });
            setChats(prev => [res.data, ...prev]);
            setActiveChat(res.data);
            setMessages([]);
        } catch (err) {
            console.error('Error creating chat:', err);
            toast.error(getApiErrorMessage(err, 'Could not start a new consultation.'));
        }
    };

    const selectChat = async (chat) => {
        setActiveChat(chat);
        try {
            const res = await api.get(`/chats/${chat.id}`);
            setMessages(res.data.messages);
        } catch (err) {
            console.error('Error loading chat:', err);
            toast.error(getApiErrorMessage(err, 'Failed to open this consultation.'));
        }
    };

    const deleteChat = async (chatId) => {
        if (!window.confirm('Delete this consultation? This action cannot be undone.')) {
            return;
        }
        try {
            await api.delete(`/chats/${chatId}`);
            setChats(prev => prev.filter(c => c.id !== chatId));
            if (activeChat?.id === chatId) {
                setActiveChat(null);
                setMessages([]);
            }
            toast.success('Consultation deleted.');
        } catch (err) {
            console.error('Error deleting chat:', err);
            toast.error(getApiErrorMessage(err, 'Failed to delete consultation.'));
        }
    };

    const sendMessage = async (content) => {
        if (!activeChat) {
            // Create new chat first
            try {
                const chatRes = await api.post('/chats/', { title: 'New Consultation' });
                setChats(prev => [chatRes.data, ...prev]);
                setActiveChat(chatRes.data);

                // Add user message immediately
                const userMsg = {
                    id: Date.now(),
                    chat_id: chatRes.data.id,
                    role: 'user',
                    content,
                    created_at: new Date().toISOString(),
                    message_type: 'text'
                };
                setMessages([userMsg]);

                // Send to AI
                const res = await api.post(`/chats/${chatRes.data.id}/messages`, { content });

                const aiMsg = {
                    id: Date.now() + 1,
                    chat_id: chatRes.data.id,
                    role: 'assistant',
                    content: res.data.message,
                    created_at: new Date().toISOString(),
                    message_type: res.data.message_type
                };
                setMessages(prev => [...prev, aiMsg]);

                // Update chat title
                fetchChats();
                return res.data;
            } catch (err) {
                console.error('Error:', err);
                toast.error(getApiErrorMessage(err, 'Failed to send your message.'));
                throw err;
            }
        }

        // Add user message immediately
        const userMsg = {
            id: Date.now(),
            chat_id: activeChat.id,
            role: 'user',
            content,
            created_at: new Date().toISOString(),
            message_type: 'text'
        };
        setMessages(prev => [...prev, userMsg]);

        try {
            const res = await api.post(`/chats/${activeChat.id}/messages`, { content });

            const aiMsg = {
                id: Date.now() + 1,
                chat_id: activeChat.id,
                role: 'assistant',
                content: res.data.message,
                created_at: new Date().toISOString(),
                message_type: res.data.message_type
            };
            setMessages(prev => [...prev, aiMsg]);

            // Refresh chats to update title
            fetchChats();
            return res.data;
        } catch (err) {
            console.error('Error sending message:', err);
            toast.error(getApiErrorMessage(err, 'Failed to send your message.'));
            // Remove optimistic user message on error
            setMessages(prev => prev.filter(m => m.id !== userMsg.id));
            throw err;
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className={`h-screen flex overflow-hidden relative ${theme === 'dark'
                ? 'bg-dark-900'
                : 'bg-gray-50'
            }`}>
            {/* Subtle Background Animation */}
            <BackgroundAnimation />

            {/* Mobile menu button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl transition-all ${theme === 'dark'
                        ? 'bg-dark-700/90 text-white hover:bg-dark-600'
                        : 'bg-white/90 text-gray-800 hover:bg-gray-100 shadow-sm'
                    } backdrop-blur-sm`}
                id="mobile-menu-btn"
            >
                <HiMenuAlt2 size={22} />
            </button>

            {/* Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                chats={chats}
                activeChat={activeChat}
                onNewChat={createNewChat}
                onSelectChat={selectChat}
                onDeleteChat={deleteChat}
                onLogout={handleLogout}
                user={user}
                loading={loadingChats}
            />

            {/* Main Chat Area */}
            <ChatArea
                activeChat={activeChat}
                messages={messages}
                onSendMessage={sendMessage}
                user={user}
            />
        </div>
    );
}
