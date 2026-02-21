import { useSelector } from 'react-redux';
import { icons } from '../../../constants.jsx';
import { useGetBookedPropertiesQuery } from '../services/bookingService.js';
import { ProfileSkeleton } from '../../../components/Skeletons.jsx';
import Toast from '../../../components/Toast.jsx';

const BookedPropertiesPage = () => {
    const { currentUser } = useSelector((state) => state.app);

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
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">Booked Properties</h1>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">Only property owners can view booked properties. Become a host to start receiving bookings!</p>
                </div>
            </main>
        );
    }

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">Booked Properties</h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">View all your properties that have active or upcoming bookings.</p>
            </div>

            {message && <div className="mb-6"><Toast message={message} type="error" /></div>}

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-80 animate-pulse" />
                    ))}
                </div>
            ) : bookedProperties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookedProperties.map((property) => (
                        <div key={property._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                            {/* Property Image */}
                            <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
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
                                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${
                                    property.status === 'confirmed'
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                        : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                                }`}>
                                    {property.status === 'confirmed' ? 'Upcoming' : 'Active'}
                                </div>
                            </div>

                            {/* Property Details */}
                            <div className="p-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{property.roomTitle}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{property.roomAddress}</p>

                                {/* Guest Info */}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mb-3">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Guest: {property.guestName}</p>
                                    {property.guestEmail && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{property.guestEmail}</p>
                                    )}
                                    {property.guestPhone && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{property.guestPhone}</p>
                                    )}
                                </div>

                                {/* Booking Dates */}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mb-3">
                                    <div className="flex justify-between text-sm">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Check-in</p>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">{new Date(property.checkInDate).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Check-out</p>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">{new Date(property.checkOutDate).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">{property.nights} nights</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Amount</p>
                                        <p className="text-xl font-bold text-green-600 dark:text-green-400">₹{property.totalAmount?.toLocaleString() || '0'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Per Night</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">₹{property.pricePerNight?.toLocaleString() || '0'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No booked properties yet. List your properties to start receiving bookings!</p>
                </div>
            )}
        </main>
    );
};

export default BookedPropertiesPage;
