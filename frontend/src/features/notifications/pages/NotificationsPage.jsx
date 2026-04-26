// features/notifications/pages/NotificationsPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    useGetNotificationsQuery,
    useMarkNotificationReadMutation,
    useMarkAllNotificationsReadMutation,
    useDeleteNotificationMutation,
    useClearAllNotificationsMutation
} from '../services/notificationService.js';
import Toast from '../../../components/Toast.jsx';

const formatFullDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getTypeDetails = (type) => {
    switch (type) {
        case 'booking_confirmed':
            return {
                icon: '🎉',
                badge: 'Booking Confirmed',
                badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
                borderClass: 'border-l-emerald-500'
            };
        case 'new_booking_received':
            return {
                icon: '🛎️',
                badge: 'New Booking',
                badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
                borderClass: 'border-l-teal-500'
            };
        case 'booking_cancelled':
            return {
                icon: '⚠️',
                badge: 'Cancelled',
                badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
                borderClass: 'border-l-rose-500'
            };
        case 'review_received':
            return {
                icon: '⭐',
                badge: 'Review',
                badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
                borderClass: 'border-l-amber-500'
            };
        default:
            return {
                icon: '🔔',
                badge: 'System Alert',
                badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
                borderClass: 'border-l-blue-500'
            };
    }
};

