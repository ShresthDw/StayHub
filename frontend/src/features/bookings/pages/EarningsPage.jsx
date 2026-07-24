import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useGetHostEarningsQuery, useGetBookedPropertiesQuery } from '../services/bookingService.js';
import { ProfileSkeleton } from '../../../components/Skeletons.jsx';
import Toast from '../../../components/Toast.jsx';
import BackButton from '../../../components/BackButton.jsx';

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
                <div className="max-w-md mx-auto text-center">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Host Access Only</h1>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        This section is reserved for property hosts. Upgrade your account on the Profile page to list properties and manage earnings.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/profile')}
                        className="mt-6 inline-flex items-center gap-2 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-5 py-2.5 shadow-sm transition-all"
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
        <main className="min-h-screen bg-slate-50/60 dark:bg-gray-900 pt-4 pb-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-7xl mx-auto space-y-5">
                <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
                    <BackButton to="/my-properties" label="Back to My Properties" className="mb-2" />

                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                Host Earnings & Bookings
                            </h1>
                            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">
                                Host Portal
                            </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <button
                                type="button"
                                onClick={() => navigate('/my-properties')}
                                className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-sm transition-all cursor-pointer"
                            >
                                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span>My Properties</span>
                            </button>
                        </div>
                    </div>
                </div>

                {message && <Toast message={message} type="error" />}

                {/* Top KPI Summary Metrics (Unboxed, Single Line in Mobile & Desktop) */}
                <div className="grid grid-cols-3 gap-3 sm:gap-6 py-3 border-b border-gray-200 dark:border-gray-800">
                    {/* Total Revenue */}
                    <div className="flex items-start justify-between min-w-0">
                        <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">Net Earnings</p>
                            <p className="mt-0.5 sm:mt-1 text-sm sm:text-lg md:text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 truncate">₹{totalEarnings.toLocaleString()}</p>
                            <p className="hidden md:block mt-0.5 text-[11px] text-gray-400 dark:text-gray-500 truncate">Completed bookings</p>
                        </div>
                        <div className="hidden sm:block text-gray-400 dark:text-gray-500 shrink-0 mt-0.5">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Total Reservations */}
                    <div className="flex items-start justify-between min-w-0">
                        <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">Reservations</p>
                            <p className="mt-0.5 sm:mt-1 text-sm sm:text-lg md:text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 truncate">{totalBookingsCount}</p>
                            <p className="hidden md:block mt-0.5 text-[11px] text-gray-400 dark:text-gray-500 truncate">All confirmed stays</p>
                        </div>
                        <div className="hidden sm:block text-gray-400 dark:text-gray-500 shrink-0 mt-0.5">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>

                    {/* Average Payout */}
                    <div className="flex items-start justify-between min-w-0">
                        <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">Avg. Payout</p>
                            <p className="mt-0.5 sm:mt-1 text-sm sm:text-lg md:text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 truncate">₹{avgPerBooking.toLocaleString()}</p>
                            <p className="hidden md:block mt-0.5 text-[11px] text-gray-400 dark:text-gray-500 truncate">Per guest stay</p>
                        </div>
                        <div className="hidden sm:block text-gray-400 dark:text-gray-500 shrink-0 mt-0.5">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Main Content Area: Filter Bar & Reservations List (Unboxed Outer) */}
                <div className="space-y-4 pt-1">
                    
                    {/* Control Bar: Tabs & Search */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
                        {/* Tabs */}
                        <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-200/70 dark:bg-gray-800 self-start text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setActiveTab('all')}
                                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
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
                                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
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
                                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
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
                                className="block w-full rounded-md border border-gray-200 bg-white py-2 pl-10 pr-4 text-xs text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Column Headers (visible on md+) */}
                    {!isLoading && filteredBookings.length > 0 && (
                        <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            <div className="md:col-span-4">Property</div>
                            <div className="md:col-span-3">Guest Details</div>
                            <div className="md:col-span-3">Stay Dates</div>
                            <div className="md:col-span-2 text-right">Payout & Status</div>
                        </div>
                    )}

                    {/* Bookings Display */}
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-20 bg-gray-100 dark:bg-gray-750 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : filteredBookings.length > 0 ? (
                        <div className="space-y-3">
                            {filteredBookings.map((item, idx) => {
                                const mainImage = Array.isArray(item.roomImages) && item.roomImages.length > 0
                                    ? (typeof item.roomImages[0] === 'string' ? item.roomImages[0] : item.roomImages[0]?.url)
                                    : null;

                                const checkInDate = new Date(item.checkInDate);
                                const checkOutDate = new Date(item.checkOutDate);
                                const isPast = checkOutDate < new Date();

                                return (
                                    <div
                                        key={item._id}
                                        className={`grid grid-cols-1 md:grid-cols-12 items-center gap-4 p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 shadow-sm hover:shadow-md hover:border-teal-300 dark:hover:border-teal-500/50 transition-all animate-card-cascade stagger-${Math.min(idx + 1, 8)}`}
                                    >
                                        {/* Property & Thumbnail */}
                                        <div className="md:col-span-4 flex items-center gap-3.5 min-w-0">
                                            <div className="relative h-14 w-14 shrink-0 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700">
                                                {mainImage ? (
                                                    <img src={mainImage} alt={item.roomTitle} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h3
                                                    onClick={() => item.roomId && navigate(`/rooms/${item.roomId}`)}
                                                    className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer transition-colors"
                                                    title={item.roomTitle}
                                                >
                                                    {item.roomTitle}
                                                </h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5" title={item.roomAddress}>
                                                    {item.roomAddress || 'Location N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Guest & Contact */}
                                        <div className="md:col-span-3 text-xs space-y-0.5 min-w-0">
                                            <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                                                {item.guestName || 'Guest'}
                                            </p>
                                            {item.guestEmail && (
                                                <p className="text-gray-500 dark:text-gray-400 truncate" title={item.guestEmail}>
                                                    {item.guestEmail}
                                                </p>
                                            )}
                                            {item.guestPhone && (
                                                <p className="text-gray-500 dark:text-gray-400 truncate">
                                                    {item.guestPhone}
                                                </p>
                                            )}
                                        </div>

                                        {/* Schedule & Duration */}
                                        <div className="md:col-span-3 text-xs space-y-1 min-w-0">
                                            <p className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5 whitespace-nowrap">
                                                <svg className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span>{formatDate(item.checkInDate)} → {formatDate(item.checkOutDate)}</span>
                                            </p>
                                            <p className="text-gray-400 dark:text-gray-500 text-[11px] pl-5">
                                                {item.nights} {item.nights === 1 ? 'night stay' : 'nights stay'}
                                            </p>
                                        </div>

                                        {/* Payout & Status */}
                                        <div className="md:col-span-2 flex md:flex-col items-center md:items-end justify-between md:justify-center gap-1 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-700">
                                            <span className="text-base font-extrabold text-teal-700 dark:text-teal-300">
                                                ₹{item.totalAmount?.toLocaleString() || '0'}
                                            </span>
                                            <span
                                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
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
                        <div className="text-center py-16 px-4 space-y-4 max-w-md mx-auto">
                            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 flex items-center justify-center mx-auto">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
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
                                    className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-xs font-semibold px-4 py-2 text-gray-700 dark:text-gray-200 transition-all cursor-pointer"
                                >
                                    Clear Search
                                </button>
                            ) : (
                                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/my-properties')}
                                        className="inline-flex items-center gap-1.5 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2 shadow-sm transition-all cursor-pointer"
                                    >
                                        Manage Properties
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/my-bookings')}
                                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-semibold px-4 py-2 text-gray-700 dark:text-gray-200 shadow-sm transition-all cursor-pointer"
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
