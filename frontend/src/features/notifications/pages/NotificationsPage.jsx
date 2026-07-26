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
import BackButton from '../../../components/BackButton.jsx';

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

const renderTypeIcon = (type) => {
    switch (type) {
        case 'booking_confirmed':
            return (
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        case 'new_booking_received':
            return (
                <svg className="w-5 h-5 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            );
        case 'booking_cancelled':
            return (
                <svg className="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            );
        case 'review_received':
            return (
                <svg className="w-5 h-5 text-amber-500 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
            );
        default:
            return (
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            );
    }
};

const getTypeDetails = (type) => {
    switch (type) {
        case 'booking_confirmed':
            return {
                badge: 'Booking Confirmed',
                badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
                borderClass: 'border-l-emerald-500'
            };
        case 'new_booking_received':
            return {
                badge: 'New Booking',
                badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
                borderClass: 'border-l-teal-500'
            };
        case 'booking_cancelled':
            return {
                badge: 'Cancelled',
                badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
                borderClass: 'border-l-rose-500'
            };
        case 'review_received':
            return {
                badge: 'Review',
                badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
                borderClass: 'border-l-amber-500'
            };
        default:
            return {
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
        <main className="min-h-screen bg-slate-50/60 dark:bg-gray-900 pt-4 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-7xl mx-auto space-y-5">
                <BackButton to="/" label="Back to Home" className="mb-2" />
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 mb-5 border-b border-gray-200 dark:border-gray-800">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                            Notifications
                        </h1>
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 text-xs font-bold rounded bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                                {unreadCount} Unread
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
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
                            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/40 dark:text-teal-300 dark:hover:bg-teal-900/60 transition-colors shadow-xs cursor-pointer"
                        >
                            {markingAll ? 'Marking...' : 'Mark All Read'}
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button
                            type="button"
                            onClick={handleClearAll}
                            disabled={clearingAll}
                            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-red-900/30 dark:hover:text-red-300 transition-colors shadow-xs cursor-pointer"
                        >
                            {clearingAll ? 'Clearing...' : 'Clear All'}
                        </button>
                    )}
                </div>
            </div>

            {feedbackMsg && (
                <div className="mb-5">
                    <Toast message={feedbackMsg} type="success" />
                </div>
            )}

            {/* Filter Tabs and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center mb-5">
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
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                selectedCategory === tab.id
                                    ? 'bg-teal-600 text-white shadow-xs'
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
                        className="w-full pl-9 pr-4 py-1.5 text-xs rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 shadow-xs"
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
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="bg-white dark:bg-gray-800 rounded-lg h-24 animate-pulse border border-gray-100 dark:border-gray-700"
                        />
                    ))}
                </div>
            ) : filteredNotifications.length > 0 ? (
                <div className="space-y-3">
                    {filteredNotifications.map((item, idx) => {
                        const typeInfo = getTypeDetails(item.type);
                        return (
                            <div
                                key={item._id}
                                onClick={() => handleItemClick(item)}
                                className={`relative group p-4 rounded-lg border transition-all cursor-pointer border-l-4 ${typeInfo.borderClass} animate-card-cascade stagger-${Math.min(idx + 1, 8)} ${
                                    item.isRead
                                        ? 'bg-white dark:bg-gray-800 border-gray-200/80 dark:border-gray-700/80 shadow-xs hover:shadow-sm'
                                        : 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-200/80 dark:border-teal-900/40 shadow-xs hover:shadow-sm'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                                        {/* Icon */}
                                        <div className="w-9 h-9 rounded-md bg-gray-100 dark:bg-gray-750 flex items-center justify-center flex-shrink-0">
                                            {renderTypeIcon(item.type)}
                                        </div>

                                        {/* Body */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${typeInfo.badgeClass}`}
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
                                                <div className="mt-2.5 flex flex-wrap gap-2 text-[11px]">
                                                    {item.data.checkInDate && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium">
                                                            <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            <span>{item.data.checkInDate} → {item.data.checkOutDate}</span>
                                                        </span>
                                                    )}
                                                    {item.data.totalAmount && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-bold">
                                                            <span>₹{item.data.totalAmount.toLocaleString('en-IN')}</span>
                                                        </span>
                                                    )}
                                                    {item.data.guestName && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                            <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                            <span>Guest: {item.data.guestName}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
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
                                            className="hidden sm:inline-flex px-3 py-1.5 rounded-md text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors cursor-pointer"
                                        >
                                            View Details
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteItem(e, item._id)}
                                            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
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
                <div className="bg-white dark:bg-gray-800 rounded-xl p-10 text-center border border-gray-200 dark:border-gray-700 max-w-md mx-auto shadow-xs">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-750 text-gray-500 dark:text-gray-400 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                        {searchTerm ? 'No matching notifications' : 'No notifications yet'}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                        {searchTerm
                            ? `We couldn't find any notifications matching "${searchTerm}". Try a different search.`
                            : 'When you make bookings, receive guest reservations, or get reviews, they will appear here.'}
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="mt-5 px-4 py-2 rounded-md text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-all cursor-pointer"
                    >
                        Explore Stays
                    </button>
                </div>
            )}
            </div>
        </main>
    );
};

export default NotificationsPage;
