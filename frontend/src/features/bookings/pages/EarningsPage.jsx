import { useSelector } from 'react-redux';
import { icons } from '../../../constants.jsx';
import { useGetHostEarningsQuery } from '../services/bookingService.js';
import { ProfileSkeleton } from '../../../components/Skeletons.jsx';
import Toast from '../../../components/Toast.jsx';

const EarningsPage = () => {
    const { currentUser } = useSelector((state) => state.app);

    // Fetch earnings using RTK Query hook
    const { data: earnings, isLoading, error } = useGetHostEarningsQuery(undefined, {
        skip: !currentUser || currentUser?.role !== 'owner'
    });

    const message = error?.data?.msg || error?.userMessage || (error ? 'Failed to fetch earnings.' : '');

    if (!currentUser) {
        return <ProfileSkeleton />;
    }

    if (currentUser?.role !== 'owner') {
        return (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">Host Earnings</h1>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">Only property owners can view earnings. Become a host to start earning!</p>
                </div>
            </main>
        );
    }

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">Host Earnings</h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Review your booking income, totals, and recent payments.</p>
            </div>

            {message && <div className="mb-6"><Toast message={message} type="error" /></div>}

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl p-6 h-40 animate-pulse" />
                    ))}
                </div>
            ) : earnings ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-green-600 dark:text-green-300 font-semibold">Total Earnings</p>
                                    <p className="text-3xl font-extrabold text-green-700 dark:text-green-200 mt-2">₹{earnings.totalEarnings?.toLocaleString() || '0'}</p>
                                </div>
                                <div className="text-4xl text-green-300 dark:text-green-700">{icons.wallet || '💰'}</div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-blue-600 dark:text-blue-300 font-semibold">Total Bookings</p>
                                    <p className="text-3xl font-extrabold text-blue-700 dark:text-blue-200 mt-2">{earnings.totalBookings || 0}</p>
                                </div>
                                <div className="text-4xl text-blue-300 dark:text-blue-700">{icons.calendar || '📅'}</div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-purple-600 dark:text-purple-300 font-semibold">Average per Booking</p>
                                    <p className="text-3xl font-extrabold text-purple-700 dark:text-purple-200 mt-2">₹{earnings.totalBookings > 0 ? Math.round(earnings.totalEarnings / earnings.totalBookings).toLocaleString() : '0'}</p>
                                </div>
                                <div className="text-4xl text-purple-300 dark:text-purple-700">{icons.trending || '📊'}</div>
                            </div>
                        </div>
                    </div>

                    {earnings.bookings && earnings.bookings.length > 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Bookings</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Property</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Guest</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Mode</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {earnings.bookings.slice(0, 10).map((booking) => (
                                            <tr key={booking._id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{booking.roomTitle}</td>
                                                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{booking.guestName}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${booking.bookingMode === 'daily' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200'}`}>
                                                        {booking.bookingMode === 'daily' ? 'Daily' : 'Monthly'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">₹{booking.amount.toLocaleString()}</td>
                                                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{new Date(booking.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {earnings.bookings.length > 10 && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Showing 10 of {earnings.bookings.length} bookings</p>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                            <p className="text-gray-500 dark:text-gray-400">No earnings yet. Start listing your properties to earn!</p>
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No earnings information available.</p>
                </div>
            )}
        </main>
    );
};

export default EarningsPage;
