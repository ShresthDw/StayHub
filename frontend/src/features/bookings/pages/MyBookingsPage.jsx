import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useGetMyBookingsQuery, useCancelBookingMutation } from '../services/bookingService.js';
import { ProfileSkeleton } from '../../../components/Skeletons.jsx';
import Toast from '../../../components/Toast.jsx';
import BackButton from '../../../components/BackButton.jsx';
import { getRoomCardThumbnail } from '../../../utils/imageKitOptimizer.js';

const getBookingImage = (booking) => {
    const imgs = booking.roomImages || booking.roomId?.images || booking.images;
    if (Array.isArray(imgs) && imgs.length > 0) {
        const first = imgs[0];
        const url = typeof first === 'string' ? first : first?.url;
        if (url) return getRoomCardThumbnail(url);
    }
    return getRoomCardThumbnail('https://placehold.co/600x400?text=StayHub+Stay');
};

const getRoomId = (booking) => {
    return booking.roomId?._id || (typeof booking.roomId === 'string' ? booking.roomId : booking.bookingId || null);
};

const getRoomTitle = (booking) => {
    return booking.roomTitle || booking.roomId?.title || 'Reserved Stay';
};

const getRoomAddress = (booking) => {
    if (booking.roomAddress && booking.roomAddress !== 'Unknown Location' && booking.roomAddress !== 'Location N/A') {
        return booking.roomAddress;
    }
    const addr = booking.roomId?.address;
    if (addr) {
        if (typeof addr === 'string') return addr;
        const parts = [addr.city, addr.state].filter(Boolean);
        if (parts.length > 0) return parts.join(', ');
        if (addr.city) return addr.city;
    }
    if (typeof booking.roomId?.location === 'string' && booking.roomId.location.trim()) {
        return booking.roomId.location;
    }
    return 'Location not specified';
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateRange = (checkInStr, checkOutStr) => {
    if (!checkInStr && !checkOutStr) return 'Dates not set';
    if (!checkInStr) return formatDate(checkOutStr);
    if (!checkOutStr) return formatDate(checkInStr);

    const d1 = new Date(checkInStr);
    const d2 = new Date(checkOutStr);

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
        return `${checkInStr} – ${checkOutStr}`;
    }

    const month1 = d1.toLocaleDateString('en-US', { month: 'short' });
    const day1 = d1.getDate();
    const year1 = d1.getFullYear();

    const month2 = d2.toLocaleDateString('en-US', { month: 'short' });
    const day2 = d2.getDate();
    const year2 = d2.getFullYear();

    if (year1 === year2) {
        if (month1 === month2) {
            return `${month1} ${day1} – ${day2}, ${year1}`;
        }
        return `${month1} ${day1} – ${month2} ${day2}, ${year1}`;
    }
    return `${month1} ${day1}, ${year1} – ${month2} ${day2}, ${year2}`;
};

