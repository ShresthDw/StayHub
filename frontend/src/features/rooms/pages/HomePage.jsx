import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getSafeDistance, hasCoordinates, icons, PROPERTY_TYPES } from '../../../constants.jsx';
import MapSearchModal from '../../../components/MapSearchModal.jsx';
import RoomCard from '../../../components/RoomCard.jsx';
import CityCard from '../../../components/CityCard.jsx';
import { PageSkeleton } from '../../../components/Skeletons.jsx';
import { geocodeAddress } from '../../app/services/geoService.js';
import { setFilters, setSearchLocation, setCheckInDate, setCheckOutDate } from '../../../store/appSlice.js';
import { incrementCategoryPage, setCategoryHasMore } from '../../../store/roomsSlice.js';
import {
    useGetPublicRoomsByTypeQuery,
    useGetCitiesQuery
} from '../../../api/apiSlice.js';

const HomePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { categoryPagination } = useSelector((state) => state.rooms);
    const { filters, geoApiKey, checkInDate, checkOutDate, searchLocation } = useSelector((state) => state.app);
    const hasInitializedRef = useRef(false);
    const [tempLocation, setTempLocation] = useState({ address: '', lat: null, lng: null, distance: 10 });
    const [tempCheckInDate, setTempCheckInDate] = useState(checkInDate || '');
    const [tempCheckOutDate, setTempCheckOutDate] = useState(checkOutDate || '');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [searchLocationModal, setSearchLocationModal] = useState(false);
    const [scrollControls, setScrollControls] = useState({});
    const sectionScrollRefs = useRef({});
    
    // Store all rooms by type using RTK Query
    const [allRoomsByType, setAllRoomsByType] = useState({});

    const handleRoomClick = (room) => navigate(`/rooms/${room._id}`);

    const handleFilterChange = (k, v) => dispatch(setFilters({ ...filters, [k]: v }));

    const handleClearFilters = () => {
        dispatch(setFilters({ propertyType: '', amenities: [] }));
    };

    const handleApplySearch = (loc) => {
        dispatch(setSearchLocation(loc));
    };

    // Fetch cities
    const { data: citiesData = [], isLoading: citiesLoading } = useGetCitiesQuery();

    // Call hooks for each property type at top level (not inside useMemo)
    const apartmentQuery = useGetPublicRoomsByTypeQuery({
        propertyType: 'apartment',
        filters,
        searchLocation,
        checkInDate,
        checkOutDate,
        page: categoryPagination['apartment']?.page || 1
    });
    const houseQuery = useGetPublicRoomsByTypeQuery({
        propertyType: 'house',
        filters,
        searchLocation,
        checkInDate,
        checkOutDate,
        page: categoryPagination['house']?.page || 1
    });
    const resortQuery = useGetPublicRoomsByTypeQuery({
        propertyType: 'resort',
        filters,
        searchLocation,
        checkInDate,
        checkOutDate,
        page: categoryPagination['resort']?.page || 1
    });
    const villaQuery = useGetPublicRoomsByTypeQuery({
        propertyType: 'villa',
        filters,
        searchLocation,
        checkInDate,
        checkOutDate,
        page: categoryPagination['villa']?.page || 1
    });
    const hotelQuery = useGetPublicRoomsByTypeQuery({
        propertyType: 'hotel',
        filters,
        searchLocation,
        checkInDate,
        checkOutDate,
        page: categoryPagination['hotel']?.page || 1
    });
    const cottageQuery = useGetPublicRoomsByTypeQuery({
        propertyType: 'cottage',
        filters,
        searchLocation,
        checkInDate,
        checkOutDate,
        page: categoryPagination['cottage']?.page || 1
    });
    const hostelQuery = useGetPublicRoomsByTypeQuery({
        propertyType: 'hostel',
        filters,
        searchLocation,
        checkInDate,
        checkOutDate,
        page: categoryPagination['hostel']?.page || 1
    });

    // Map queries by property type
    const propertyTypeQueries = useMemo(() => ({
        apartment: apartmentQuery,
        house: houseQuery,
        resort: resortQuery,
        villa: villaQuery,
        hotel: hotelQuery,
        cottage: cottageQuery,
        hostel: hostelQuery
    }), [apartmentQuery, houseQuery, resortQuery, villaQuery, hotelQuery, cottageQuery, hostelQuery]);
    // Aggregate all rooms by type
    useEffect(() => {
        const newRoomsByType = {};
        let isAnyLoading = false;

        PROPERTY_TYPES.forEach(propertyType => {
            const { data } = propertyTypeQueries[propertyType];
            if (data?.rooms) {
                newRoomsByType[propertyType] = data.rooms;
                // Update hasMore status based on pagination
                if (data.pagination) {
                    dispatch(setCategoryHasMore({
                        category: propertyType,
                        hasMore: data.pagination.page < data.pagination.pages
                    }));
                }
            } else {
                newRoomsByType[propertyType] = [];
            }
            if (propertyTypeQueries[propertyType].isLoading) {
                isAnyLoading = true;
            }
        });

        setAllRoomsByType(newRoomsByType);
    }, [propertyTypeQueries, dispatch]);

    const updateScrollControls = useCallback((propertyType) => {
        const section = sectionScrollRefs.current[propertyType];
        if (!section) return;

        const canScrollLeft = section.scrollLeft > 4;
        const canScrollRight = section.scrollLeft + section.clientWidth < section.scrollWidth - 4;

        setScrollControls((prev) => {
            const current = prev[propertyType];
            if (current?.canScrollLeft === canScrollLeft && current?.canScrollRight === canScrollRight) {
                return prev;
            }

            return {
                ...prev,
                [propertyType]: {
                    canScrollLeft,
                    canScrollRight
                }
            };
        });
    }, []);

    const handleHorizontalScroll = (propertyType, direction) => {
        const section = sectionScrollRefs.current[propertyType];
        if (!section) return;

        const amount = Math.max(280, Math.round(section.clientWidth * 0.8));
        section.scrollBy({ left: direction * amount, behavior: 'smooth' });
        window.setTimeout(() => updateScrollControls(propertyType), 250);
    };

    // Horizontal infinite scroll listener
    useEffect(() => {
        const listeners = [];

        const attachListeners = () => {
            PROPERTY_TYPES.forEach(propertyType => {
                const section = sectionScrollRefs.current[propertyType];
                if (!section) return;

                const handleScroll = () => {
                    updateScrollControls(propertyType);

                    const { scrollLeft, scrollWidth, clientWidth } = section;
                    const distanceFromEnd = scrollWidth - (scrollLeft + clientWidth);

                    if (distanceFromEnd < 200) {
                        const catPagination = categoryPagination[propertyType];
                        const { isFetching } = propertyTypeQueries[propertyType];
                        if (catPagination?.hasMore && !isFetching) {
                            dispatch(incrementCategoryPage(propertyType));
                        }
                    }
                };

                section.addEventListener('scroll', handleScroll, { passive: true });
                listeners.push({ section, handler: handleScroll });
                updateScrollControls(propertyType);
            });
        };

        const timeoutId = setTimeout(attachListeners, 0);

        return () => {
            clearTimeout(timeoutId);
            listeners.forEach(({ section, handler }) => {
                if (section) {
                    section.removeEventListener('scroll', handler);
                }
            });
        };
    }, [categoryPagination, dispatch, propertyTypeQueries, updateScrollControls]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            PROPERTY_TYPES.forEach(updateScrollControls);
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [allRoomsByType, updateScrollControls]);

    // Initialize on mount
    useEffect(() => {
        if (hasInitializedRef.current) return;
        hasInitializedRef.current = true;
        
        // RTK Query hooks automatically fetch cities and rooms
    }, []);

    const handleManualSearch = async () => {
        setSearchError('');

        if (tempCheckInDate && tempCheckOutDate) {
            if (new Date(tempCheckOutDate) <= new Date(tempCheckInDate)) {
                setSearchError('Check-out date must be after check-in date.');
                return;
            }
            dispatch(setCheckInDate(tempCheckInDate));
            dispatch(setCheckOutDate(tempCheckOutDate));
        } else if (tempCheckInDate || tempCheckOutDate) {
            setSearchError('Please select both check-in and check-out dates or leave both empty.');
            return;
        }

        if (!geoApiKey) {
            setSearchError('Map API is not configured. Please try again later.');
            return;
        }

        const effectiveLocation = {
            ...tempLocation,
            distance: getSafeDistance(tempLocation.distance)
        };

        if (hasCoordinates(effectiveLocation)) {
            handleApplySearch(effectiveLocation);
            return;
        }

        if (effectiveLocation.address && !hasCoordinates(effectiveLocation)) {
            setIsSearching(true);
            try {
                const data = await geocodeAddress(effectiveLocation.address, geoApiKey);
                if (data.features?.length > 0) {
                    const best = data.features[0];
                    const loc = {
                        ...effectiveLocation,
                        lat: best.properties.lat,
                        lng: best.properties.lon,
                        address: best.properties.formatted
                    };
                    setTempLocation(loc);
                    handleApplySearch(loc);
                } else {
                    setSearchError('Address not found. Try a different address or use the map.');
                }
            } catch (err) {
                console.error('Geocoding error:', err);
                setSearchError('Error finding location. Please try again.');
            } finally {
                setIsSearching(false);
            }
        } else {
            setSearchError('Please enter an address or select a location on the map.');
        }
    };


    
    // Check if any query is loading
    const isLoading = Object.values(propertyTypeQueries).some(q => q.isLoading);

    if (isLoading && Object.keys(allRoomsByType).length === 0) {
        return <PageSkeleton />;
    }

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-6">
                {/* User input search area */}
                <div className="mb-8 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 shadow-lg rounded-2xl p-6 border border-indigo-100 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Find Your Perfect Stay</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        {/* Location Input */}
                        <div className="md:col-span-4">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide block mb-2">Where to?</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-400">
                                    {icons.location}
                                </div>
                                <input
                                    type="text"
                                    value={tempLocation.address || ''}
                                    onChange={(e) => setTempLocation((prev) => ({ ...prev, address: e.target.value, lat: null, lng: null }))}
                                    placeholder="City, address, or neighborhood"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Check-in and Check-out Container */}
                        <div className="md:col-span-4 grid grid-cols-2 gap-3">
                            {/* Check-in Date */}
                            <div>
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide block mb-2">Check in</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-400">
                                        {icons.calendar}
                                    </div>
                                    <input
                                        type="date"
                                        value={tempCheckInDate}
                                        onChange={(e) => setTempCheckInDate(e.target.value)}
                                        className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            {/* Check-out Date */}
                            <div>
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide block mb-2">Check out</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-400">
                                        {icons.calendar}
                                    </div>
                                    <input
                                        type="date"
                                        value={tempCheckOutDate}
                                        onChange={(e) => setTempCheckOutDate(e.target.value)}
                                        className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Map Button */}
                        <div className="md:col-span-2">
                            <button 
                                onClick={() => setSearchLocationModal(true)} 
                                className="w-full px-4 py-3 border-2 border-indigo-300 dark:border-indigo-600 rounded-xl text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
                            >
                                {icons.map}
                                <span className="hidden sm:inline">Map</span>
                            </button>
                        </div>

                        {/* Search Button */}
                        <div className="md:col-span-2">
                            <button 
                                onClick={handleManualSearch} 
                                disabled={isSearching} 
                                className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-indigo-400 disabled:to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                {isSearching ? (
                                    <>
                                        <div className="animate-spin">⟳</div>
                                        <span className="hidden sm:inline">Finding…</span>
                                    </>
                                ) : (
                                    <>
                                        {icons.search}
                                        <span className="hidden sm:inline">Search</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Helper Text and Error Message */}
                    <div className="mt-4 space-y-2">
                        {!hasCoordinates(tempLocation) && !searchError && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">💡 Tip: Use the map icon to select a precise location or type a city name</p>
                        )}
                        {searchError && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl">
                                <p className="text-red-700 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                                    <span>⚠️</span>
                                    {searchError}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Horizontal Scrollable Sections by Property Type */}
                {filters.propertyType ? (
                    // Show filtered property type
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 capitalize">{filters.propertyType}s</h3>
                            {allRoomsByType[filters.propertyType]?.length > 0 ? (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {allRoomsByType[filters.propertyType].map((room) => (
                                        <RoomCard key={room._id} room={room} icons={icons} onClick={() => handleRoomClick(room)} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-10">No properties found for this type.</p>
                            )}
                        </div>
                    </div>
                ) : (
                    // Show all property types in horizontal scrollable sections
                    <div className="space-y-8">
                        {PROPERTY_TYPES.map((propertyType) => {
                            const roomsInType = allRoomsByType[propertyType] || [];
                            if (!roomsInType || roomsInType.length === 0) return null;
                            const isFetching = propertyTypeQueries[propertyType]?.isFetching;
                            const controls = scrollControls[propertyType] || {};

                            return (
                                <div key={propertyType}>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 capitalize">{propertyType}s</h3>
                                    <div className="relative">
                                        {/* Left Chevron */}
                                        <button
                                            type="button"
                                            onClick={() => handleHorizontalScroll(propertyType, -1)}
                                            className={`absolute left-2 top-1/3 -translate-y-1/2 z-10 rounded-full bg-white/95 dark:bg-gray-800/95 shadow-md border border-gray-200 dark:border-gray-700 p-2 text-gray-700 dark:text-gray-200 transition-opacity hover:bg-white dark:hover:bg-gray-800 ${controls.canScrollLeft ? 'opacity-100 cursor-pointer' : 'opacity-40 cursor-default'}`}
                                            aria-label={`Scroll ${propertyType} left`}
                                            aria-disabled={!controls.canScrollLeft}
                                        >
                                            {icons.chevronLeft}
                                        </button>

                                        {/* Horizontal scroll container */}
                                        <div
                                            ref={(el) => {
                                                sectionScrollRefs.current[propertyType] = el;
                                            }}
                                            className="flex gap-6 overflow-x-auto pb-4 no-scrollbar scroll-smooth"
                                        >
                                            {roomsInType.map((room) => (
                                                <div key={room._id} className="flex-shrink-0 w-80">
                                                    <RoomCard room={room} icons={icons} onClick={() => handleRoomClick(room)} />
                                                </div>
                                            ))}
                                            
                                            {/* Loading indicator */}
                                            {isFetching && (
                                                <div className="flex-shrink-0 w-80 flex items-center justify-center py-12">
                                                    <div className="text-center space-y-3">
                                                        <div className="flex justify-center">
                                                            <div className="relative w-10 h-10">
                                                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-full opacity-25 animate-pulse"></div>
                                                                <div className="absolute inset-0 border-4 border-transparent border-t-indigo-600 border-r-indigo-600 rounded-full animate-spin"></div>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Loading more...</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Chevron */}
                                        <button
                                            type="button"
                                            onClick={() => handleHorizontalScroll(propertyType, 1)}
                                            className={`absolute right-2 top-1/3 -translate-y-1/2 z-10 rounded-full bg-white/95 dark:bg-gray-800/95 shadow-md border border-gray-200 dark:border-gray-700 p-2 text-gray-700 dark:text-gray-200 transition-opacity hover:bg-white dark:hover:bg-gray-800 ${controls.canScrollRight ? 'opacity-100 cursor-pointer' : 'opacity-40 cursor-default'}`}
                                            aria-label={`Scroll ${propertyType} right`}
                                            aria-disabled={!controls.canScrollRight}
                                        >
                                            {icons.chevronRight}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {Object.values(allRoomsByType).every(rooms => rooms.length === 0) && !filters.propertyType && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-10">No active properties found. Try adjusting your search.</p>
                )}

                {/* Cities Section */}
                {citiesData.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Explore by Cities</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Discover properties in popular cities</p>
                            </div>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {citiesData.map((city) => (
                                <CityCard 
                                    key={city.name}
                                    city={city.name}
                                    imageUrl={city.imageUrl}
                                    roomCount={city.count}
                                    onClick={() => navigate(`/cities/${encodeURIComponent(city.name)}`)}
                                />
                            ))}
                        </div>
                    </div>
                )}

            </div>

            <MapSearchModal
                isOpen={searchLocationModal}
                onClose={() => setSearchLocationModal(false)}
                onApplySearch={(loc) => {
                    setTempLocation(loc);
                    handleApplySearch(loc);
                    setSearchLocationModal(false);
                }}
                initialLocation={tempLocation}
                geoApiKey={geoApiKey}
                icons={icons}
            />
        </main>
    );
};

export default HomePage;

// const HomePage = () => {
//     const dispatch = useDispatch();
//     const navigate = useNavigate();
//     const { publicRooms, publicRoomsLoading, categoryPagination, cities, citiesLoading } = useSelector((state) => state.rooms);
//     const { filters, geoApiKey, checkInDate, checkOutDate } = useSelector((state) => state.app);
//     const hasInitializedRef = useRef(false); // Guard to prevent duplicate initial fetch
//     const [tempLocation, setTempLocation] = useState({ address: '', lat: null, lng: null, distance: 10 });
//     const [tempCheckInDate, setTempCheckInDate] = useState(checkInDate || '');
//     const [tempCheckOutDate, setTempCheckOutDate] = useState(checkOutDate || '');
//     const [isSearching, setIsSearching] = useState(false);
//     const [searchError, setSearchError] = useState('');
//     const [searchLocationModal, setSearchLocationModal] = useState(false);
//     const sectionScrollRefs = useRef({});

//     const handleRoomClick = (room) => navigate(`/rooms/${room._id}`);

//     const handleFilterChange = (k, v) => dispatch(setFilters({ ...filters, [k]: v }));
//     const handleApplyFilters = () => dispatch(fetchPublicRooms());
//     const handleClearFilters = () => {
//         dispatch(setFilters({ propertyType: '', amenities: [] }));
//         dispatch(fetchPublicRooms());
//     };

//     const handleApplySearch = (loc) => {
//         dispatch(setSearchLocation(loc));
//         dispatch(fetchPublicRooms());
//     };

//     const handleHorizontalScroll = (propertyType, direction) => {
//         const section = sectionScrollRefs.current[propertyType];
//         if (!section) return;

//         const amount = Math.max(280, Math.round(section.clientWidth * 0.8));
//         section.scrollBy({ left: direction * amount, behavior: 'smooth' });
//     };

//     // Horizontal infinite scroll listener - loads more items as you scroll right
//     useEffect(() => {
//         const handleScrolls = {};
//         const listeners = [];

//         const attachListeners = () => {
//             PROPERTY_TYPES.forEach(propertyType => {
//                 const section = sectionScrollRefs.current[propertyType];
//                 if (!section) return;

//                 const handleScroll = () => {
//                     const { scrollLeft, scrollWidth, clientWidth } = section;
//                     const distanceFromEnd = scrollWidth - (scrollLeft + clientWidth);

//                     // Trigger load when within 200px of the end (more aggressive)
//                     if (distanceFromEnd < 200) {
//                         const catPagination = categoryPagination[propertyType];
//                         if (catPagination?.hasMore && !catPagination?.isLoading) {
//                             dispatch(fetchMoreRoomsByCategory(propertyType));
//                         }
//                     }
//                 };

//                 handleScrolls[propertyType] = handleScroll;
//                 section.addEventListener('scroll', handleScroll, { passive: true });
//                 listeners.push({ section, handler: handleScroll, type: propertyType });
//             });
//         };

//         const timeoutId = setTimeout(attachListeners, 0);

//         return () => {
//             clearTimeout(timeoutId);
//             listeners.forEach(({ section, handler }) => {
//                 if (section) {
//                     section.removeEventListener('scroll', handler);
//                 }
//             });
//         };
//     }, [categoryPagination, dispatch]);

//     // Fetch cities on component mount (only once)
//     useEffect(() => {
//         if (hasInitializedRef.current) return; // Prevent double fetch in Strict Mode
//         hasInitializedRef.current = true;
        
//         dispatch(fetchCities());
//         dispatch(fetchPublicRooms());
//     }, []);

//     const handleManualSearch = async () => {
//         setSearchError('');

//         // Validate dates
//         if (tempCheckInDate && tempCheckOutDate) {
//             if (new Date(tempCheckOutDate) <= new Date(tempCheckInDate)) {
//                 setSearchError('Check-out date must be after check-in date.');
//                 return;
//             }
//             dispatch(setCheckInDate(tempCheckInDate));
//             dispatch(setCheckOutDate(tempCheckOutDate));
//         } else if (tempCheckInDate || tempCheckOutDate) {
//             setSearchError('Please select both check-in and check-out dates or leave both empty.');
//             return;
//         }

//         if (!geoApiKey) {
//             setSearchError('Map API is not configured. Please try again later.');
//             return;
//         }

//         const effectiveLocation = {
//             ...tempLocation,
//             distance: getSafeDistance(tempLocation.distance)
//         };

//         if (hasCoordinates(effectiveLocation)) {
//             handleApplySearch(effectiveLocation);
//             return;
//         }

//         if (effectiveLocation.address && !hasCoordinates(effectiveLocation)) {
//             setIsSearching(true);
//             try {
//                 const data = await geocodeAddress(effectiveLocation.address, geoApiKey);
//                 if (data.features?.length > 0) {
//                     const best = data.features[0];
//                     const loc = {
//                         ...effectiveLocation,
//                         lat: best.properties.lat,
//                         lng: best.properties.lon,
//                         address: best.properties.formatted
//                     };
//                     setTempLocation(loc);
//                     handleApplySearch(loc);
//                 } else {
//                     setSearchError('Address not found. Try a different address or use the map.');
//                 }
//             } catch (err) {
//                 console.error('Geocoding error:', err);
//                 setSearchError('Error finding location. Please try again.');
//             } finally {
//                 setIsSearching(false);
//             }
//         } else {
//             setSearchError('Please enter an address or select a location on the map.');
//         }
//     };

//     // Group rooms by property type
//     const roomsByPropertyType = useMemo(() => {
//         const grouped = {};
//         PROPERTY_TYPES.forEach(type => {
//             grouped[type] = publicRooms.filter(room => room.propertyType === type);
//         });
//         return grouped;
//     }, [publicRooms]);

//     // Get unique cities with room count and image
//     const citiesData = useMemo(() => {
//         // Use cities from Redux instead of deriving from publicRooms
//         return cities || [];
//     }, [cities]);

//     if (publicRoomsLoading) {
//         return <PageSkeleton />;
//     }

//     return (
//         <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//             <div className="space-y-6">
//                 {/* Property Type Filter Section */}
//                 {/* <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
//                     <div className="flex items-center justify-between gap-4 mb-5">
//                         <div>
//                             <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Popular Property Types</h2>
//                             <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Find your ideal accommodation style</p>
//                         </div>
//                         <button 
//                             onClick={handleClearFilters} 
//                             className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-4 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
//                         >
//                             Clear All
//                         </button>
//                     </div>
//                     <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
//                         {PROPERTY_TYPES.map((type) => (
//                             <button
//                                 key={type}
//                                 type="button"
//                                 onClick={() => handleFilterChange('propertyType', type === filters.propertyType ? '' : type)}
//                                 className={`whitespace-nowrap px-5 py-3 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
//                                     filters.propertyType === type 
//                                         ? 'bg-indigo-600 text-white shadow-lg scale-105' 
//                                         : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-gray-600 border-2 border-transparent'
//                                 }`}
//                             >
//                                 <span className="capitalize">{type}</span>
//                             </button>
//                         ))}
//                     </div>
//                 </div> */}
                
//                 {/* User input search area */}
//                 <div className="mb-8 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 shadow-lg rounded-2xl p-6 border border-indigo-100 dark:border-gray-700">
//                     <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Find Your Perfect Stay</h2>
                    
//                     <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
//                         {/* Location Input */}
//                         <div className="md:col-span-4">
//                             <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide block mb-2">Where to?</label>
//                             <div className="relative">
//                                 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-400">
//                                     {icons.location}
//                                 </div>
//                                 <input
//                                     type="text"
//                                     value={tempLocation.address || ''}
//                                     onChange={(e) => setTempLocation((prev) => ({ ...prev, address: e.target.value, lat: null, lng: null }))}
//                                     placeholder="City, address, or neighborhood"
//                                     className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
//                                 />
//                             </div>
//                         </div>

//                         {/* Check-in and Check-out Container */}
//                         <div className="md:col-span-4 grid grid-cols-2 gap-3">
//                             {/* Check-in Date */}
//                             <div>
//                                 <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide block mb-2">Check in</label>
//                                 <div className="relative">
//                                     <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-400">
//                                         {icons.calendar}
//                                     </div>
//                                     <input
//                                         type="date"
//                                         value={tempCheckInDate}
//                                         onChange={(e) => setTempCheckInDate(e.target.value)}
//                                         className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
//                                     />
//                                 </div>
//                             </div>

//                             {/* Check-out Date */}
//                             <div>
//                                 <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide block mb-2">Check out</label>
//                                 <div className="relative">
//                                     <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-400">
//                                         {icons.calendar}
//                                     </div>
//                                     <input
//                                         type="date"
//                                         value={tempCheckOutDate}
//                                         onChange={(e) => setTempCheckOutDate(e.target.value)}
//                                         className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
//                                     />
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Map Button */}
//                         <div className="md:col-span-2">
//                             <button 
//                                 onClick={() => setSearchLocationModal(true)} 
//                                 className="w-full px-4 py-3 border-2 border-indigo-300 dark:border-indigo-600 rounded-xl text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
//                             >
//                                 {icons.map}
//                                 <span className="hidden sm:inline">Map</span>
//                             </button>
//                         </div>

//                         {/* Search Button */}
//                         <div className="md:col-span-2">
//                             <button 
//                                 onClick={handleManualSearch} 
//                                 disabled={isSearching} 
//                                 className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-indigo-400 disabled:to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
//                             >
//                                 {isSearching ? (
//                                     <>
//                                         <div className="animate-spin">⟳</div>
//                                         <span className="hidden sm:inline">Finding…</span>
//                                     </>
//                                 ) : (
//                                     <>
//                                         {icons.search}
//                                         <span className="hidden sm:inline">Search</span>
//                                     </>
//                                 )}
//                             </button>
//                         </div>
//                     </div>

//                     {/* Helper Text and Error Message */}
//                     <div className="mt-4 space-y-2">
//                         {!hasCoordinates(tempLocation) && !searchError && (
//                             <p className="text-xs text-gray-600 dark:text-gray-400 text-center">💡 Tip: Use the map icon to select a precise location or type a city name</p>
//                         )}
//                         {searchError && (
//                             <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl">
//                                 <p className="text-red-700 dark:text-red-400 text-sm font-medium flex items-center gap-2">
//                                     <span>⚠️</span>
//                                     {searchError}
//                                 </p>
//                             </div>
//                         )}
//                     </div>
//                 </div>

//                 {/* Horizontal Scrollable Sections by Property Type */}
//                 {filters.propertyType ? (
//                     // Show filtered property type
//                     <div className="space-y-6">
//                         <div>
//                             <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 capitalize">{filters.propertyType}s</h3>
//                             {roomsByPropertyType[filters.propertyType]?.length > 0 ? (
//                                 <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
//                                     {roomsByPropertyType[filters.propertyType].map((room) => (
//                                         <RoomCard key={room._id} room={room} icons={icons} onClick={() => handleRoomClick(room)} />
//                                     ))}
//                                 </div>
//                             ) : (
//                                 <p className="text-center text-gray-500 dark:text-gray-400 py-10">No properties found for this type.</p>
//                             )}
//                         </div>
//                     </div>
//                 ) : (
//                     // Show all property types in horizontal scrollable sections
//                     <div className="space-y-8">
//                         {PROPERTY_TYPES.map((propertyType) => {
//                             const roomsInType = roomsByPropertyType[propertyType];
//                             if (!roomsInType || roomsInType.length === 0) return null;
//                             const isLoadingMore = categoryPagination[propertyType]?.isLoading;
//                             const hasMore = categoryPagination[propertyType]?.hasMore;

//                             return (
//                                 <div key={propertyType}>
//                                     <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 capitalize">{propertyType}s</h3>
//                                     <div className="relative">
//                                         {/* Left Chevron */}
//                                         <button
//                                             type="button"
//                                             onClick={() => handleHorizontalScroll(propertyType, -1)}
//                                             className="absolute left-2 top-1/3 -translate-y-1/2 z-10 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-md border border-gray-200 dark:border-gray-700 p-2 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800"
//                                             aria-label={`Scroll ${propertyType} left`}
//                                         >
//                                             {icons.chevronLeft}
//                                         </button>

//                                         {/* Horizontal scroll container */}
//                                         <div
//                                             ref={(el) => {
//                                                 sectionScrollRefs.current[propertyType] = el;
//                                             }}
//                                             className="flex gap-6 overflow-x-auto pb-4 no-scrollbar scroll-smooth"
//                                         >
//                                             {roomsInType.map((room) => (
//                                                 <div key={room._id} className="flex-shrink-0 w-80">
//                                                     <RoomCard room={room} icons={icons} onClick={() => handleRoomClick(room)} />
//                                                 </div>
//                                             ))}
                                            
//                                             {/* Loading indicator */}
//                                             {isLoadingMore && (
//                                                 <div className="flex-shrink-0 w-80 flex items-center justify-center py-12">
//                                                     <div className="text-center space-y-3">
//                                                         <div className="flex justify-center">
//                                                             <div className="relative w-10 h-10">
//                                                                 <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-full opacity-25 animate-pulse"></div>
//                                                                 <div className="absolute inset-0 border-4 border-transparent border-t-indigo-600 border-r-indigo-600 rounded-full animate-spin"></div>
//                                                             </div>
//                                                         </div>
//                                                         <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Loading more...</p>
//                                                     </div>
//                                                 </div>
//                                             )}
//                                         </div>

//                                         {/* Right Chevron */}
//                                         <button
//                                             type="button"
//                                             onClick={() => handleHorizontalScroll(propertyType, 1)}
//                                             className="absolute right-0 top-1/3 -translate-y-1/2 z-10 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-md border border-gray-200 dark:border-gray-700 p-2 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800"
//                                             aria-label={`Scroll ${propertyType} right`}
//                                         >
//                                             {icons.chevronRight}
//                                         </button>
//                                     </div>
//                                 </div>
//                             );
//                         })}
//                     </div>
//                 )}

//                 {publicRooms.length === 0 && !filters.propertyType && (
//                     <p className="text-center col-span-full text-gray-500 dark:text-gray-400 py-10">No active properties found. Try adjusting your search.</p>
//                 )}




//                 {/* Cities Section */}
//                 {citiesData.length > 0 && (
//                     <div className="mb-8">
//                         <div className="flex items-center justify-between mb-4">
//                             <div>
//                                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Explore by Cities</h2>
//                                 <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Discover properties in popular cities</p>
//                             </div>
//                         </div>
//                         <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
//                             {citiesData.map((city) => (
//                                 <CityCard 
//                                     key={city.name}
//                                     city={city.name}
//                                     imageUrl={city.imageUrl}
//                                     roomCount={city.count}
//                                     onClick={() => navigate(`/cities/${encodeURIComponent(city.name)}`)}
//                                 />
//                             ))}
//                         </div>
//                     </div>
//                 )}

//             </div>

//             <MapSearchModal
//                 isOpen={searchLocationModal}
//                 onClose={() => setSearchLocationModal(false)}
//                 onApplySearch={(loc) => {
//                     setTempLocation(loc);
//                     handleApplySearch(loc);
//                     setSearchLocationModal(false);
//                 }}
//                 initialLocation={tempLocation}
//                 geoApiKey={geoApiKey}
//                 icons={icons}
//             />
//         </main>
//     );
// };

// export default HomePage;
