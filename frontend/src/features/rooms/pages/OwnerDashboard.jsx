import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AddEditRoomModal from '../../../components/AddEditRoomModal.jsx';
import RoomCard from '../../../components/RoomCard.jsx';
import Toast from '../../../components/Toast.jsx';
import { icons } from '../../../constants.jsx';
import { deleteRoom } from '../services/roomService.js';
import { useGetMyRoomsQuery } from '../services/roomService.js';
import { DashboardSkeleton } from '../../../components/Skeletons.jsx';

const OwnerDashboard = () => {
    const navigate = useNavigate();
    const { currentUser, geoApiKey } = useSelector((state) => state.app);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [message, setMessage] = useState('');

    // Use RTK Query hook to fetch owner's rooms
    const { data: myRoomsData, isLoading: ownerRoomsLoading, refetch } = useGetMyRoomsQuery(undefined, {
        skip: !currentUser || currentUser?.role !== 'owner'
    });

    const ownerRooms = myRoomsData || [];

    const refreshRooms = () => refetch();

    const handleAddRoom = () => {
        navigate('/add-property');
    };

    const handleEditRoom = (room) => {
        setEditingRoom(room);
        setIsModalOpen(true);
    };

    const handleDeleteRoom = async (room) => {
        const confirmed = window.confirm(`Delete ${room.title}?`);
        if (!confirmed) return;

        try {
            await deleteRoom(room._id);
            setMessage('Property deleted successfully.');
            refreshRooms();
        } catch (err) {
            setMessage(err.response?.data?.msg || 'Failed to delete property.');
        }
    };

    // Separate active and draft properties
    const activeRooms = ownerRooms.filter(room => room.isActive !== false);
    const draftRooms = ownerRooms.filter(room => room.isActive === false);

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Properties</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your listings, keep them up to date, and track their performance.</p>
                </div>
            </div>

            {message && <div className="mb-6"><Toast message={message} type="success" /></div>}

            {ownerRoomsLoading ? (
                <DashboardSkeleton />
            ) : (
                <div className="space-y-10">
                    {/* Add New Property Section */}
                    <section className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 p-8 text-center">
                        <div className="max-w-2xl mx-auto">
                            <div className="rounded-full bg-indigo-100 dark:bg-indigo-900 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                {icons.plus}
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Add a New Property</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">Create a new listing and start earning from your property today.</p>
                            <button type="button" onClick={handleAddRoom} className="rounded-full bg-indigo-600 px-8 py-3 text-base font-semibold text-white hover:bg-indigo-700 transition-colors">
                                Create New Property
                            </button>
                        </div>
                    </section>

                    {/* Active Properties Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-1 h-8 bg-emerald-500 rounded"></div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Active Properties</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{activeRooms.length} property{activeRooms.length !== 1 ? 'ies' : ''} currently live</p>
                            </div>
                        </div>

                        {activeRooms.length > 0 ? (
                            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                {activeRooms.map((room) => (
                                    <RoomCard
                                        key={room._id}
                                        room={room}
                                        icons={icons}
                                        isDashboard={true}
                                        onEdit={handleEditRoom}
                                        onDelete={handleDeleteRoom}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
                                <p className="font-medium">No active properties yet.</p>
                                <p className="text-sm mt-1">Once you add and publish a property, it will appear here.</p>
                            </div>
                        )}
                    </section>

                    {/* Draft Properties Section */}
                    {draftRooms.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-1 h-8 bg-yellow-500 rounded"></div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Draft Properties</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{draftRooms.length} property{draftRooms.length !== 1 ? 'ies' : ''} in draft</p>
                                </div>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                {draftRooms.map((room) => (
                                    <RoomCard
                                        key={room._id}
                                        room={room}
                                        icons={icons}
                                        isDashboard={true}
                                        onEdit={handleEditRoom}
                                        onDelete={handleDeleteRoom}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            <AddEditRoomModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialRoomData={editingRoom}
                onRoomModified={refreshRooms}
                geoApiKey={geoApiKey}
                icons={icons}
            />
        </main>
    );
};

export default OwnerDashboard;