import { useState } from 'react';
import { useSelector } from 'react-redux';
import { icons } from '../../../constants.jsx';
import { useGetBookedPropertiesQuery } from '../services/bookingService.js';
import { ProfileSkeleton } from '../../../components/Skeletons.jsx';
import Toast from '../../../components/Toast.jsx';
import BackButton from '../../../components/BackButton.jsx';

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-80 animate-pulse" />
                    ))}
                </div>
            ) : bookedProperties.length > 0 ? (
                viewMode === 'grid' ? (
                    /* 5-Column Responsive Grid Layout */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-4.5 lg:gap-5">
                        {bookedProperties.map((property) => (
                            <div key={property._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
                                <div>
                                    {/* Property Image */}
                                    <div className="relative aspect-[4/3] w-full bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0">
                                        {property.roomImages && property.roomImages.length > 0 ? (
                                            <img
                                                src={property.roomImages[0].url}
                                                alt={property.roomTitle}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-gray-400 text-xs">No image</span>
                                            </div>
                                        )}
                                        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs ${
                                            property.status === 'confirmed'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-emerald-600 text-white'
                                        }`}>
                                            {property.status === 'confirmed' ? 'Upcoming' : 'Active'}
                                        </div>
                                    </div>

                                    {/* Property Details */}
                                    <div className="p-3 sm:p-3.5">
                                        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 line-clamp-1 mb-0.5" title={property.roomTitle}>{property.roomTitle}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2.5">{property.roomAddress}</p>

                                        {/* Guest Info */}
                                        <div className="border-t border-gray-100 dark:border-gray-700/70 pt-2 mb-2 text-xs">
                                            <p className="font-medium text-gray-700 dark:text-gray-300 truncate">Guest: <strong className="font-semibold">{property.guestName}</strong></p>
                                            {property.guestEmail && (
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{property.guestEmail}</p>
                                            )}
                                        </div>

                                        {/* Booking Dates */}
                                        <div className="border-t border-gray-100 dark:border-gray-700/70 pt-2 mb-2">
                                            <div className="flex justify-between text-[11px] text-gray-600 dark:text-gray-400">
                                                <span>{new Date(property.checkInDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} → {new Date(property.checkOutDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">({property.nights}n)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="p-3 sm:p-3.5 pt-0">
                                    <div className="border-t border-gray-100 dark:border-gray-700/70 pt-2.5 flex justify-between items-center text-xs">
                                        <div>
                                            <span className="text-[10px] text-gray-400 block">Total</span>
                                            <span className="text-sm sm:text-base font-extrabold text-teal-700 dark:text-teal-300">₹{property.totalAmount?.toLocaleString() || '0'}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-gray-400 block">Per Night</span>
                                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">₹{property.pricePerNight?.toLocaleString() || '0'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* List View */
                    <div className="space-y-4">
                        {bookedProperties.map((property) => (
                            <div key={property._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md border border-gray-200/80 dark:border-gray-700/80 overflow-hidden flex flex-col md:flex-row gap-4 p-4 transition-all">
                                <div className="relative w-full md:w-56 h-40 md:h-auto shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                                    {property.roomImages && property.roomImages.length > 0 ? (
                                        <img
                                            src={property.roomImages[0].url}
                                            alt={property.roomTitle}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-gray-400">No image</span>
                                        </div>
                                    )}
                                    <div className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded text-[11px] font-bold shadow-xs ${
                                        property.status === 'confirmed'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-emerald-600 text-white'
                                    }`}>
                                        {property.status === 'confirmed' ? 'Upcoming' : 'Active'}
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div>
                                                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{property.roomTitle}</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{property.roomAddress}</p>
                                            </div>
                                            <div className="text-left sm:text-right shrink-0">
                                                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">₹{property.totalAmount?.toLocaleString() || '0'}</span>
                                                <span className="text-xs text-gray-500 block">₹{property.pricePerNight?.toLocaleString() || '0'} / night</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-xs">
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400">Guest:</span>
                                                <span className="ml-1.5 font-semibold text-gray-800 dark:text-gray-200">{property.guestName}</span>
                                                {property.guestEmail && <span className="text-gray-500 block text-[11px]">{property.guestEmail}</span>}
                                            </div>
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400">Stay Duration:</span>
                                                <span className="ml-1.5 font-semibold text-gray-800 dark:text-gray-200">
                                                    {new Date(property.checkInDate).toLocaleDateString()} → {new Date(property.checkOutDate).toLocaleDateString()}
                                                </span>
                                                <span className="text-gray-500 block text-[11px]">({property.nights} nights)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
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
