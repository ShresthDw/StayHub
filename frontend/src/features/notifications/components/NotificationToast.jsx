// features/notifications/components/NotificationToast.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NotificationToast = ({ notification, onClose }) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (!notification) return;
        const timer = setTimeout(() => {
            onClose();
        }, 7000);
        return () => clearTimeout(timer);
    }, [notification, onClose]);

    if (!notification) return null;

    const handleActionClick = () => {
        onClose();
        if (notification.link) {
            navigate(notification.link);
        } else {
            navigate('/notifications');
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'booking_confirmed':
            case 'new_booking_received':
                return 'from-teal-500 to-emerald-600 border-teal-400';
            case 'booking_cancelled':
                return 'from-rose-500 to-red-600 border-rose-400';
            case 'review_received':
                return 'from-amber-500 to-yellow-600 border-amber-400';
            default:
                return 'from-cyan-500 to-blue-600 border-cyan-400';
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-bounce-short transition-all">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-4 overflow-hidden relative">
                {/* Accent line */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getTypeColor(notification.type)}`} />

                <div className="flex items-start gap-3 mt-1">
                    <div className="flex-shrink-0 mt-0.5">
                        <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-300 flex items-center justify-center font-bold text-lg">
                            🔔
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                            {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2 leading-relaxed">
                            {notification.message}
                        </p>

                        <div className="mt-3 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleActionClick}
                                className="px-3 py-1 text-xs font-semibold rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm"
                            >
                                View Details
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-2.5 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                        aria-label="Close"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationToast;
