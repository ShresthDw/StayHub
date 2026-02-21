import { useSelector } from 'react-redux';
import { useGetMyBookingsQuery } from '../services/bookingService.js';
import { ProfileSkeleton } from '../../../components/Skeletons.jsx';
import Toast from '../../../components/Toast.jsx';

const BookingsPage = () => {
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
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">Host Bookings</h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Track all guest reservations across your listed properties.</p>
            </div>

            {message && <div className="mb-6"><Toast message={message} type="error" /></div>}

            {isLoading ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <div className="space-y-3">
                        {Array.from({ length: 6 }).map((_, idx) => (
                            <div key={idx} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
                        ))}
                    </div>
                </div>
            ) : bookings.length > 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Property</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Host</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Check-in</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((booking) => (
                                    <tr key={booking._id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{booking.roomId?.title || 'Property'}</td>
                                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{booking.hostId?.name || 'Host'}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                                                booking.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' :
                                                booking.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200' :
                                                'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                                            }`}>
                                                {booking.status?.replace(/_/g, ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">₹{Number(booking.totalAmount || 0).toLocaleString()}</td>
                                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{booking.checkInDate || booking.fromDate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No bookings yet. Once guests start booking, they will appear here.</p>
                </div>
            )}
        </main>
    );
};

export default BookingsPage;
