import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import RoomCard from '../../../components/RoomCard.jsx';
import { icons } from '../../../constants.jsx';
import { PageSkeleton } from '../../../components/Skeletons.jsx';
import Toast from '../../../components/Toast.jsx';
import { setCheckInDate, setCheckOutDate } from '../../../store/appSlice.js';
import { useGetRoomsByCityQuery } from '../../../api/apiSlice.js';

const CityListingPage = () => {
    const { city } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { checkInDate, checkOutDate } = useSelector((state) => state.app);
    const [sortBy, setSortBy] = useState('popular');
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

                    // Create custom price badge marker
                    const priceIcon = L.divIcon({
                        html: `
                            <div style="
                                background: #5735ff;
                                color: white;
                                padding: 8px 12px;
                                border-radius: 8px;
                                font-size: 14px;
                                font-weight: 600;
                                white-space: nowrap;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                min-width: 60px;
                                text-align: center;
                            ">
                                ₹${room.pricePerNight}
                            </div>
                        `,
                        className: 'price-marker',
                        iconSize: [80, 40],
                        iconAnchor: [40, 40],
                        popupAnchor: [0, -40]
                    });

                    const marker = L.marker(
                        [lat, lng],
                        { icon: priceIcon }
                    ).addTo(mapInstanceRef.current);
                    
                    marker.bindPopup(`<b>${room.title}</b><br>₹${room.pricePerNight}/night`);
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
        <main className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
            {/* Header Section */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-20">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <button
                                onClick={() => navigate('/')}
                                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 mb-2"
                            >
                                {icons.chevronLeft} Back
                            </button>
                            {/* {icons.location} */}
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{decodedCity}</h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                {citiesRooms.length} {citiesRooms.length === 1 ? 'property' : 'properties'} available
                            </p>
                        </div>
                        
                        {/* Filter Button */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition"
                        >
                            {icons.filter || '⚙️'} Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Modal Popup */}
            {showFilters && (
                <>
                    {/* Overlay */}
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity"
                        onClick={() => setShowFilters(false)}
                    />
                    
                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-40 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Filters & Sort</h2>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
                                >
                                    ×
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
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
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
                                                value={tempCheckInDate}
                                                onChange={(e) => setTempCheckInDate(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Check-out date</label>
                                            <input
                                                type="date"
                                                value={tempCheckOutDate}
                                                onChange={(e) => setTempCheckOutDate(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                                <button 
                                    onClick={handleApplyDateFilter}
                                    className="flex-1 px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
                                >
                                    Apply Filters
                                </button>
                                {(tempCheckInDate || tempCheckOutDate) && (
                                    <button 
                                        onClick={handleClearDateFilter}
                                        className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                                    >
                                        Clear All
                                    </button>
                                )}
                                <button 
                                    onClick={() => setShowFilters(false)}
                                    className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Main Content - Responsive Layout */}
            <div className="flex flex-col lg:flex-row flex-1">
                {/* Left Panel - Room Grid */}
                <div className="w-full lg:w-3/5 bg-white dark:bg-gray-900 lg:border-r border-gray-200 dark:border-gray-700 overflow-y-auto max-h-screen lg:max-h-[calc(100vh-80px)]">
                    <div className="px-6 py-4">
                        {citiesRooms.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {citiesRooms.map((room) => (
                                        <RoomCard 
                                            key={room._id} 
                                            room={room} 
                                            icons={icons} 
                                            onClick={() => handleRoomClick(room)}
                                        />
                                    ))}
                                </div>

                                <div className="text-center py-6 mt-4">
                                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                        Showing {citiesRooms.length} {citiesRooms.length === 1 ? 'property' : 'properties'} in {decodedCity}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">{icons.search}</div>
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">No properties found</h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    Sorry, there are no available properties in {decodedCity} right now.
                                </p>
                                <button
                                    onClick={() => navigate('/')}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                                >
                                    Explore Other Cities
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Responsive Map */}
                <div className="w-full lg:w-2/5 bg-gray-100 dark:bg-gray-800 flex-shrink-0 relative z-0">
                    {citiesRooms.length > 0 ? (
                        <div className="w-full h-64 lg:h-screen lg:sticky lg:top-16 p-4 flex items-center justify-center">
                            <div 
                                ref={mapRef}
                                className="w-full h-full rounded-xl border border-gray-300 dark:border-gray-600 shadow-md"
                            />
                        </div>
                    ) : (
                        <div className="w-full h-64 lg:h-screen lg:sticky lg:top-16 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-6xl mb-4">{icons.search}</div>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Select dates and filters to see properties on the map
                                </p>
                            </div>
                        </div>
                    )}
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
