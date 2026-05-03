import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useGetMyBookingsQuery } from '../services/bookingService.js';
import { ProfileSkeleton } from '../../../components/Skeletons.jsx';
import Toast from '../../../components/Toast.jsx';
import BackButton from '../../../components/BackButton.jsx';

const MyBookingsPage = () => {
    const navigate = useNavigate();
    const { currentUser } = useSelector((state) => state.app);
    const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'confirmed' | 'pending' | 'cancelled'

    // Fetch bookings via RTK Query
    const { data: bookingsData, isLoading, error } = useGetMyBookingsQuery(undefined, {
        skip: !currentUser
    });

    const bookings = Array.isArray(bookingsData) ? bookingsData : [];
    const message = error?.data?.msg || error?.userMessage || (error ? 'Failed to fetch bookings.' : '');

    if (!currentUser) {
        return <ProfileSkeleton />;
    }

    const filteredBookings = bookings.filter((b) => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'confirmed') return b.status === 'confirmed';
        if (filterStatus === 'pending') return b.status === 'pending_payment';
        if (filterStatus === 'cancelled') return b.status === 'cancelled';
        return true;
    });

    const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
    const pendingCount = bookings.filter(b => b.status === 'pending_payment').length;
    const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <main className="min-h-screen bg-slate-50/60 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header Title & Filter Chips */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
                            <span>My Bookings</span>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">
                                {bookings.length} {bookings.length === 1 ? 'Stay' : 'Stays'}
                            </span>
                        </h1>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Track and manage your reserved stays, payment statuses, and itineraries.
                        </p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-gray-200/70 dark:bg-gray-800 self-start sm:self-auto overflow-x-auto text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setFilterStatus('all')}
                            className={`px-3 py-1.5 rounded-xl transition-all ${
                                filterStatus === 'all'
                                    ? 'bg-white text-gray-900 shadow-sm dark:bg-teal-600 dark:text-white'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                        >
                            All ({bookings.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStatus('confirmed')}
                            className={`px-3 py-1.5 rounded-xl transition-all ${
                                filterStatus === 'confirmed'
                                    ? 'bg-white text-emerald-700 shadow-sm dark:bg-emerald-600 dark:text-white'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-emerald-600'
                            }`}
                        >
                            Confirmed ({confirmedCount})
                        </button>
                        {pendingCount > 0 && (
                            <button
                                type="button"
                                onClick={() => setFilterStatus('pending')}
                                className={`px-3 py-1.5 rounded-xl transition-all ${
                                    filterStatus === 'pending'
                                        ? 'bg-white text-amber-700 shadow-sm dark:bg-amber-600 dark:text-white'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-amber-600'
                                }`}
                            >
                                Pending ({pendingCount})
                            </button>
                        )}
                        {cancelledCount > 0 && (
                            <button
                                type="button"
                                onClick={() => setFilterStatus('cancelled')}
                                className={`px-3 py-1.5 rounded-xl transition-all ${
                                    filterStatus === 'cancelled'
                                        ? 'bg-white text-rose-700 shadow-sm dark:bg-rose-600 dark:text-white'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-rose-600'
                                }`}
                            >
                                Cancelled ({cancelledCount})
                            </button>
                        )}
                    </div>
                </div>

                {message && <Toast message={message} type="error" />}

                {/* Loading Skeleton */}
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="h-28 bg-white dark:bg-gray-800 rounded-2xl animate-pulse border border-gray-100 dark:border-gray-800"
                            />
                        ))}
                    </div>
                ) : filteredBookings.length > 0 ? (
                    /* Compact Bookings List */
                    <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
                        {filteredBookings.map((booking) => {
                            const mainImage = Array.isArray(booking.roomImages) && booking.roomImages.length > 0
                                ? (typeof booking.roomImages[0] === 'string' ? booking.roomImages[0] : booking.roomImages[0]?.url)
                                : null;

                            const isConfirmed = booking.status === 'confirmed';
                            const isPending = booking.status === 'pending_payment';

                            return (
                                <div
                                    key={booking._id}
                                    className="group relative flex flex-col sm:flex-row items-stretch bg-white dark:bg-gray-800 rounded-2xl p-3.5 shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700/60 hover:border-teal-300 dark:hover:border-teal-500/50 transition-all gap-3.5"
                                >
                                    {/* Compact Thumbnail */}
                                    <div className="relative w-full sm:w-36 h-32 sm:h-auto shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                                        {mainImage ? (
                                            <img
                                                src={mainImage}
                                                alt={booking.roomTitle}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                                No image
                                            </div>
                                        )}

                                        {/* Status Tag on image */}
                                        <span
                                            className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide shadow-sm ${
                                                isConfirmed
                                                    ? 'bg-emerald-500 text-white'
                                                    : isPending
                                                    ? 'bg-amber-500 text-white'
                                                    : 'bg-rose-500 text-white'
                                            }`}
                                        >
                                            {booking.paymentStatus || (isConfirmed ? 'Paid' : 'Pending')}
                                        </span>
                                    </div>

                                    {/* Middle & Right Content */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                        {/* Top Row: Title & Price */}
                                        <div>
                                            <div className="flex items-start justify-between gap-2">
                                                <h3
                                                    onClick={() => booking.roomId && navigate(`/rooms/${booking.roomId}`)}
                                                    className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer transition-colors"
                                                    title={booking.roomTitle}
                                                >
                                                    {booking.roomTitle}
                                                </h3>
                                                <span className="text-sm font-extrabold text-teal-700 dark:text-teal-300 shrink-0">
                                                    ₹{booking.totalAmount?.toLocaleString() || '0'}
                                                </span>
                                            </div>

                                            {/* Location */}
                                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                                                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                {booking.roomAddress || 'Location N/A'}
                                            </p>
                                        </div>

                                        {/* Dates Banner & Duration */}
                                        <div className="my-2 py-1.5 px-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-medium truncate">
                                                <svg className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span>{formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}</span>
                                            </div>
                                            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 shrink-0">
                                                {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
                                            </span>
                                        </div>

                                        {/* Bottom Row: Host & View Button */}
                                        <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700/60 text-xs">
                                            <span className="text-gray-500 dark:text-gray-400 truncate max-w-[140px] sm:max-w-[180px]">
                                                Host: <strong className="font-semibold text-gray-700 dark:text-gray-300">{booking.hostName}</strong>
                                            </span>

                                            {booking.roomId && (
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/rooms/${booking.roomId}`)}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 group-hover:translate-x-0.5 transition-all"
                                                >
                                                    <span>View Room</span>
                                                    <span>→</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 sm:p-12 text-center border border-gray-100 dark:border-gray-700/60 max-w-md mx-auto space-y-4 shadow-sm">
                        <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto text-2xl">
                            🏨
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                            {filterStatus !== 'all' ? `No ${filterStatus} bookings` : 'No bookings found'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            {filterStatus !== 'all'
                                ? `You have no ${filterStatus} bookings right now.`
                                : 'Explore properties across trending destinations and plan your next journey with StayHub.'}
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-xs font-semibold px-5 py-2.5 shadow-md shadow-teal-600/20 transition-all active:scale-95"
                        >
                            <span>Explore Properties</span>
                            <span>→</span>
                        </button>
                    </div>
                )}

            </div>
        </main>
    );
};

export default MyBookingsPage;
