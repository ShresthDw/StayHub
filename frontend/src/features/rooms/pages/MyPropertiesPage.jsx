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
    const [viewMode, setViewMode] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'list' : 'grid')); // mobile default: list, web default: grid

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
        <main className="min-h-screen bg-slate-50/60 dark:bg-gray-900 pt-4 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto space-y-5">
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
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all shrink-0 cursor-pointer"
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
                    {/* Status Filter Tabs & Layout View Toggle */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                        <div className="inline-flex p-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setSelectedTab('all')}
                                className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
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
                                className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
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
                                className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                                    selectedTab === 'draft'
                                        ? 'bg-white dark:bg-gray-700 text-amber-700 dark:text-amber-300 shadow-xs'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            >
                                Drafts ({draftRooms.length})
                            </button>
                        </div>

                        {/* Layout Toggle: Grid / List */}
                        {filteredRooms.length > 0 && (
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

                    {/* Properties Display: Grid or List */}
                    {filteredRooms.length > 0 ? (
                        viewMode === 'grid' ? (
                            /* 5-Column Responsive Grid Layout without distortion */
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-4.5 lg:gap-5">
                                {filteredRooms.map((room, idx) => {
                                    const isActive = room.isActive !== false;
                                    return (
                                        <div
                                            key={room._id}
                                            className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group animate-card-cascade stagger-${Math.min(idx + 1, 8)}`}
                                        >
                                            {/* Thumbnail with LIVE / DRAFT Badge */}
                                            <div className="relative aspect-[4/3] w-full bg-gray-100 dark:bg-gray-750 overflow-hidden shrink-0">
                                                <img
                                                    src={getImageUrl(room)}
                                                    alt={room.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    loading="lazy"
                                                />
                                                <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider shadow-xs ${
                                                    isActive ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                                                }`}>
                                                    {isActive ? 'LIVE' : 'DRAFT'}
                                                </span>
                                                {room.propertyType && (
                                                    <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                                                        {room.propertyType}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Card Content */}
                                            <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 min-w-0">
                                                        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        <span className="truncate">{getAddressLine(room)}</span>
                                                    </div>
                                                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mt-1" title={room.title}>
                                                        {room.title}
                                                    </h3>
                                                    <p className="mt-1.5 text-sm sm:text-base font-extrabold text-gray-900 dark:text-gray-100">
                                                        ₹{Number(room.pricePerNight || 0).toLocaleString()} <span className="text-[11px] text-gray-500 font-normal">/ night</span>
                                                    </p>
                                                </div>

                                                {/* Actions bar at card bottom */}
                                                <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-700/70 flex items-center justify-between text-xs">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/rooms/${room._id}`)}
                                                        className="font-semibold text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition cursor-pointer text-xs"
                                                    >
                                                        Details
                                                    </button>
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditRoom(room)}
                                                            className="px-2 py-0.5 rounded text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/40 dark:text-teal-300 dark:hover:bg-teal-900/60 transition cursor-pointer"
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
                            /* List Layout */
                            <div className="space-y-3">
                                {filteredRooms.map((room, idx) => {
                                    const isActive = room.isActive !== false;
                                    return (
                                        <div
                                            key={room._id}
                                            className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200/80 dark:border-gray-700/80 overflow-hidden shadow-xs hover:shadow-sm transition-all flex items-center p-3 sm:p-3.5 gap-3.5 group animate-card-cascade stagger-${Math.min(idx + 1, 8)}`}
                                        >
                                            {/* Thumbnail with LIVE / DRAFT Badge */}
                                            <div className="relative w-24 h-20 sm:w-28 sm:h-22 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-750 shrink-0">
                                                <img
                                                    src={getImageUrl(room)}
                                                    alt={room.title}
                                                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-200"
                                                    loading="lazy"
                                                />
                                                <span className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider shadow-xs ${
                                                    isActive ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                                                }`}>
                                                    {isActive ? 'LIVE' : 'DRAFT'}
                                                </span>
                                            </div>

                                            {/* Content Box */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                                {/* Top Line: Category Badge + Location */}
                                                <div className="flex items-center gap-2">
                                                    {room.propertyType && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 shrink-0">
                                                            {room.propertyType}
                                                        </span>
                                                    )}
                                                    <p className="text-xs text-gray-400 dark:text-gray-400 truncate flex items-center gap-1">
                                                        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        <span>{getAddressLine(room)}</span>
                                                    </p>
                                                </div>

                                                {/* Middle Line: Title */}
                                                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mt-1">
                                                    {room.title}
                                                </h3>

                                                {/* Bottom Line: Price on Left, Actions on Right */}
                                                <div className="mt-2 flex items-center justify-between gap-2">
                                                    <div>
                                                        <span className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-gray-100">
                                                            ₹{Number(room.pricePerNight || 0).toLocaleString()}
                                                        </span>
                                                        <span className="text-xs text-gray-400 font-normal"> / nt</span>
                                                    </div>

                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => navigate(`/rooms/${room._id}`)}
                                                            className="text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition cursor-pointer"
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditRoom(room)}
                                                            className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 transition cursor-pointer"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteRoom(room)}
                                                            className="text-gray-400 hover:text-red-600 transition p-1 cursor-pointer"
                                                            title="Delete property"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        )
                    ) : (
                        <div className="py-12 px-4 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-850/40 text-center max-w-sm mx-auto">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                {selectedTab === 'draft' ? 'No draft properties' : 'No properties listed yet'}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Start hosting by listing your first property.
                            </p>
                            <button
                                type="button"
                                onClick={handleAddRoom}
                                className="mt-3 px-3.5 py-1.5 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition cursor-pointer"
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
            </div>
        </main>
    );
};

export default MyPropertiesPage;
