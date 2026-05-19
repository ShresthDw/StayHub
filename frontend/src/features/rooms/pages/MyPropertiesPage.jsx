import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AddEditRoomModal from '../../../components/AddEditRoomModal.jsx';
import Toast from '../../../components/Toast.jsx';
import BackButton from '../../../components/BackButton.jsx';
import { deleteRoom } from '../services/roomService.js';
import { useGetMyRoomsQuery } from '../services/roomService.js';
import { DashboardSkeleton } from '../../../components/Skeletons.jsx';
import { getRoomCardThumbnail } from '../../../utils/imageKitOptimizer.js';

const getAddressLine = (room) => {
    const parts = [room?.address?.street, room?.address?.city, room?.address?.state]
        .filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
    if (typeof room?.location === 'string' && room.location.trim()) return room.location;
    return 'Location not provided';
};

const getImageUrl = (room) => {
    const rawUrl = Array.isArray(room?.images) && room.images.length > 0 
        ? (typeof room.images[0] === 'string' ? room.images[0] : room.images[0]?.url)
        : null;
    return getRoomCardThumbnail(rawUrl || 'https://placehold.co/600x400?text=No+Image');
};

const MyPropertiesPage = () => {
    const navigate = useNavigate();
    const { currentUser, geoApiKey } = useSelector((state) => state.app);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [message, setMessage] = useState('');
    const [selectedTab, setSelectedTab] = useState('all'); // 'all' | 'active' | 'draft'

    // Fetch owner's properties via RTK Query
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
        const confirmed = window.confirm(`Are you sure you want to delete "${room.title}"?`);
        if (!confirmed) return;

        try {
            await deleteRoom(room._id);
            setMessage('Property deleted successfully.');
            refreshRooms();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(err.response?.data?.msg || 'Failed to delete property.');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    // Separate active and draft properties
    const activeRooms = useMemo(() => ownerRooms.filter(room => room.isActive !== false), [ownerRooms]);
    const draftRooms = useMemo(() => ownerRooms.filter(room => room.isActive === false), [ownerRooms]);

    // Filter properties based on tab
    const filteredRooms = useMemo(() => {
        if (selectedTab === 'active') return activeRooms;
        if (selectedTab === 'draft') return draftRooms;
        return ownerRooms;
    }, [ownerRooms, activeRooms, draftRooms, selectedTab]);

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-12 min-h-screen">
            <BackButton fallback="/" className="mb-2" />

            {/* Header with Title & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-200 dark:border-gray-800">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                        My Properties
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Manage your stays, pricing, and availability.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleAddRoom}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all shrink-0 cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>List New Property</span>
                </button>
            </div>

            {message && (
                <div className="my-3">
                    <Toast message={message} type="success" />
                </div>
            )}

            {ownerRoomsLoading ? (
                <div className="mt-6">
                    <DashboardSkeleton />
                </div>
            ) : (
                <div className="mt-4 space-y-4">
                    {/* Compact Metrics Strip */}
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                        <div className="bg-white dark:bg-gray-800 px-3.5 py-2.5 rounded-xl border border-gray-200/70 dark:border-gray-700/70 flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total</span>
                            <span className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100">{ownerRooms.length}</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 px-3.5 py-2.5 rounded-xl border border-gray-200/70 dark:border-gray-700/70 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span className="text-[11px] font-semibold uppercase tracking-wide">Active</span>
                            </div>
                            <span className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100">{activeRooms.length}</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 px-3.5 py-2.5 rounded-xl border border-gray-200/70 dark:border-gray-700/70 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                <span className="text-[11px] font-semibold uppercase tracking-wide">Drafts</span>
                            </div>
                            <span className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100">{draftRooms.length}</span>
                        </div>
                    </div>

                    {/* Status Filter Tabs */}
                    <div className="flex items-center justify-between pt-1">
                        <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setSelectedTab('all')}
                                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                                    selectedTab === 'all'
                                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-xs'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            >
                                All ({ownerRooms.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedTab('active')}
                                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                                    selectedTab === 'active'
                                        ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            >
                                Active ({activeRooms.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedTab('draft')}
                                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                                    selectedTab === 'draft'
                                        ? 'bg-white dark:bg-gray-700 text-amber-700 dark:text-amber-300 shadow-xs'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            >
                                Drafts ({draftRooms.length})
                            </button>
                        </div>
                    </div>

                    {/* Responsive Properties Display: List on Mobile, Compact Grid on Desktop */}
                    {filteredRooms.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2.5 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {filteredRooms.map((room) => {
                                const isActive = room.isActive !== false;
                                return (
                                    <div
                                        key={room._id}
                                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden shadow-xs hover:shadow-sm transition-all flex flex-row sm:flex-col group p-2.5 sm:p-0"
                                    >
                                        {/* Thumbnail: Square row on mobile, top card banner on desktop */}
                                        <div className="relative w-20 h-20 sm:w-full sm:h-36 rounded-lg sm:rounded-none sm:rounded-t-xl overflow-hidden bg-gray-100 dark:bg-gray-750 shrink-0">
                                            <img
                                                src={getImageUrl(room)}
                                                alt={room.title}
                                                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-200"
                                                loading="lazy"
                                            />
                                            <div className="absolute top-1 left-1 sm:top-2 sm:left-2 flex items-center gap-1">
                                                <span className={`px-1.5 py-0.5 sm:px-2 rounded text-[8px] sm:text-[9px] font-bold uppercase tracking-wider backdrop-blur-md ${
                                                    isActive ? 'bg-emerald-600/90 text-white' : 'bg-amber-500/90 text-white'
                                                }`}>
                                                    {isActive ? 'Live' : 'Draft'}
                                                </span>
                                                {room.propertyType && (
                                                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold capitalize bg-black/60 text-white backdrop-blur-md">
                                                        {room.propertyType}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Content Box */}
                                        <div className="flex-1 min-w-0 sm:p-3 flex flex-col justify-between pl-2.5 sm:pl-3">
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    {room.propertyType && (
                                                        <span className="sm:hidden text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                            {room.propertyType}
                                                        </span>
                                                    )}
                                                    <p className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                                                        <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        <span>{getAddressLine(room)}</span>
                                                    </p>
                                                </div>

                                                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mt-0.5">
                                                    {room.title}
                                                </h3>
                                            </div>

                                            {/* Price & Actions Row */}
                                            <div className="mt-1.5 pt-1.5 sm:mt-2.5 sm:pt-2.5 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                                                <div>
                                                    <span className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-gray-100">
                                                        ₹{Number(room.pricePerNight || 0).toLocaleString()}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400"> / nt</span>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/rooms/${room._id}`)}
                                                        className="px-2 py-0.5 sm:py-1 rounded text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                                                        title="View listing"
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEditRoom(room)}
                                                        className="px-2 py-0.5 sm:py-1 rounded text-xs font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition cursor-pointer"
                                                        title="Edit property"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteRoom(room)}
                                                        className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                                                        title="Delete property"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-12 px-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-850/40 text-center max-w-sm mx-auto">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                {selectedTab === 'draft' ? 'No draft properties' : 'No properties listed yet'}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Start hosting by listing your first property.
                            </p>
                            <button
                                type="button"
                                onClick={handleAddRoom}
                                className="mt-3 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition cursor-pointer"
                            >
                                List Property
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Edit Property Modal */}
            <AddEditRoomModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialRoomData={editingRoom}
                onRoomModified={refreshRooms}
                geoApiKey={geoApiKey}
            />
        </main>
    );
};

export default MyPropertiesPage;
