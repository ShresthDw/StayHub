// features/notifications/components/NotificationBell.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    useGetNotificationsQuery,
    useGetUnreadNotificationCountQuery,
    useMarkNotificationReadMutation,
    useMarkAllNotificationsReadMutation,
    useDeleteNotificationMutation
} from '../services/notificationService.js';

// Helper for relative timestamps
const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 172800) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Helper for notification type icons & badges
const getNotificationTypeConfig = (type) => {
    switch (type) {
        case 'booking_confirmed':
            return {
                icon: '🎉',
                bg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                badgeText: 'Confirmed'
            };
        case 'new_booking_received':
            return {
                icon: '🛎️',
                bg: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
                badgeText: 'New Booking'
            };
        case 'booking_cancelled':
            return {
                icon: '⚠️',
                bg: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
                badgeText: 'Cancelled'
            };
        case 'review_received':
            return {
                icon: '⭐',
                bg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                badgeText: 'Review'
            };
        default:
            return {
                icon: '🔔',
                bg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                badgeText: 'Alert'
            };
    }
};

const NotificationBell = ({ currentUser }) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const dropdownRef = useRef(null);

    // Queries
    const { data: countData } = useGetUnreadNotificationCountQuery(undefined, {
        skip: !currentUser,
        pollingInterval: 30000 // Background poll fallback
    });

    const { data: notificationsData, isLoading } = useGetNotificationsQuery(
        { limit: 15, unreadOnly: activeTab === 'unread' },
        { skip: !currentUser }
    );

    // Mutations
    const [markAsRead] = useMarkNotificationReadMutation();
    const [markAllAsRead, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();
    const [deleteNotification] = useDeleteNotificationMutation();

    const unreadCount = countData?.unreadCount ?? 0;
    const notifications = notificationsData?.notifications || [];

    // Filter by tab on client-side for immediate responsive feel
    const filteredNotifications = notifications.filter((item) => {
        if (activeTab === 'unread') return !item.isRead;
        if (activeTab === 'bookings') {
            return ['booking_confirmed', 'new_booking_received', 'booking_cancelled'].includes(item.type);
        }
        return true;
    });

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = async (item) => {
        if (!item.isRead) {
            try {
                await markAsRead(item._id).unwrap();
            } catch (err) {
                console.error('Error marking as read:', err);
            }
        }
        setIsOpen(false);
        if (item.link) {
            navigate(item.link);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead().unwrap();
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        try {
            await deleteNotification(id).unwrap();
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    };

    const handleViewAll = () => {
        setIsOpen(false);
        navigate('/notifications');
    };

    if (!currentUser) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-gray-800 transition-colors focus:outline-none"
                title="Notifications"
                aria-label="View notifications"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>

                {/* Unread Count Badge */}
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-gradient-to-r from-rose-500 to-red-600 text-[10px] font-bold text-white shadow-sm">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {/* Dropdown Popover */}
            {isOpen && (
                <div className="notification-menu-panel absolute right-0 mt-3 w-80 sm:w-96 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-900/10 z-50 dark:border-gray-700 dark:bg-gray-800">
                    {/* Header */}
                    <div className="relative p-4 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/40 dark:to-cyan-900/30 border-b border-teal-100/70 dark:border-gray-700/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Notifications</span>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 text-[11px] font-bold bg-teal-100 dark:bg-teal-800 text-teal-700 dark:text-teal-200 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllRead}
                                disabled={markingAll}
                                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex border-b border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/70 px-3 pt-2 gap-2 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setActiveTab('all')}
                            className={`pb-2 px-3 border-b-2 transition-colors ${
                                activeTab === 'all'
                                    ? 'border-teal-600 text-teal-600 dark:text-teal-400 dark:border-teal-400 font-bold'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                        >
                            All
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('unread')}
                            className={`pb-2 px-3 border-b-2 transition-colors ${
                                activeTab === 'unread'
                                    ? 'border-teal-600 text-teal-600 dark:text-teal-400 dark:border-teal-400 font-bold'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                        >
                            Unread {unreadCount > 0 && `(${unreadCount})`}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('bookings')}
                            className={`pb-2 px-3 border-b-2 transition-colors ${
                                activeTab === 'bookings'
                                    ? 'border-teal-600 text-teal-600 dark:text-teal-400 dark:border-teal-400 font-bold'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                        >
                            Bookings
                        </button>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/60">
                        {isLoading ? (
                            <div className="p-6 text-center text-sm text-gray-400">Loading notifications...</div>
                        ) : filteredNotifications.length > 0 ? (
                            filteredNotifications.map((item) => {
                                const typeConfig = getNotificationTypeConfig(item.type);
                                return (
                                    <div
                                        key={item._id}
                                        onClick={() => handleNotificationClick(item)}
                                        className={`group relative p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                                            item.isRead
                                                ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750'
                                                : 'bg-teal-50/40 dark:bg-teal-950/20 hover:bg-teal-50/70 dark:hover:bg-teal-950/30'
                                        }`}
                                    >
                                        {/* Icon */}
                                        <div className="flex-shrink-0 mt-0.5">
                                            <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-300 flex items-center justify-center text-base shadow-sm">
                                                {typeConfig.icon}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 pr-6">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                                                    {item.title}
                                                </p>
                                                {!item.isRead && (
                                                    <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                                                {item.message}
                                            </p>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-medium">
                                                {formatTimeAgo(item.createdAt)}
                                            </p>
                                        </div>

                                        {/* Quick Delete */}
                                        <button
                                            type="button"
                                            onClick={(e) => handleDelete(e, item._id)}
                                            className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 transition-opacity"
                                            title="Delete"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-8 text-center">
                                <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-300 flex items-center justify-center mx-auto mb-2 text-xl">
                                    📭
                                </div>
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                                </p>
                                <p className="text-[11px] text-gray-400 mt-1">
                                    We will notify you when booking updates arrive!
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-2.5 bg-gray-50 dark:bg-gray-800/90 border-t border-gray-100 dark:border-gray-700 text-center">
                        <button
                            type="button"
                            onClick={handleViewAll}
                            className="w-full py-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                        >
                            View all notifications →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
