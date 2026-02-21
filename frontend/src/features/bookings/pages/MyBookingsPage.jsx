import { useSelector } from 'react-redux';
import { useGetMyBookingsQuery } from '../services/bookingService.js';
import { ProfileSkeleton } from '../../../components/Skeletons.jsx';
import Toast from '../../../components/Toast.jsx';

const MyBookingsPage = () => {
    const { currentUser } = useSelector((state) => state.app);

    // Use RTK Query hook
    const { data: bookingsData, isLoading, error } = useGetMyBookingsQuery(undefined, {
        skip: !currentUser
    });

    const bookings = bookingsData || [];
    const message = error?.data?.msg || error?.userMessage || (error ? 'Failed to fetch bookings.' : '');

    if (!currentUser) {
        return <ProfileSkeleton />;
    }

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">My Bookings</h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">View all your property bookings with payment status and check-in/check-out dates.</p>
            </div>

            {message && <div className="mb-6"><Toast message={message} type="error" /></div>}

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-80 animate-pulse" />
                    ))}
                </div>
            ) : bookings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookings.map((booking) => (
                        <div key={booking._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                            {/* Property Image */}
                            <div className="relative h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                {booking.roomImages && booking.roomImages.length > 0 && (
                                    <img
                                        src={typeof booking.roomImages[0] === 'string' ? booking.roomImages[0] : booking.roomImages[0]?.url}
                                        alt={booking.roomTitle}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                                {(!booking.roomImages || booking.roomImages.length === 0) && (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-gray-400">No image available</span>
                                    </div>
                                )}
                                {/* Payment Status Badge */}
                                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${
                                    booking.status === 'confirmed'
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                                        : booking.status === 'pending_payment'
                                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
                                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                                }`}>
                                    {booking.paymentStatus}
                                </div>
                            </div>

                            {/* Booking Details */}
                            <div className="p-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{booking.roomTitle}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{booking.roomAddress}</p>

                                {/* Host Info */}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mb-3">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Host: {booking.hostName}</p>
                                    {booking.hostEmail && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{booking.hostEmail}</p>
                                    )}
                                </div>

                                {/* Check-in/Check-out Dates */}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mb-3">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">CHECK-IN</p>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                {new Date(booking.checkInDate).toLocaleDateString()}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(booking.checkInDate).toLocaleDateString('en-US', { weekday: 'short' })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">CHECK-OUT</p>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                {new Date(booking.checkOutDate).toLocaleDateString()}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(booking.checkOutDate).toLocaleDateString('en-US', { weekday: 'short' })}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        Duration: <span className="font-medium text-gray-700 dark:text-gray-300">{booking.nights} night{booking.nights !== 1 ? 's' : ''}</span>
                                    </p>
                                </div>

                                {/* Payment & Pricing */}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                                    <div className="flex justify-between items-end mb-3">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Payment Status</p>
                                            <p className={`text-sm font-semibold ${
                                                booking.status === 'confirmed'
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : booking.status === 'pending_payment'
                                                    ? 'text-yellow-600 dark:text-yellow-400'
                                                    : 'text-red-600 dark:text-red-400'
                                            }`}>
                                                {booking.paymentStatus}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Amount</p>
                                            <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                                ₹{booking.totalAmount?.toLocaleString() || '0'}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        ₹{booking.pricePerNight?.toLocaleString() || '0'}/night × {booking.nights} nights
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No bookings yet. Start exploring properties to make your first booking!</p>
                </div>
            )}
        </main>
    );
};

export default MyBookingsPage;
