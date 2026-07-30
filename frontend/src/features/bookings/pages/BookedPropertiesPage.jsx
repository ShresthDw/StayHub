import { useState } from 'react';
import { useSelector } from 'react-redux';
import { icons } from '../../../constants.jsx';
import { useGetBookedPropertiesQuery } from '../services/bookingService.js';
import { ProfileSkeleton } from '../../../components/Skeletons.jsx';
import Toast from '../../../components/Toast.jsx';
import BackButton from '../../../components/BackButton.jsx';
import { getRoomCardThumbnail } from '../../../utils/imageKitOptimizer.js';

const BookedPropertiesPage = () => {
    const { currentUser } = useSelector((state) => state.app);
    const [viewMode, setViewMode] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'list' : 'grid')); // mobile default: list, web default: grid

    // Use RTK Query hook
    const { data: bookedPropertiesData, isLoading, error } = useGetBookedPropertiesQuery(undefined, {
        skip: !currentUser || currentUser?.role !== 'owner'
    });

    const bookedProperties = bookedPropertiesData || [];
    const message = error?.data?.msg || error?.userMessage || (error ? 'Failed to fetch booked properties.' : '');

    if (!currentUser) {
        return <ProfileSkeleton />;
    }

    if (currentUser?.role !== 'owner') {
        return (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <BackButton to="/my-properties" label="Back to My Properties" className="mb-4" />
                <div className="mb-8">
                    <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Booked Properties</h1>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">Only property owners can view booked properties. Become a host to start receiving bookings!</p>
                </div>
            </main>
        );
    }

    return (
        <main className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <BackButton to="/my-properties" label="Back to My Properties" className="mb-4" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Booked Properties</h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">View all your properties that have active or upcoming bookings.</p>
                </div>

                {bookedProperties.length > 0 && (
                    <div className="inline-flex items-center p-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-semibold border border-gray-200/60 dark:border-gray-700/60 self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                                viewMode === 'grid'
                                    ? 'bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-300 shadow-xs'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                            title="Grid view"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            <span>Grid</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                                viewMode === 'list'
                                    ? 'bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-300 shadow-xs'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                            title="List view"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <span>List</span>
                        </button>
                    </div>
                )}
            </div>

            {message && <div className="mb-6"><Toast message={message} type="error" /></div>}

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-4.5 lg:gap-5">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="bg-gray-200 dark:bg-gray-800 aspect-[4/3] animate-pulse" />
                    ))}
                </div>
            ) : bookedProperties.length > 0 ? (
                viewMode === 'grid' ? (
                    /* 5-Column Responsive Grid Layout (No Outer Box) */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-4.5 lg:gap-5">
                        {bookedProperties.map((property, idx) => {
                            const rawImg = property.roomImages && property.roomImages.length > 0
                                ? (typeof property.roomImages[0] === 'string' ? property.roomImages[0] : property.roomImages[0]?.url)
                                : null;
                            const imageUrl = rawImg ? getRoomCardThumbnail(rawImg) : 'https://placehold.co/600x400?text=Booked+Stay';

                            return (
                                <div key={property._id} className={`group flex flex-col animate-card-cascade stagger-${Math.min(idx + 1, 8)}`}>
                                    {/* Property Image */}
                                    <div className="relative aspect-[4/3] w-full bg-gray-100 dark:bg-gray-750 overflow-hidden shrink-0 rounded-none">
                                        <img
                                            src={imageUrl}
                                            alt={property.roomTitle}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                        />
                                        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider shadow-xs ${
                                            property.status === 'confirmed'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-emerald-600 text-white'
                                        }`}>
                                            {property.status === 'confirmed' ? 'Upcoming' : 'Active'}
                                        </div>
                                        <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                                            {property.nights} {property.nights === 1 ? 'night' : 'nights'}
                                        </span>
                                    </div>

                                    {/* Property Details */}
                                    <div className="pt-2.5 pb-1 px-0 flex flex-col">
                                        {/* Location */}
                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 min-w-0">
                                            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="truncate">{property.roomAddress}</span>
                                        </div>

                                        {/* Title */}
                                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mt-1" title={property.roomTitle}>
                                            {property.roomTitle}
                                        </h3>

                                        {/* Guest Info */}
                                        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                            <p className="truncate">Guest: <strong className="font-semibold text-gray-800 dark:text-gray-200">{property.guestName}</strong></p>
                                        </div>

                                        {/* Booking Dates */}
                                        <div className="mt-1 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                                            <span className="truncate">
                                                {new Date(property.checkInDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {new Date(property.checkOutDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>

                                        {/* Pricing */}
                                        <div className="mt-1.5 flex justify-between items-baseline text-xs">
                                            <div>
                                                <span className="text-sm sm:text-base font-extrabold text-teal-700 dark:text-teal-300">₹{property.totalAmount?.toLocaleString() || '0'}</span>
                                                <span className="text-[10px] text-gray-400"> total</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">₹{property.pricePerNight?.toLocaleString() || '0'}</span>
                                                <span className="text-[10px] text-gray-400"> /nt</span>
                                            </div>
                                        </div>

                                        <div className="w-full border-b border-gray-300 dark:border-gray-600 mt-2.5" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Horizontal List Rows: Image on Left, Info on Right (No Outer Box) */
                    <div className="space-y-4">
                        {bookedProperties.map((property, idx) => {
                            const rawImg = property.roomImages && property.roomImages.length > 0
                                ? (typeof property.roomImages[0] === 'string' ? property.roomImages[0] : property.roomImages[0]?.url)
                                : null;
                            const imageUrl = rawImg ? getRoomCardThumbnail(rawImg) : 'https://placehold.co/600x400?text=Booked+Stay';

                            return (
                                <div
                                    key={property._id}
                                    className={`group flex flex-row items-stretch pb-3.5 sm:pb-4 border-b border-gray-300 dark:border-gray-600 gap-3 sm:gap-4 transition-colors animate-card-cascade stagger-${Math.min(idx + 1, 8)}`}
                                >
                                    {/* Thumbnail on Left */}
                                    <div className="relative w-28 sm:w-44 md:w-52 h-24 sm:h-32 md:h-36 shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-750 rounded-none">
                                        <img
                                            src={imageUrl}
                                            alt={property.roomTitle}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                        />
                                        <div className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider shadow-xs ${
                                            property.status === 'confirmed'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-emerald-600 text-white'
                                        }`}>
                                            {property.status === 'confirmed' ? 'Upcoming' : 'Active'}
                                        </div>
                                        <span className="absolute bottom-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                                            {property.nights} {property.nights === 1 ? 'nt' : 'nts'}
                                        </span>
                                    </div>

                                    {/* Content on Right */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                        <div>
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <span>{property.roomAddress}</span>
                                                </p>
                                                <span className="text-[10px] font-medium text-gray-400 hidden sm:inline shrink-0">
                                                    ID: #{property._id?.slice(-6).toUpperCase()}
                                                </span>
                                            </div>

                                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mt-0.5">
                                                {property.roomTitle}
                                            </h3>

                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                <span>Guest: <strong className="font-semibold text-gray-800 dark:text-gray-200">{property.guestName}</strong></span>
                                                <span className="text-gray-400 hidden sm:inline">•</span>
                                                <span>
                                                    {new Date(property.checkInDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {new Date(property.checkOutDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-2 flex items-center justify-between gap-2 pt-1.5">
                                            <div>
                                                <span className="text-sm sm:text-base font-extrabold text-teal-700 dark:text-teal-300">
                                                    ₹{property.totalAmount?.toLocaleString() || '0'}
                                                </span>
                                                <span className="text-xs text-gray-400 font-normal"> total</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                    ₹{property.pricePerNight?.toLocaleString() || '0'}
                                                </span>
                                                <span className="text-[11px] text-gray-400 font-normal"> / night</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No booked properties yet. List your properties to start receiving bookings!</p>
                </div>
            )}
        </main>
    );
};

export default BookedPropertiesPage;
