// features/chat/components/ChatbotWidget.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useSendChatMessageMutation, useGetChatSuggestionsQuery } from '../../../api/apiSlice.js';
import ChatMessage from './ChatMessage.jsx';

const STORAGE_KEY = 'stayhub_chat_history_v3';

/**
 * Strips all emoji and unicode pictograph characters
 */
export const stripEmojis = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]|[\uFE00-\uFE0F]|[\u{1F000}-\u{1FFFF}])/gu, '')
        // Keep newlines intact so the chat Markdown renderer can format
        // headings, paragraphs, and list items correctly.
        .replace(/[^\S\r\n]+/g, ' ')
        .trim();
};

const BotHeaderIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
);

const BotSparkIcon = () => (
    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const ChatbotWidget = () => {
    const navigate = useNavigate();
    const { currentUser } = useSelector((state) => state.app);

    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [inputMessage, setInputMessage] = useState('');
    const [messages, setMessages] = useState(() => {
        try {
            sessionStorage.removeItem('stayhub_chat_history_v1');
            sessionStorage.removeItem('stayhub_chat_history_v2');
            const saved = sessionStorage.getItem(STORAGE_KEY);
            if (!saved) return [];
            const parsed = JSON.parse(saved);
            return Array.isArray(parsed)
                ? parsed.map(m => ({
                    ...m,
                    isWelcome: m.isWelcome || String(m.id || '').startsWith('welcome'),
                    text: stripEmojis(m.text),
                    suggestions: (m.suggestions || []).map(stripEmojis)
                }))
                : [];
        } catch {
            return [];
        }
    });

    const [sendChatMessage, { isLoading: isSending }] = useSendChatMessageMutation();
    const { data: suggestionsData } = useGetChatSuggestionsQuery();

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Manage mount/unmount with animation
    useEffect(() => {
        if (isOpen) {
            setIsVisible(false);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setIsVisible(true));
            });
            document.body.style.overflow = 'hidden';
        } else {
            setIsVisible(false);
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Save chat history to sessionStorage
    useEffect(() => {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        } catch (e) {
            console.warn('Failed to cache chat history', e);
        }
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setTimeout(() => inputRef.current?.focus(), 200);
        }
    }, [isOpen, messages, isSending]);

    const handleInitialOpen = () => {
        setIsOpen(true);
        if (messages.length === 0) {
            const greeting = currentUser?.name
                ? `Hello ${currentUser.name.split(' ')[0]}, I am StayBot, your StayHub AI assistant.\n\nI can dynamically search available stays, filter by your budget, check your bookings, and find properties across India. How can I help you today?`
                : `Hello, I am StayBot, your StayHub AI assistant.\n\nI have direct access to our live database of apartments, villas, resorts, and homestays. How can I help you plan your stay?`;

            const rawSuggestions = suggestionsData?.suggestions || [
                'Villas in Goa under 5000',
                'Apartments in Mumbai',
                'Check my bookings',
                'My Wishlist'
            ];

            setMessages([
                {
                    id: 'welcome_1',
                    sender: 'bot',
                    isWelcome: true,
                    text: greeting,
                    cards: [],
                    cardType: null,
                    suggestions: rawSuggestions.map(stripEmojis),
                    timestamp: new Date().toISOString()
                }
            ]);
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => setIsOpen(false), 300);
    };

    const handleSendMessage = async (customText = null) => {
        const textToSend = typeof customText === 'string' ? customText : inputMessage;
        if (!textToSend || !textToSend.trim() || isSending) return;

        const cleanText = stripEmojis(textToSend.trim());
        setInputMessage('');

        const userMsg = {
            id: `usr_${Date.now()}`,
            sender: 'user',
            text: cleanText,
            timestamp: new Date().toISOString()
        };

        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);

        try {
            // Gemini receives the current message separately below, so history
            // must contain only messages that came before this request.
            const historyPayload = messages.slice(-6).map(m => ({
                sender: m.sender,
                text: stripEmojis(m.text)
            }));

            const response = await sendChatMessage({
                message: cleanText,
                history: historyPayload
            }).unwrap();

            const botMsg = {
                id: `bot_${Date.now()}`,
                sender: 'bot',
                text: stripEmojis(response.reply) || 'Here is the latest information for you:',
                cards: response.cards || [],
                cardType: response.cardType || null,
                suggestions: (response.suggestions || []).map(stripEmojis),
                timestamp: response.timestamp || new Date().toISOString()
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMsg = {
                id: `bot_err_${Date.now()}`,
                sender: 'bot',
                text: 'Connection error while communicating with the backend. Please try again.',
                cards: [],
                cardType: null,
                suggestions: ['Find stays in Goa', 'Explore top cities', 'Check my bookings'],
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMsg]);
        }
    };

    const handleClearChat = () => {
        sessionStorage.removeItem(STORAGE_KEY);
        setMessages([]);
        setTimeout(() => {
            const greeting = currentUser?.name
                ? `Hello ${currentUser.name.split(' ')[0]}, I am StayBot, your StayHub AI assistant.\n\nI can dynamically search available stays, filter by your budget, check your bookings, and find properties across India. How can I help you today?`
                : `Hello, I am StayBot, your StayHub AI assistant.\n\nI have direct access to our live database of apartments, villas, resorts, and homestays. How can I help you plan your stay?`;

            const rawSuggestions = suggestionsData?.suggestions || [
                'Villas in Goa under 5000',
                'Apartments in Mumbai',
                'Check my bookings',
                'My Wishlist'
            ];

            setMessages([
                {
                    id: 'welcome_reset',
                    sender: 'bot',
                    isWelcome: true,
                    text: greeting,
                    cards: [],
                    cardType: null,
                    suggestions: rawSuggestions.map(stripEmojis),
                    timestamp: new Date().toISOString()
                }
            ]);
        }, 50);
    };

    const handleNavigate = (path) => {
        navigate(path);
        handleClose();
    };

    return (
        <>
            {/* Floating Action Button */}
            {!isOpen && (
                <button
                    onClick={handleInitialOpen}
                    className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-full bg-gradient-to-r from-teal-500 via-teal-600 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 active:scale-95 text-white text-sm font-semibold shadow-xl shadow-teal-600/30 transition-all duration-300 hover:ring-4 hover:ring-teal-400/30 focus:outline-none"
                    aria-label="Open AI Travel Assistant"
                >
                    Ask AI
                </button>

            )}

            {/* Sidebar Overlay + Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        onClick={handleClose}
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
                        style={{ opacity: isVisible ? 1 : 0 }}
                        aria-hidden="true"
                    />

                    {/* Sidebar Panel */}
                    <div
                        className="fixed top-0 right-0 z-50 h-full flex flex-col bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700/80 overflow-hidden transition-transform duration-300 ease-out"
                        style={{
                            width: 'min(420px, 100vw)',
                            transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
                        }}
                        role="dialog"
                        aria-label="StayBot AI Assistant"
                    >
                        {/* Header */}
                        <div className="px-4 py-3.5 bg-gradient-to-r from-teal-700 via-teal-600 to-teal-800 text-white flex items-center justify-between shadow-md shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner ring-2 ring-white/40">
                                        <BotHeaderIcon />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <h3 className="font-extrabold text-sm tracking-wide">StayBot AI</h3>
                                    </div>
                                    <p className="text-[11px] text-teal-100/90 font-medium">
                                        StayHub AI Concierge
                                    </p>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleClearChat}
                                    title="Reset Conversation"
                                    className="p-1.5 text-teal-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>

                                <button
                                    onClick={handleClose}
                                    title="Close Chat"
                                    className="p-1.5 text-teal-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Messages Body */}
                        <div
                            className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50/60 dark:bg-gray-900/60 space-y-1"
                            style={{ scrollbarWidth: 'thin', scrollbarColor: '#99f6e4 transparent' }}
                        >
                            {messages.map((msg) => (
                                <ChatMessage
                                    key={msg.id}
                                    message={msg}
                                    onNavigate={handleNavigate}
                                    onSuggestionClick={handleSendMessage}
                                />
                            ))}

                            {/* Live Thinking Indicator */}
                            {isSending && (
                                <div className="flex items-start gap-2 my-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-md">
                                        <BotSparkIcon />
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/70 rounded-2xl rounded-bl-xs px-4 py-3 shadow-sm flex items-center gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium pl-1">
                                            Querying database...
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Bar */}
                        <div className="p-3 bg-white dark:bg-gray-850 border-t border-gray-200 dark:border-gray-700/80 shrink-0">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendMessage();
                                }}
                                className="flex items-center gap-2"
                            >
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    placeholder="Ask about stays, bookings, destinations..."
                                    disabled={isSending}
                                    className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm rounded-xl px-3.5 py-2.5 border border-transparent focus:border-teal-500 focus:bg-white dark:focus:bg-gray-900 focus:outline-none transition-all"
                                />

                                <button
                                    type="submit"
                                    disabled={!inputMessage.trim() || isSending}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${inputMessage.trim() && !isSending
                                        ? 'bg-teal-600 hover:bg-teal-700 active:scale-95 text-white shadow-md shadow-teal-500/20'
                                        : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                        }`}
                                    aria-label="Send message"
                                >
                                    <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default ChatbotWidget;
