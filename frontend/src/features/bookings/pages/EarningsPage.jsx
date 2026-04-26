import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useGetHostEarningsQuery, useGetBookedPropertiesQuery } from '../services/bookingService.js';
import { ProfileSkeleton } from '../../../components/Skeletons.jsx';
import Toast from '../../../components/Toast.jsx';

const EarningsPage = () => {
    const navigate = useNavigate();
    const { currentUser } = useSelector((state) => state.app);
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'upcoming' | 'completed'
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch earnings summary
    const {
        data: earningsData,
        isLoading: earningsLoading,
        error: earningsError
    } = useGetHostEarningsQuery(undefined, {
        skip: !currentUser || currentUser?.role !== 'owner'
    });

    // Fetch detailed booked properties list
    const {
        data: bookedPropertiesData,
        isLoading: bookedLoading,
        error: bookedError
    } = useGetBookedPropertiesQuery(undefined, {
        skip: !currentUser || currentUser?.role !== 'owner'
    });

    const isLoading = earningsLoading || bookedLoading;
    const error = earningsError || bookedError;
    const message = error?.data?.msg || error?.userMessage || (error ? 'Failed to fetch host booking data.' : '');

    const rawBookings = Array.isArray(bookedPropertiesData) && bookedPropertiesData.length > 0
        ? bookedPropertiesData
        : (Array.isArray(earningsData?.bookings) ? earningsData.bookings : (Array.isArray(bookedPropertiesData) ? bookedPropertiesData : []));

    const bookedProperties = Array.isArray(rawBookings) ? rawBookings : [];

    const totalEarnings = typeof earningsData?.totalEarnings === 'number'
        ? earningsData.totalEarnings
        : bookedProperties.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

    const totalBookingsCount = typeof earningsData?.totalBookings === 'number'
        ? earningsData.totalBookings
        : bookedProperties.length;

    const avgPerBooking = totalBookingsCount > 0 ? Math.round(totalEarnings / totalBookingsCount) : 0;

    if (!currentUser) {
        return <ProfileSkeleton />;
    }

    if (currentUser?.role !== 'owner') {
        return (
            <main className="min-h-screen bg-slate-50/60 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md mx-auto text-center bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 text-2xl">
                        🏡
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Host Access Only</h1>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        This section is reserved for property hosts. Upgrade your account on the Profile page to list properties and manage earnings.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/profile')}
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-5 py-2.5 shadow-sm transition-all"
                    >
                        Go to Profile
                    </button>
                </div>
            </main>
        );
    }

    const filteredBookings = bookedProperties.filter((item) => {
        if (!item) return false;
        const matchesSearch =
            (item.roomTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.guestName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.guestEmail || '').toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (item.checkOutDate) {
            const checkOut = new Date(item.checkOutDate);
            if (!isNaN(checkOut.getTime())) {
                const isPast = checkOut < new Date();
                if (activeTab === 'upcoming') return !isPast;
                if (activeTab === 'completed') return isPast;
            }
        }
        return true;
    });

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <main className="min-h-screen bg-slate-50/60 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                Host Earnings & Bookings
                            </h1>
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">
                                Host Portal
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Monitor your rental revenue, guest reservations, and check-in schedules in one place.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => navigate('/my-properties')}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-sm transition-all"
                        >
                            <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>My Properties</span>
                        </button>
                    </div>
                </div>

                {message && <Toast message={message} type="error" />}

                {/* Top KPI Summary Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Total Revenue */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 to-cyan-700 p-6 text-white shadow-lg shadow-teal-900/10 border border-teal-500/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-teal-100">Total Net Earnings</p>
                                <p className="mt-2 text-3xl font-extrabold tracking-tight">₹{totalEarnings.toLocaleString()}</p>
                                <p className="mt-1 text-xs text-teal-100/80">From completed & verified guest bookings</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Total Reservations */}
                    <div className="rounded-3xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-100 dark:border-gray-700/60">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Reservations</p>
                                <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">{totalBookingsCount}</p>
                                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">All confirmed stays</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Average Payout */}
                    <div className="rounded-3xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-100 dark:border-gray-700/60 sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Average Payout</p>
                                <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">₹{avgPerBooking.toLocaleString()}</p>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Average revenue per guest stay</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area: Filter Bar & Reservations List */}
                <div className="rounded-3xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-100 dark:border-gray-700/60 space-y-6">
                    
                    {/* Control Bar: Tabs & Search */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                        {/* Tabs */}
                        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-gray-100 dark:bg-gray-900 self-start text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setActiveTab('all')}
                                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                                    activeTab === 'all'
                                        ? 'bg-white text-gray-900 shadow-sm dark:bg-teal-600 dark:text-white'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            >
                                All Bookings ({bookedProperties.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('upcoming')}
                                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                                    activeTab === 'upcoming'
                                        ? 'bg-white text-teal-700 shadow-sm dark:bg-teal-600 dark:text-white'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-teal-600'
                                }`}
                            >
                                Upcoming / Active
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('completed')}
                                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                                    activeTab === 'completed'
                                        ? 'bg-white text-gray-900 shadow-sm dark:bg-teal-600 dark:text-white'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                                }`}
                            >
                                Completed
                            </button>
                        </div>

                        {/* Search Box */}
                        <div className="relative w-full md:w-72">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by property or guest..."
                                className="block w-full rounded-xl border border-gray-200 bg-gray-50/70 py-2 pl-10 pr-4 text-xs text-gray-900 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-100 transition-all"
                            />
                        </div>
                    </div>

                    {/* Bookings Display */}
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-20 bg-gray-100 dark:bg-gray-750 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : filteredBookings.length > 0 ? (
                        <div className="space-y-3">
                            {filteredBookings.map((item) => {
                                const mainImage = Array.isArray(item.roomImages) && item.roomImages.length > 0
                                    ? (typeof item.roomImages[0] === 'string' ? item.roomImages[0] : item.roomImages[0]?.url)
                                    : null;

                                const checkInDate = new Date(item.checkInDate);
                                const checkOutDate = new Date(item.checkOutDate);
                                const isPast = checkOutDate < new Date();

                                return (
                                    <div
                                        key={item._id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-gray-50/70 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/60 hover:border-teal-300 dark:hover:border-teal-500/40 transition-all gap-4"
                                    >
                                        {/* Property & Thumbnail */}
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700">
                                                {mainImage ? (
                                                    <img src={mainImage} alt={item.roomTitle} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
                                                        🏠
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h3
                                                    onClick={() => item.roomId && navigate(`/rooms/${item.roomId}`)}
                                                    className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer transition-colors"
                                                >
                                                    {item.roomTitle}
                                                </h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                    {item.roomAddress || 'Location N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Guest & Contact */}
                                        <div className="text-xs space-y-0.5 sm:min-w-[160px]">
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">
                                                Guest: {item.guestName || 'Guest'}
                                            </p>
                                            {item.guestEmail && (
                                                <p className="text-gray-500 dark:text-gray-400 truncate">
                                                    {item.guestEmail}
                                                </p>
                                            )}
                                            {item.guestPhone && (
                                                <p className="text-gray-500 dark:text-gray-400">
                                                    {item.guestPhone}
                                                </p>
                                            )}
                                        </div>

                                        {/* Schedule & Duration */}
                                        <div className="text-xs space-y-1 sm:min-w-[170px]">
                                            <p className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span>{formatDate(item.checkInDate)} → {formatDate(item.checkOutDate)}</span>
                                            </p>
                                            <p className="text-gray-400 dark:text-gray-500 text-[11px]">
                                                {item.nights} {item.nights === 1 ? 'night stay' : 'nights stay'}
                                            </p>
                                        </div>

                                        {/* Payout & Status */}
                                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-700">
                                            <span className="text-base font-extrabold text-teal-700 dark:text-teal-300">
                                                ₹{item.totalAmount?.toLocaleString() || '0'}
                                            </span>
                                            <span
                                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    isPast
                                                        ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                }`}
                                            >
                                                {isPast ? 'Completed' : 'Confirmed'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 px-4 space-y-4 max-w-md mx-auto">
                            <div className="w-14 h-14 rounded-3xl bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto text-2xl shadow-sm">
                                📊
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                    {searchTerm ? 'No matching reservations found' : 'No Guest Bookings Yet'}
                                </h3>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {searchTerm
                                        ? 'Try adjusting or clearing your search criteria.'
                                        : 'When travelers book stays at your listed properties, their reservation details, guest contacts, and payout revenue will appear here.'}
                                </p>
                            </div>

                            {searchTerm ? (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-xs font-semibold px-4 py-2 text-gray-700 dark:text-gray-200 transition-all"
                                >
                                    Clear Search
                                </button>
                            ) : (
                                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/my-properties')}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2 shadow-sm transition-all"
                                    >
                                        Manage Properties
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/my-bookings')}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-semibold px-4 py-2 text-gray-700 dark:text-gray-200 shadow-sm transition-all"
                                    >
                                        My Bookings (As Guest)
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </main>
    );
};

export default EarningsPage;
