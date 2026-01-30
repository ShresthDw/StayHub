import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { icons, PROPERTY_TYPES } from '../../../constants.jsx';
import RoomCard from '../../../components/RoomCard.jsx';
import CityCard from '../../../components/CityCard.jsx';
import { PageSkeleton } from '../../../components/Skeletons.jsx';
import { setCheckInDate, setCheckOutDate } from '../../../store/appSlice.js';
import { incrementCategoryPage, setCategoryHasMore } from '../../../store/roomsSlice.js';
import {
    useGetPublicRoomsByTypeQuery,
    useGetCitiesQuery
} from '../../../api/apiSlice.js';

// Animated placeholder texts
const PLACEHOLDER_TEXTS = [
    'Where to?',
    'Try "Dehradun"...',
    'Try "Mussoorie"...',
    'Try "Haldwani"...',
    'Try "Devprayag"...',
    'Try "Chennai"...'
];

const HomePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { categoryPagination } = useSelector((state) => state.rooms);
    const { filters, checkInDate, checkOutDate, searchLocation } = useSelector((state) => state.app);
    const isSearching = false;
    const [tempCheckInDate, setTempCheckInDate] = useState(checkInDate || '');
    const [tempCheckOutDate, setTempCheckOutDate] = useState(checkOutDate || '');
    const [searchError, setSearchError] = useState('');
    const [scrollControls, setScrollControls] = useState({});
    const [searchInput, setSearchInput] = useState('');
    const [filteredCities, setFilteredCities] = useState([]);
    const [showCitySuggestions, setShowCitySuggestions] = useState(false);
    const [animatedPlaceholder, setAnimatedPlaceholder] = useState(PLACEHOLDER_TEXTS[0]);
    const [randomRooms, setRandomRooms] = useState([]);
    const debounceTimerRef = useRef(null);
    const sectionScrollRefs = useRef({});
    
    // Store all rooms by type using RTK Query
    const [allRoomsByType, setAllRoomsByType] = useState({});

    const handleRoomClick = (room) => navigate(`/rooms/${room._id}`);

    // Fetch cities
    const { data: citiesData = [] } = useGetCitiesQuery();

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

    // Animated placeholder effect
    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % PLACEHOLDER_TEXTS.length;
            setAnimatedPlaceholder(PLACEHOLDER_TEXTS[index]);
        }, 3000); // Change every 3 seconds
        return () => clearInterval(interval);
    }, []);


    // Debounced city search handler
    const handleCitySearchChange = (value) => {
        setSearchInput(value);
        
        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        if (value.trim() === '') {
            setFilteredCities([]);
            setShowCitySuggestions(false);
            return;
        }

        // Set new timer for debounced search
        debounceTimerRef.current = setTimeout(() => {
            const filtered = citiesData.filter(city =>
                city.name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredCities(filtered);
            setShowCitySuggestions(true);
        }, 300); // 300ms debounce
    };

    // Handle city selection from dropdown
    const handleCitySelect = (cityName) => {
        setSearchInput(cityName);
        setShowCitySuggestions(false);
        navigate(`/cities/${encodeURIComponent(cityName)}`);
    };

    // Get random properties from all available rooms
    useEffect(() => {
        const allRooms = Object.values(allRoomsByType).flat();
        if (allRooms.length > 0) {
            const shuffled = [...allRooms].sort(() => 0.5 - Math.random());
            setRandomRooms(shuffled.slice(0, 5));
        }
    }, [allRoomsByType]);

    // Aggregate all rooms by type using RTK Query
    useEffect(() => {
        const newRoomsByType = {};
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

        // If a city is selected from the search input, navigate to that city
        if (searchInput && searchInput.trim()) {
            navigate(`/cities/${encodeURIComponent(searchInput)}`);
            return;
        }

        setSearchError('Please select a city or location to search.');
    };


    
    // Check if any query is loading
    const isLoading = Object.values(propertyTypeQueries).some(q => q.isLoading);

    if (isLoading && Object.keys(allRoomsByType).length === 0) {
        return <PageSkeleton />;
    }

    return (
        <main className="w-full">
            <div className="space-y-10 pb-12">
                {/* Hero Search Section with Teal Theme */}
                <div className="relative bg-gradient-to-r from-teal-500 to-cyan-500 dark:from-teal-700 dark:to-cyan-700 w-full py-8 px-0">
                    <div className="home-content-rail">
                        <h1 className="text-left text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Find your next favorite stay</h1>
                        <p className="text-left text-teal-100 text-base mb-5">Discover unique places to stay</p>
                        
                        {/* Main Search Bar with Animated Placeholder */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mb-3">
                            {/* Location Search */}
                            <div className="relative md:col-span-1">
                                <label className="text-xs font-semibold text-white uppercase tracking-wide block mb-2">Where</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-xl">
                                        {icons.search}
                                    </div>
                                    <input
                                        type="text"
                                        value={searchInput}
                                        onChange={(e) => handleCitySearchChange(e.target.value)}
                                        placeholder={animatedPlaceholder}
                                        onFocus={() => searchInput && setShowCitySuggestions(true)}
                                        className="w-full pl-12 pr-4 py-3 border-0 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-4 focus:ring-teal-300 dark:focus:ring-teal-600 transition-all shadow-lg font-medium"
                                    />
                                    
                                    {/* City Suggestions Dropdown */}
                                    {showCitySuggestions && filteredCities.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-50">
                                            {filteredCities.map((city) => (
                                                <button
                                                    key={city.name}
                                                    onClick={() => handleCitySelect(city.name)}
                                                    className="w-full text-left px-4 py-3 text-gray-900 dark:text-gray-200 hover:bg-teal-50 dark:hover:bg-gray-600 border-b last:border-b-0 border-gray-200 dark:border-gray-600 transition-colors flex items-center justify-between"
                                                >
                                                    <span className="font-medium">{city.name}</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{city.count} properties</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Check-in and Check-out */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-white uppercase tracking-wide block mb-2">Check in</label>
                                    <input
                                        type="date"
                                        onClick={(event) => event.currentTarget.showPicker?.()}
                                        value={tempCheckInDate}
                                        onChange={(e) => setTempCheckInDate(e.target.value)}
                                        className="date-input w-full px-3 py-3 border-0 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-4 focus:ring-teal-300 dark:focus:ring-teal-600 transition-all shadow-lg font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-white uppercase tracking-wide block mb-2">Check out</label>
                                    <input
                                        type="date"
                                        onClick={(event) => event.currentTarget.showPicker?.()}
                                        value={tempCheckOutDate}
                                        onChange={(e) => setTempCheckOutDate(e.target.value)}
                                        className="date-input w-full px-3 py-3 border-0 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-4 focus:ring-teal-300 dark:focus:ring-teal-600 transition-all shadow-lg font-medium"
                                    />
                                </div>
                            </div>

                            {/* Search Button */}
                            <button 
                                onClick={handleManualSearch} 
                                className="px-6 py-3 bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
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

                        {/* Error Message */}
                        {searchError && (
                            <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl mt-4">
                                <p className="text-red-700 dark:text-red-400 font-medium flex items-center gap-2">
                                    <span>⚠️</span>
                                    {searchError}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="home-content-rail space-y-14">
                {/* Random Properties Section - First Section */}
                {randomRooms.length > 0 && !filters.propertyType && (
                    <div>
                        <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">Explore unique places to stay</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Handpicked properties from around the world</p>
                        <div className="flex w-full gap-5 overflow-x-auto pb-4 no-scrollbar scroll-smooth snap-x">
                            {randomRooms.map((room) => (
                                <div key={room._id} className="w-56 flex-shrink-0 snap-start">
                                    <RoomCard room={room} icons={icons} compact onClick={() => handleRoomClick(room)} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Horizontal Scrollable Sections by Property Type */}
                {filters.propertyType ? (
                    // Show filtered property type
                    <div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 capitalize">{filters.propertyType}s</h3>
                            {allRoomsByType[filters.propertyType]?.length > 0 ? (
                                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                    {allRoomsByType[filters.propertyType].map((room) => (
                                        <RoomCard key={room._id} room={room} icons={icons} compact onClick={() => handleRoomClick(room)} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-10">No properties found for this type.</p>
                            )}
                        </div>
                    </div>
                ) : (
                    // Show all property types in horizontal scrollable sections
                    <div className="space-y-12">
                        {PROPERTY_TYPES.map((propertyType) => {
                            const roomsInType = allRoomsByType[propertyType] || [];
                            if (!roomsInType || roomsInType.length === 0) return null;
                            const isFetching = propertyTypeQueries[propertyType]?.isFetching;
                            const controls = scrollControls[propertyType] || {};

                            return (
                                <div key={propertyType}>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 capitalize">{propertyType}s</h3>
                                    <div className="relative min-w-0">
                                        {/* Left Chevron */}
                                        <button
                                            type="button"
                                            onClick={() => handleHorizontalScroll(propertyType, -1)}
                                            className={`absolute left-2 top-1/3 -translate-y-1/2 z-10 rounded-full bg-white/95 dark:bg-gray-800/95 shadow-md border border-gray-200 dark:border-gray-700 p-2 text-gray-700 dark:text-gray-200 transition-opacity hover:bg-white dark:hover:bg-gray-800 ${controls.canScrollLeft ? 'opacity-100 cursor-pointer' : 'opacity-40 cursor-default'}`}
                                            aria-label={`Scroll ${propertyType} left`}
                                            aria-disabled={!controls.canScrollLeft}
                                            disabled={!controls.canScrollLeft}
                                        >
                                            {icons.chevronLeft}
                                        </button>

                                        {/* Horizontal scroll container */}
                                        <div
                                            ref={(el) => {
                                                sectionScrollRefs.current[propertyType] = el;
                                            }}
                                            className="flex w-full min-w-0 gap-5 overflow-x-auto pb-4 no-scrollbar scroll-smooth snap-x"
                                        >
                                            {roomsInType.map((room) => (
                                                <div key={room._id} className="w-56 flex-shrink-0">
                                                    <RoomCard room={room} icons={icons} compact onClick={() => handleRoomClick(room)} />
                                                </div>
                                            ))}
                                            
                                            {/* Loading indicator */}
                                            {isFetching && (
                                                <div className="w-56 flex-shrink-0 flex items-center justify-center py-12">
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
                                            disabled={!controls.canScrollRight}
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
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Explore by Cities</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Discover properties in popular cities</p>
                            </div>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
            </div>
        </main>
    );
};

export default HomePage;