const NotificationsPage = () => {
    const navigate = useNavigate();
    const { currentUser } = useSelector((state) => state.app);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [feedbackMsg, setFeedbackMsg] = useState('');

    const { data: notificationData, isLoading, error } = useGetNotificationsQuery(
        { page, limit: 30, unreadOnly: selectedCategory === 'unread' },
        { skip: !currentUser }
    );

    const [markAsRead] = useMarkNotificationReadMutation();
    const [markAllAsRead, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();
    const [deleteNotification] = useDeleteNotificationMutation();
    const [clearAllNotifications, { isLoading: clearingAll }] = useClearAllNotificationsMutation();

    const notifications = notificationData?.notifications || [];
    const unreadCount = notificationData?.unreadCount ?? 0;

    // Filter by category
    const filteredNotifications = notifications.filter((item) => {
        if (selectedCategory === 'unread') return !item.isRead;
        if (selectedCategory === 'bookings') {
            return ['booking_confirmed', 'new_booking_received', 'booking_cancelled'].includes(item.type);
        }
        if (selectedCategory === 'reviews') {
            return item.type === 'review_received' || item.type === 'review_prompt';
        }
        if (selectedCategory === 'system') {
            return item.type === 'system';
        }
        return true;
    }).filter((item) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
            item.title?.toLowerCase().includes(q) ||
            item.message?.toLowerCase().includes(q) ||
            item.data?.roomTitle?.toLowerCase().includes(q)
        );
    });

    const handleMarkAll = async () => {
        try {
            await markAllAsRead().unwrap();
            setFeedbackMsg('All notifications marked as read.');
            setTimeout(() => setFeedbackMsg(''), 3000);
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const handleClearAll = async () => {
        if (window.confirm('Are you sure you want to delete all notifications? This cannot be undone.')) {
            try {
                await clearAllNotifications().unwrap();
                setFeedbackMsg('All notifications cleared.');
                setTimeout(() => setFeedbackMsg(''), 3000);
            } catch (err) {
                console.error('Failed to clear notifications:', err);
            }
        }
    };

    const handleItemClick = async (item) => {
        if (!item.isRead) {
            try {
                await markAsRead(item._id).unwrap();
            } catch (err) {
                console.error('Failed to mark as read:', err);
            }
        }
        if (item.link) {
            navigate(item.link);
        }
    };

    const handleDeleteItem = async (e, id) => {
        e.stopPropagation();
        try {
            await deleteNotification(id).unwrap();
        } catch (err) {
            console.error('Failed to delete notification:', err);
        }
    };

    return (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                            Notifications
                        </h1>
                        {unreadCount > 0 && (
                            <span className="px-3 py-1 text-xs font-bold rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                                {unreadCount} Unread
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Stay updated on your booking activities, payments, property alerts, and reviews.
                    </p>
                </div>

                {/* Bulk Actions */}
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={handleMarkAll}
                            disabled={markingAll}
                            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/40 dark:text-teal-300 dark:hover:bg-teal-900/60 transition-colors shadow-sm"
                        >
                            {markingAll ? 'Marking...' : 'Mark All Read'}
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button
                            type="button"
                            onClick={handleClearAll}
                            disabled={clearingAll}
                            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-red-900/30 dark:hover:text-red-300 transition-colors shadow-sm"
                        >
                            {clearingAll ? 'Clearing...' : 'Clear All'}
                        </button>
                    )}
                </div>
            </div>

            {feedbackMsg && (
                <div className="mb-6">
                    <Toast message={feedbackMsg} type="success" />
                </div>
            )}

            {/* Filter Tabs and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center mb-6">
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'unread', label: `Unread (${unreadCount})` },
                        { id: 'bookings', label: 'Bookings' },
                        { id: 'reviews', label: 'Reviews' },
                        { id: 'system', label: 'System' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSelectedCategory(tab.id)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                                selectedCategory === tab.id
                                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-sm'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-600'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search Input */}
                <div className="relative min-w-[220px]">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search notifications..."
                        className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                    />
                    <svg
                        className="w-4 h-4 text-gray-400 absolute left-3 top-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>
            </div>

            {/* Notification Cards List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="bg-white dark:bg-gray-800 rounded-2xl h-28 animate-pulse border border-gray-100 dark:border-gray-700"
                        />
                    ))}
                </div>
            ) : filteredNotifications.length > 0 ? (
                <div className="space-y-3.5">
                    {filteredNotifications.map((item) => {
                        const typeInfo = getTypeDetails(item.type);
                        return (
                            <div
                                key={item._id}
                                onClick={() => handleItemClick(item)}
                                className={`relative group p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer border-l-4 ${typeInfo.borderClass} ${
                                    item.isRead
                                        ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 shadow-sm hover:shadow-md'
                                        : 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-100 dark:border-teal-900/40 shadow-sm hover:shadow-md'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                                        {/* Icon */}
                                        <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 flex items-center justify-center text-lg shadow-sm flex-shrink-0">
                                            {typeInfo.icon}
                                        </div>

                                        {/* Body */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${typeInfo.badgeClass}`}
                                                >
                                                    {typeInfo.badge}
                                                </span>
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                                                    {item.title}
                                                </h3>
                                                {!item.isRead && (
                                                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                                                )}
                                            </div>

                                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                                {item.message}
                                            </p>

                                            {/* Metadata chips if booking exists */}
                                            {item.data && (item.data.totalAmount || item.data.checkInDate) && (
                                                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                                                    {item.data.checkInDate && (
                                                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium">
                                                            📅 {item.data.checkInDate} → {item.data.checkOutDate}
                                                        </span>
                                                    )}
                                                    {item.data.totalAmount && (
                                                        <span className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-bold">
                                                            💰 ₹{item.data.totalAmount.toLocaleString('en-IN')}
                                                        </span>
                                                    )}
                                                    {item.data.guestName && (
                                                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                            👤 Guest: {item.data.guestName}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <p className="mt-2.5 text-[11px] text-gray-400 dark:text-gray-500">
                                                {formatFullDate(item.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleItemClick(item);
                                            }}
                                            className="hidden sm:inline-flex px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors"
                                        >
                                            View Details
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteItem(e, item._id)}
                                            className="p-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            title="Delete notification"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-700">
                    <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-300 flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">
                        📭
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {searchTerm ? 'No matching notifications' : 'No notifications yet'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                        {searchTerm
                            ? `We couldn't find any notifications matching "${searchTerm}". Try a different search.`
                            : 'When you make bookings, receive guest reservations, or get reviews, they will appear here.'}
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="mt-6 px-5 py-2.5 rounded-full text-xs font-semibold bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-md transition-all"
                    >
                        Explore Stays
                    </button>
                </div>
            )}
        </main>
    );
};

export default NotificationsPage;
