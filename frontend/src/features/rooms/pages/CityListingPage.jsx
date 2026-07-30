import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import RoomCard from '../../../components/RoomCard.jsx';
import BackButton from '../../../components/BackButton.jsx';
import { icons } from '../../../constants.jsx';
import { PageSkeleton } from '../../../components/Skeletons.jsx';
import Toast from '../../../components/Toast.jsx';
import { setCheckInDate, setCheckOutDate } from '../../../store/appSlice.js';
import { useGetRoomsByCityQuery } from '../../../api/apiSlice.js';
import { getRoomCardThumbnail } from '../../../utils/imageKitOptimizer.js';

const getAddressLine = (room) => {
    const parts = [room?.address?.street, room?.address?.city, room?.address?.state, room?.address?.country].filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
    if (typeof room?.location === 'string' && room.location.trim()) return room.location;
    if (room?.address?.formatted) return room.address.formatted;
    return 'Location not provided';
};

const CityListingPage = () => {
    const { city } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { checkInDate, checkOutDate } = useSelector((state) => state.app);
    const [sortBy, setSortBy] = useState('popular');
    const [viewMode, setViewMode] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'list' : 'grid')); // mobile default: list, web default: grid
    const [toast, setToast] = useState(null);
    const [tempCheckInDate, setTempCheckInDate] = useState(checkInDate || '');
    const [tempCheckOutDate, setTempCheckOutDate] = useState(checkOutDate || '');
    const [showFilters, setShowFilters] = useState(false);
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef({});

    const decodedCity = decodeURIComponent(city);

    // Use RTK Query hook to fetch rooms by city
    const { data: cityRoomsData, isLoading: cityRoomsLoading } = useGetRoomsByCityQuery({
        cityName: decodedCity,
        checkInDate,
        checkOutDate
    });

    const cityRooms = cityRoomsData?.rooms || [];

    const handleApplyDateFilter = () => {
        if (tempCheckInDate && tempCheckOutDate) {
            if (new Date(tempCheckOutDate) <= new Date(tempCheckInDate)) {
                setToast({ message: 'Check-out date must be after check-in date', type: 'error' });
                return;
            }
            dispatch(setCheckInDate(tempCheckInDate));
            dispatch(setCheckOutDate(tempCheckOutDate));
        } else if (tempCheckInDate || tempCheckOutDate) {
            setToast({ message: 'Please select both check-in and check-out dates', type: 'error' });
        } else {
            dispatch(setCheckInDate(''));
            dispatch(setCheckOutDate(''));
        }
    };

    const handleClearDateFilter = () => {
        setTempCheckInDate('');
        setTempCheckOutDate('');
        dispatch(setCheckInDate(''));
        dispatch(setCheckOutDate(''));
    };

    // Use cityRooms directly from Redux and apply sorting
    const citiesRooms = useMemo(() => {
        const sorted = [...(cityRooms || [])];
        switch (sortBy) {
            case 'price-low':
                sorted.sort((a, b) => (a.pricePerNight || 0) - (b.pricePerNight || 0));
                break;
            case 'price-high':
                sorted.sort((a, b) => (b.pricePerNight || 0) - (a.pricePerNight || 0));
                break;
            case 'rating':
                sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'popular':
            default:
                sorted.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
                break;
        }
        return sorted;
    }, [cityRooms, sortBy]);

    const handleRoomClick = (room) => navigate(`/rooms/${room._id}`);

    // Initialize and update map
    useEffect(() => {
        if (!mapRef.current || !window.L) return;

        if (!mapInstanceRef.current) {
            mapInstanceRef.current = L.map(mapRef.current).setView([20.5937, 78.9629], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
                minZoom: 2
            }).addTo(mapInstanceRef.current);
        }

        // Clear existing markers
        Object.values(markersRef.current).forEach(marker => {
            mapInstanceRef.current.removeLayer(marker);
        });
        markersRef.current = {};

        if (citiesRooms.length > 0) {
            const bounds = L.latLngBounds();
            
            citiesRooms.forEach(room => {
                // GeoJSON format: coordinates are [longitude, latitude]
                const coords = room.location?.coordinates;
                if (coords && coords[0] && coords[1]) {
                    const lat = coords[1];
                    const lng = coords[0];

                    const escapeHtml = (str) => String(str || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
                    const safeTitle = escapeHtml(room.title || 'Property');
                    const safePrice = Number(room.pricePerNight || 0).toLocaleString();

                    // Create custom price badge marker
                    const priceIcon = L.divIcon({
                        html: `
                            <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.25));">
                                <div style="
                                    display: inline-flex;
                                    align-items: center;
                                    gap: 3px;
                                    background: #0f172a;
                                    color: #ffffff;
                                    padding: 5px 10px;
                                    border-radius: 9999px;
                                    font-size: 13px;
                                    font-weight: 700;
                                    white-space: nowrap;
                                    border: 1.5px solid #ffffff;
                                    transition: transform 0.15s ease;
                                ">
                                    <span style="color: #2dd4bf; font-weight: 800;">₹</span>${safePrice}
                                </div>
                                <div style="
                                    width: 0;
                                    height: 0;
                                    border-left: 5px solid transparent;
                                    border-right: 5px solid transparent;
                                    border-top: 6px solid #0f172a;
                                    margin-top: -1px;
                                "></div>
                            </div>
                        `,
                        className: 'custom-city-price-marker',
                        iconSize: [0, 0],
                        iconAnchor: [0, 0],
                        popupAnchor: [0, -32]
                    });

                    const marker = L.marker(
                        [lat, lng],
                        { icon: priceIcon }
                    ).addTo(mapInstanceRef.current);
                    
                    marker.bindPopup(`
                        <div style="font-family: inherit; width: 190px; padding: 2px;">
                            <h4 style="font-weight: 700; font-size: 13px; color: #0f172a; margin: 0 0 4px 0; line-height: 1.3;">${safeTitle}</h4>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; border-top: 1px solid #f1f5f9; padding-top: 6px;">
                                <span style="font-weight: 800; font-size: 13px; color: #0d9488;">₹${safePrice} <span style="font-size: 10px; font-weight: 500; color: #64748b;">/ night</span></span>
                                <a href="/rooms/${room._id}" style="font-size: 11px; font-weight: 700; color: #0f766e; text-decoration: none; padding: 2px 6px; background: #ccfbf1; border-radius: 4px;">View Stay →</a>
                            </div>
                        </div>
                    `);
                    markersRef.current[room._id] = marker;
                    bounds.extend([lat, lng]);
                }
            });

            // Fit map to show all markers for this city
            if (bounds.isValid()) {
                mapInstanceRef.current.fitBounds(bounds, { 
                    padding: [80, 80],
                    maxZoom: 16
                });
            }
        }

        mapInstanceRef.current.invalidateSize();
    }, [citiesRooms]);

    if (cityRoomsLoading) {
        return <PageSkeleton />;
    }

    return (
        <main className="min-h-screen bg-slate-50/60 dark:bg-gray-900 transition-colors duration-200">
            {/* Header Section */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-750 shadow-xs">
                <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-3.5 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <BackButton to="/" label="Back to Search" className="mb-1.5" />
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                                {decodedCity}
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {citiesRooms.length} {citiesRooms.length === 1 ? 'property' : 'properties'} available in {decodedCity}
                            </p>
                        </div>
                        
                        {/* Actions: View Toggle & Filters */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            {citiesRooms.length > 0 && (
                                <div className="inline-flex items-center p-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-semibold border border-gray-200/60 dark:border-gray-600/60">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('grid')}
                                        className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                                            viewMode === 'grid'
                                                ? 'bg-white dark:bg-gray-600 text-teal-600 dark:text-teal-300 shadow-xs'
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                        }`}
                                        title="Grid view"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                        </svg>
                                        <span className="hidden sm:inline">Grid</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('list')}
                                        className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                                            viewMode === 'list'
                                                ? 'bg-white dark:bg-gray-600 text-teal-600 dark:text-teal-300 shadow-xs'
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                        }`}
                                        title="List view"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                        <span className="hidden sm:inline">List</span>
                                    </button>
                                </div>
                            )}

                            {/* Filter Button */}
                            <button
                                type="button"
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-xs font-semibold shadow-xs transition cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                <span>Filters</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Modal Popup */}
            {showFilters && (
                <>
                    {/* Overlay */}
                    <div 
                        className="fixed inset-0 bg-black/50 z-30 transition-opacity"
                        onClick={() => setShowFilters(false)}
                    />
                    
                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-40 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Filters & Sort</h2>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 space-y-6">
                                {/* Sort Section */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Sort by</label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-teal-500 focus:border-teal-500"
                                    >
                                        <option value="popular">Most Popular</option>
                                        <option value="rating">Highest Rated</option>
                                        <option value="price-low">Price: Low to High</option>
                                        <option value="price-high">Price: High to Low</option>
                                    </select>
                                </div>

                                {/* Date Filter Section */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Filter by dates</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Check-in date</label>
                                            <input
                                                type="date"
                                                onClick={(event) => event.currentTarget.showPicker?.()}
                                                value={tempCheckInDate}
                                                onChange={(e) => setTempCheckInDate(e.target.value)}
                                                className="date-input w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-teal-500 focus:border-teal-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Check-out date</label>
                                            <input
                                                type="date"
                                                onClick={(event) => event.currentTarget.showPicker?.()}
                                                value={tempCheckOutDate}
                                                onChange={(e) => setTempCheckOutDate(e.target.value)}
                                                className="date-input w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-teal-500 focus:border-teal-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                                <button 
                                    onClick={handleApplyDateFilter}
                                    className="flex-1 px-4 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition cursor-pointer"
                                >
                                    Apply Filters
                                </button>
                                {(tempCheckInDate || tempCheckOutDate) && (
                                    <button 
                                        onClick={handleClearDateFilter}
                                        className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition cursor-pointer"
                                    >
                                        Clear All
                                    </button>
                                )}
                                <button 
                                    onClick={() => setShowFilters(false)}
                                    className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Main Content - Full-Width Split Layout */}
            <div className="max-w-7xl 2xl:max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                    {/* Left Panel - Room Listings (No Enclosing Outer Box) */}
                    <div className="w-full lg:w-[58%] xl:w-[60%] flex-1 min-w-0">
                        {citiesRooms.length > 0 ? (
                            <>
                                {viewMode === 'grid' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                                        {citiesRooms.map((room, idx) => (
                                            <div key={room._id} className={`animate-card-cascade stagger-${Math.min(idx + 1, 8)}`}>
                                                <RoomCard 
                                                    room={room} 
                                                    icons={icons} 
                                                    compact
                                                    onClick={() => handleRoomClick(room)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    /* Clean Horizontal List Rows matching Homepage design language */
                                    <div className="space-y-4">
                                        {citiesRooms.map((room, idx) => {
                                            const rawImageUrl = Array.isArray(room.images) && room.images.length > 0 
                                                ? (typeof room.images[0] === 'string' ? room.images[0] : room.images[0]?.url)
                                                : 'https://placehold.co/600x400?text=No+Image';
                                            const imageUrl = getRoomCardThumbnail(rawImageUrl);

                                            return (
                                                <div
                                                    key={room._id}
                                                    onClick={() => handleRoomClick(room)}
                                                    className={`cursor-pointer group flex flex-row items-stretch pb-3.5 sm:pb-4 border-b border-gray-300 dark:border-gray-600 gap-3 sm:gap-4 transition-colors animate-card-cascade stagger-${Math.min(idx + 1, 8)}`}
                                                >
                                                    {/* Square Image Thumbnail on Left */}
                                                    <div className="relative w-28 sm:w-44 md:w-52 h-24 sm:h-32 md:h-36 shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-750 rounded-none">
                                                        <img
                                                            src={imageUrl}
                                                            alt={room.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            loading="lazy"
                                                        />
                                                        {room.propertyType && (
                                                            <span className="absolute top-1.5 left-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                                                                {room.propertyType}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Info on Right */}
                                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                                        <div>
                                                            {/* Location & Star Rating */}
                                                            <div className="flex items-center justify-between gap-1.5">
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                                                                    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                                    </svg>
                                                                    <span className="truncate">{getAddressLine(room)}</span>
                                                                </p>
                                                                <div className="flex items-center gap-0.5 text-xs font-bold text-gray-800 dark:text-gray-200 shrink-0">
                                                                    <svg className="w-3.5 h-3.5 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                    </svg>
                                                                    <span>{room.rating || 'New'}</span>
                                                                </div>
                                                            </div>

                                                            {/* Title */}
                                                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mt-0.5 sm:mt-1" title={room.title}>
                                                                {room.title}
                                                            </h3>

                                                            {/* Room Characteristics */}
                                                            <div className="hidden sm:flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                {room.maxGuests && <span>{room.maxGuests} guests</span>}
                                                                {room.bedrooms && <span>• {room.bedrooms} bedrooms</span>}
                                                                {room.beds && <span>• {room.beds} beds</span>}
                                                                {room.bathrooms && <span>• {room.bathrooms} baths</span>}
                                                            </div>
                                                        </div>

                                                        {/* Price & Action */}
                                                        <div className="mt-1.5 sm:mt-2.5 flex items-baseline justify-between pt-1">
                                                            <p className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-white">
                                                                ₹{Math.max(1, Math.round(room.pricePerNight || 0)).toLocaleString()} <span className="text-[11px] sm:text-xs font-normal text-gray-500 dark:text-gray-400">/ night</span>
                                                            </p>
                                                            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                                                <span>View Stay</span>
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                                </svg>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="text-center py-6 mt-4">
                                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium">
                                        Showing {citiesRooms.length} {citiesRooms.length === 1 ? 'property' : 'properties'} in {decodedCity}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 shadow-xs">
                                <div className="text-5xl mb-3 text-gray-400">{icons.search}</div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No properties found</h2>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-sm mx-auto">
                                    Sorry, there are no available properties matching your criteria in {decodedCity} right now.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => navigate('/')}
                                    className="px-5 py-2.5 bg-teal-600 text-white rounded-md hover:bg-teal-700 text-xs font-semibold cursor-pointer transition"
                                >
                                    Explore Other Cities
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Panel - Sticky Map */}
                    <div className="w-full lg:w-[42%] xl:w-[40%] shrink-0">
                        <div className="sticky top-20 h-72 sm:h-96 lg:h-[calc(100vh-7rem)] w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm bg-gray-100 dark:bg-gray-800">
                            {citiesRooms.length > 0 ? (
                                <div 
                                    ref={mapRef}
                                    className="w-full h-full"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center p-6 text-center">
                                    <div>
                                        <div className="text-4xl mb-2 text-gray-400">{icons.search}</div>
                                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                            No map locations to display for {decodedCity}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </main>
    );
};

export default CityListingPage;