const MyBookingsPage = () => {
    const navigate = useNavigate();
    const { currentUser } = useSelector((state) => state.app);
    const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'confirmed' | 'pending' | 'cancelled'
    const [viewMode, setViewMode] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'list' : 'grid')); // mobile default: list, web default: grid
    const [cancellingId, setCancellingId] = useState(null);
    const [toastMessage, setToastMessage] = useState({ text: '', type: 'success' });

    // Fetch bookings via RTK Query
    const { data: bookingsData, isLoading, error } = useGetMyBookingsQuery(undefined, {
        skip: !currentUser
    });

    const [cancelBookingMutation] = useCancelBookingMutation();

    const bookings = Array.isArray(bookingsData) ? bookingsData : [];
    const message = error?.data?.msg || error?.userMessage || (error ? 'Failed to fetch bookings.' : '');

    const handleCancelBooking = async (e, booking) => {
        e.stopPropagation();
        const roomTitle = getRoomTitle(booking);
        const isConfirmed = window.confirm(`Are you sure you want to cancel your booking for "${roomTitle}"?`);
        if (!isConfirmed) return;

        setCancellingId(booking._id);
        try {
            await cancelBookingMutation(booking._id).unwrap();
            setToastMessage({ text: 'Booking has been cancelled successfully.', type: 'success' });
            setTimeout(() => setToastMessage({ text: '', type: 'success' }), 4000);
        } catch (err) {
            setToastMessage({
                text: err?.data?.msg || err?.message || 'Failed to cancel booking.',
                type: 'error'
            });
            setTimeout(() => setToastMessage({ text: '', type: 'error' }), 4000);
        } finally {
            setCancellingId(null);
        }
    };

    if (!currentUser) {
        return <ProfileSkeleton />;
    }

    const filteredBookings = bookings.filter((b) => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'confirmed') return b.status === 'confirmed' || b.status === 'completed';
        if (filterStatus === 'pending') return b.status === 'pending_payment';
        if (filterStatus === 'cancelled') return b.status === 'cancelled';
        return true;
    });

    const confirmedCount = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length;
    const pendingCount = bookings.filter(b => b.status === 'pending_payment').length;
    const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

    return (
        <main className="min-h-screen bg-slate-50/60 dark:bg-gray-900 pt-4 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto space-y-5">
                <div>
                    <BackButton to="/" label="Back to Home" className="mb-2" />

                    {/* Header Title & Filter Chips */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2.5">
                                <span>My Bookings</span>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">
                                    {bookings.length} {bookings.length === 1 ? 'Stay' : 'Stays'}
                                </span>
                            </h1>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Track and manage your reserved stays, payment statuses, and itineraries.
                            </p>
                        </div>

                        {/* Filter Tabs & Layout Toggle */}
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-200/70 dark:bg-gray-800 overflow-x-auto text-xs font-semibold">
                                <button
                                    type="button"
                                    onClick={() => setFilterStatus('all')}
                                    className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                                        filterStatus === 'all'
                                            ? 'bg-white text-gray-900 shadow-xs dark:bg-teal-600 dark:text-white'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                                >
                                    All ({bookings.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFilterStatus('confirmed')}
                                    className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                                        filterStatus === 'confirmed'
                                            ? 'bg-white text-emerald-700 shadow-xs dark:bg-emerald-600 dark:text-white'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-emerald-600'
                                    }`}
                                >
                                    Confirmed ({confirmedCount})
                                </button>
                                {pendingCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setFilterStatus('pending')}
                                        className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                                            filterStatus === 'pending'
                                                ? 'bg-white text-amber-700 shadow-xs dark:bg-amber-600 dark:text-white'
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
                                        className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                                            filterStatus === 'cancelled'
                                                ? 'bg-white text-rose-700 shadow-xs dark:bg-rose-600 dark:text-white'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-rose-600'
                                        }`}
                                    >
                                        Cancelled ({cancelledCount})
                                    </button>
                                )}
                            </div>

                            {/* View Mode Toggle: Grid / List */}
                            {filteredBookings.length > 0 && (
                                <div className="inline-flex items-center p-1 rounded-lg bg-gray-200/70 dark:bg-gray-800 text-xs font-semibold">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('grid')}
                                        className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                                            viewMode === 'grid'
                                                ? 'bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-300 shadow-xs'
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                        }`}
                                        title="Grid view"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                        </svg>
                                        <span className="hidden sm:inline">Grid</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('list')}
                                        className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                                            viewMode === 'list'
                                                ? 'bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-300 shadow-xs'
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                        }`}
                                        title="List view"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                        <span className="hidden sm:inline">List</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {message && <Toast message={message} type="error" />}
                {toastMessage.text && <Toast message={toastMessage.text} type={toastMessage.type} />}

                {/* Loading Skeleton */}
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="h-28 bg-white dark:bg-gray-800 rounded-lg animate-pulse border border-gray-100 dark:border-gray-800"
                            />
                        ))}
                    </div>
                ) : filteredBookings.length > 0 ? (
                    viewMode === 'grid' ? (
                        /* 5-Column Responsive Grid Layout */
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-4.5 lg:gap-5">
                            {filteredBookings.map((booking, idx) => {
                                const isConfirmed = booking.status === 'confirmed' || booking.status === 'completed';
                                const isPending = booking.status === 'pending_payment';
                                const canCancel = (isConfirmed || isPending) && booking.status !== 'cancelled';
                                const roomTitle = getRoomTitle(booking);
                                const roomId = getRoomId(booking);
                                const roomAddress = getRoomAddress(booking);
                                const checkIn = booking.checkInDate || booking.fromDate;
                                const checkOut = booking.checkOutDate || booking.toDate;
                                const nights = booking.nights || 1;
                                const totalAmount = Number(booking.totalAmount || 0);
                                const hostName = booking.hostName || booking.hostId?.name || 'Host';

                                return (
                                    <div
                                        key={booking._id}
                                        onClick={() => roomId && navigate(`/rooms/${roomId}`)}
                                        className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer animate-card-cascade stagger-${Math.min(idx + 1, 8)}`}
                                    >
                                        <div>
                                            {/* Card Thumbnail */}
                                            <div className="relative aspect-[4/3] w-full bg-gray-100 dark:bg-gray-750 overflow-hidden shrink-0">
                                                <img
                                                    src={getBookingImage(booking)}
                                                    alt={roomTitle}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    loading="lazy"
                                                />

                                                {/* Status Badge */}
                                                <span
                                                    className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider shadow-xs ${
                                                        isConfirmed
                                                            ? 'bg-emerald-600 text-white'
                                                            : isPending
                                                            ? 'bg-amber-500 text-white'
                                                            : 'bg-rose-500 text-white'
                                                    }`}
                                                >
                                                    {isConfirmed ? 'Confirmed' : isPending ? 'Pending' : 'Cancelled'}
                                                </span>

                                                {/* Nights Badge */}
                                                <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                                                    {nights} {nights === 1 ? 'night' : 'nights'}
                                                </span>
                                            </div>

                                            {/* Card Body */}
                                            <div className="p-3 sm:p-3.5">
                                                {/* Location */}
                                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 min-w-0">
                                                    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <span className="truncate">{roomAddress}</span>
                                                </div>

                                                {/* Title */}
                                                <h3
                                                    className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mt-1"
                                                    title={roomTitle}
                                                >
                                                    {roomTitle}
                                                </h3>

                                                {/* Dates Strip */}
                                                <div className="mt-2 py-1 px-2 rounded bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-medium truncate text-[11px]">
                                                        <svg className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <span className="truncate">{formatDateRange(checkIn, checkOut)}</span>
                                                    </div>
                                                </div>

                                                {/* Host & Price */}
                                                <div className="mt-2 flex items-baseline justify-between">
                                                    <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[110px]">
                                                        Host: <strong className="font-semibold text-gray-700 dark:text-gray-300">{hostName}</strong>
                                                    </span>
                                                    <div className="text-right shrink-0">
                                                        <span className="text-sm sm:text-base font-extrabold text-teal-700 dark:text-teal-300">
                                                            ₹{totalAmount.toLocaleString()}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 block -mt-0.5">total</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions Bar at bottom */}
                                        <div className="p-3 sm:p-3.5 pt-0">
                                            <div className="pt-2.5 border-t border-gray-100 dark:border-gray-700/70 flex items-center justify-between text-xs">
                                                {canCancel ? (
                                                    <button
                                                        type="button"
                                                        disabled={cancellingId === booking._id}
                                                        onClick={(e) => handleCancelBooking(e, booking)}
                                                        className="font-semibold text-[11px] text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:underline transition cursor-pointer disabled:opacity-50"
                                                    >
                                                        {cancellingId === booking._id ? 'Cancelling...' : 'Cancel Stay'}
                                                    </button>
                                                ) : (
                                                    <span className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                                                        isConfirmed ? 'text-emerald-600 dark:text-emerald-400' : isPending ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isConfirmed ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                                                        <span>{isConfirmed ? 'Confirmed' : isPending ? 'Pending' : 'Cancelled'}</span>
                                                    </span>
                                                )}

                                                <span className="inline-flex items-center gap-1 font-semibold text-teal-600 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform text-xs">
                                                    <span>View Details</span>
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                    </svg>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Clean Horizontal List View */
                        <div className="space-y-3">
                            {filteredBookings.map((booking, idx) => {
                                const isConfirmed = booking.status === 'confirmed' || booking.status === 'completed';
                                const isPending = booking.status === 'pending_payment';
                                const canCancel = (isConfirmed || isPending) && booking.status !== 'cancelled';
                                const roomTitle = getRoomTitle(booking);
                                const roomId = getRoomId(booking);
                                const roomAddress = getRoomAddress(booking);
                                const checkIn = booking.checkInDate || booking.fromDate;
                                const checkOut = booking.checkOutDate || booking.toDate;
                                const nights = booking.nights || 1;
                                const totalAmount = Number(booking.totalAmount || 0);
                                const hostName = booking.hostName || booking.hostId?.name || 'Host';

                                return (
                                    <div
                                        key={booking._id}
                                        onClick={() => roomId && navigate(`/rooms/${roomId}`)}
                                        className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200/80 dark:border-gray-700/80 overflow-hidden shadow-xs hover:shadow-sm transition-all flex items-center p-3 sm:p-3.5 gap-3.5 group cursor-pointer animate-card-cascade stagger-${Math.min(idx + 1, 8)}`}
                                    >
                                        {/* Thumbnail */}
                                        <div className="relative w-28 sm:w-36 h-24 sm:h-28 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-750 shrink-0">
                                            <img
                                                src={getBookingImage(booking)}
                                                alt={roomTitle}
                                                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-200"
                                                loading="lazy"
                                            />
                                            <span
                                                className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider shadow-xs ${
                                                    isConfirmed
                                                        ? 'bg-emerald-600 text-white'
                                                        : isPending
                                                        ? 'bg-amber-500 text-white'
                                                        : 'bg-rose-500 text-white'
                                                }`}
                                            >
                                                {isConfirmed ? 'Confirmed' : isPending ? 'Pending' : 'Cancelled'}
                                            </span>
                                            <span className="absolute bottom-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                                                {nights} {nights === 1 ? 'nt' : 'nts'}
                                            </span>
                                        </div>

                                        {/* Content Box */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                            {/* Top Line: Category / Ref & Location */}
                                            <div className="flex items-center justify-between gap-1.5">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <p className="text-xs text-gray-400 dark:text-gray-400 truncate flex items-center gap-1">
                                                        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        <span>{roomAddress}</span>
                                                    </p>
                                                </div>

                                                <span className="text-[10px] font-medium text-gray-400 hidden sm:inline shrink-0">
                                                    ID: #{booking._id?.slice(-6).toUpperCase()}
                                                </span>
                                            </div>

                                            {/* Middle Line: Title */}
                                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mt-0.5">
                                                {roomTitle}
                                            </h3>

                                            {/* Dates & Host */}
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                <span className="flex items-center gap-1 text-teal-700 dark:text-teal-300 font-medium text-[11px] sm:text-xs">
                                                    <svg className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span>{formatDateRange(checkIn, checkOut)}</span>
                                                </span>
                                                <span className="text-gray-400 hidden sm:inline">•</span>
                                                <span className="text-gray-500 text-[11px] truncate">
                                                    Host: <strong className="font-semibold text-gray-700 dark:text-gray-300">{hostName}</strong>
                                                </span>
                                            </div>

                                            {/* Bottom Line: Price & Actions */}
                                            <div className="mt-2 flex items-center justify-between gap-2 pt-1.5 border-t border-gray-100 dark:border-gray-700/60">
                                                <div>
                                                    <span className="text-sm sm:text-base font-extrabold text-teal-700 dark:text-teal-300">
                                                        ₹{totalAmount.toLocaleString()}
                                                    </span>
                                                    <span className="text-xs text-gray-400 font-normal"> total</span>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {canCancel && (
                                                        <button
                                                            type="button"
                                                            disabled={cancellingId === booking._id}
                                                            onClick={(e) => handleCancelBooking(e, booking)}
                                                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 px-2 py-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer disabled:opacity-50"
                                                        >
                                                            {cancellingId === booking._id ? 'Cancelling...' : 'Cancel'}
                                                        </button>
                                                    )}

                                                    <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-0.5">
                                                        <span>View Stay</span>
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                        </svg>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    /* Empty State */
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 sm:p-12 text-center border border-gray-200 dark:border-gray-700 max-w-md mx-auto space-y-4 shadow-xs">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center mx-auto">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
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
                            className="inline-flex items-center gap-2 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-5 py-2.5 shadow-xs transition-all cursor-pointer"
                        >
                            <span>Explore Properties</span>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </div>
                )}

            </div>
        </main>
    );
};

export default MyBookingsPage;
