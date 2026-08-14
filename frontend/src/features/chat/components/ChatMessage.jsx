// features/chat/components/ChatMessage.jsx
import React from 'react';
import { ChatCardsCarousel } from './ChatCardRenderer.jsx';
import { stripEmojis } from './ChatbotWidget.jsx';

const BotReplyLabel = () => (
    <div className="flex items-center gap-1 mb-1 ml-1 text-[10px] font-semibold uppercase tracking-wide text-teal-600 dark:text-teal-400">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4V2.5M9 2.5h6M8 7h8a2 2 0 012 2v7a2 2 0 01-2 2H8a2 2 0 01-2-2V9a2 2 0 012-2z" />
            <circle cx="9" cy="11.5" r="1" fill="currentColor" stroke="none" />
            <circle cx="15" cy="11.5" r="1" fill="currentColor" stroke="none" />
        </svg>
        <span>StayBot</span>
    </div>
);


/**
 * Clean & lightweight Markdown parser for chat messages
 */
const formatMessageText = (text) => {
    if (!text) return null;

    const cleanedText = stripEmojis(text);
    const lines = cleanedText.split('\n');

    return lines.map((line, lineIdx) => {
        if (!line.trim()) {
            return <div key={lineIdx} className="h-2" />;
        }

        // Bullet point lines (- item or * item)
        const isBullet = /^\s*[-*•]\s+(.*)/.test(line);
        if (isBullet) {
            const content = line.replace(/^\s*[-*•]\s+/, '');
            return (
                <div key={lineIdx} className="flex items-start gap-2 my-1 pl-1">
                    <span className="text-teal-500 font-bold leading-relaxed">•</span>
                    <span className="flex-1 leading-relaxed text-sm">
                        {renderInlineMarkdown(content)}
                    </span>
                </div>
            );
        }

        // Numbered list (1. item)
        const isNumbered = /^\s*(\d+)\.\s+(.*)/.test(line);
        if (isNumbered) {
            const match = line.match(/^\s*(\d+)\.\s+(.*)/);
            return (
                <div key={lineIdx} className="flex items-start gap-2 my-1 pl-1">
                    <span className="text-teal-600 dark:text-teal-400 font-semibold text-xs min-w-4">{match[1]}.</span>
                    <span className="flex-1 leading-relaxed text-sm">
                        {renderInlineMarkdown(match[2])}
                    </span>
                </div>
            );
        }

        // Standard paragraph
        return (
            <p key={lineIdx} className="my-0.5 leading-relaxed text-sm">
                {renderInlineMarkdown(line)}
            </p>
        );
    });
};

/**
 * Formats inline bold (**text**), italics (*text*), code (`text`), and links
 */
const renderInlineMarkdown = (text) => {
    if (!text) return '';

    const parts = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
        const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
        const codeMatch = remaining.match(/`([^`]+)`/);
        const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);

        const matches = [
            boldMatch && { index: boldMatch.index, len: boldMatch[0].length, type: 'bold', text: boldMatch[1] },
            codeMatch && { index: codeMatch.index, len: codeMatch[0].length, type: 'code', text: codeMatch[1] },
            italicMatch && { index: italicMatch.index, len: italicMatch[0].length, type: 'italic', text: italicMatch[1] }
        ].filter(Boolean).sort((a, b) => a.index - b.index);

        if (matches.length === 0) {
            parts.push(remaining);
            break;
        }

        const first = matches[0];
        if (first.index > 0) {
            parts.push(remaining.substring(0, first.index));
        }

        if (first.type === 'bold') {
            parts.push(<strong key={key++} className="font-bold text-gray-950 dark:text-white">{first.text}</strong>);
        } else if (first.type === 'code') {
            parts.push(<code key={key++} className="px-1.5 py-0.5 bg-gray-200/80 dark:bg-gray-700/80 rounded font-mono text-xs text-teal-700 dark:text-teal-300">{first.text}</code>);
        } else if (first.type === 'italic') {
            parts.push(<em key={key++} className="italic text-gray-800 dark:text-gray-200">{first.text}</em>);
        }

        remaining = remaining.substring(first.index + first.len);
    }

    return parts;
};

const ChatMessage = ({ message, onNavigate, onSuggestionClick }) => {
    const isUser = message.sender === 'user';
    const isSystem = message.sender === 'system';

    const formatTime = (dateStr) => {
        try {
            const d = dateStr ? new Date(dateStr) : new Date();
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    if (isSystem) {
        return (
            <div className="flex justify-center my-2">
                <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                    {stripEmojis(message.text)}
                </span>
            </div>
        );
    }

    return (
        <div className={`flex flex-col my-3 ${isUser ? 'items-end' : 'items-start'} max-w-full`}>
            {!isUser && <BotReplyLabel />}

            <div className={`flex items-end gap-2 max-w-[92%] sm:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Message Box */}
                <div
                    className={`rounded-xl px-3 py-2 shadow-sm transition-all ${isUser
                        ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-br-xs'
                        : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/70 text-gray-800 dark:text-gray-100 rounded-bl-xs'
                        }`}
                >
                    <div className="break-words">
                        {isUser ? (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{stripEmojis(message.text)}</p>
                        ) : (
                            formatMessageText(message.text)
                        )}
                    </div>

                    <div className={`text-[8px] mt-0.5 flex items-center gap-1 ${isUser ? 'text-teal-100 justify-end' : 'text-gray-400 dark:text-gray-500 justify-end'}`}>
                        <span>{formatTime(message.timestamp)}</span>
                    </div>
                </div>
            </div>

            {/* Attached Cards (Rooms, Bookings, Cities) */}
            {!isUser && message.cards && message.cards.length > 0 && (
                <div className="w-full pr-2">
                    <ChatCardsCarousel
                        cards={message.cards}
                        cardType={message.cardType}
                        onNavigate={onNavigate}
                    />
                </div>
            )}

            {/* Quick Contextual Suggestions */}
            {!isUser && message.suggestions && message.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {message.suggestions.map((sug, idx) => {
                        const cleanSug = stripEmojis(sug);
                        if (!cleanSug) return null;
                        return (
                            <button
                                key={idx}
                                onClick={() => onSuggestionClick(cleanSug)}
                                className="px-3 py-1 bg-teal-50 dark:bg-gray-800/90 hover:bg-teal-100 dark:hover:bg-gray-700 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-900/50 text-xs font-medium rounded-full transition-all active:scale-95 text-left"
                            >
                                {cleanSug}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ChatMessage;
