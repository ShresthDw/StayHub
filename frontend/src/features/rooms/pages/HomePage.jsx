import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { icons, PROPERTY_TYPES } from '../../../constants.jsx';
import RoomCard from '../../../components/RoomCard.jsx';
import CityCard from '../../../components/CityCard.jsx';
import HeroBackgroundAnimation from '../components/HeroBackgroundAnimation.jsx';
import HeroSearchBar from '../components/HeroSearchBar.jsx';
import { PageSkeleton } from '../../../components/Skeletons.jsx';
import { incrementCategoryPage, setCategoryHasMore } from '../../../store/roomsSlice.js';
import {
    useGetPublicRoomsByTypeQuery,
    useGetCitiesQuery
} from '../../../api/apiSlice.js';

const HomePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { categoryPagination } = useSelector((state) => state.rooms);
    const { filters, checkInDate, checkOutDate, searchLocation } = useSelector((state) => state.app);
    const [scrollControls, setScrollControls] = useState({});
    const [randomRooms, setRandomRooms] = useState([]);
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

    // Check if any query is loading
    const isLoading = Object.values(propertyTypeQueries).some(q => q.isLoading);

    if (isLoading && Object.keys(allRoomsByType).length === 0) {
        return <PageSkeleton />;
    }

    return (
        <main className="w-full">
            <div className="space-y-10 pb-12">
                {/* Hero Search Section with Real-Time Cinematic Animated Background extending behind transparent navbar */}
                <div className="relative w-full -mt-11 sm:-mt-12 pt-18 sm:pt-20 pb-10 sm:pb-12 px-0 shadow-md bg-gray-950 min-h-[400px] flex items-center z-20">
                    {/* Cinematic Slideshow + Canvas Particle Engine + Cloud Mist (Safely clips its own images) */}
                    <HeroBackgroundAnimation />

                    <div className="home-content-rail relative z-10 w-full">
                        <h1 className="text-left text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-2 drop-shadow-sm">
                            Find your next favorite stay
                        </h1>
                        <p className="text-left text-teal-50 dark:text-teal-100 text-sm sm:text-base md:text-lg mb-6 font-medium max-w-xl">
                            Explore extraordinary villas, cozy cottages, luxury apartments, and boutique rooms.
                        </p>
                        
                        {/* Redesigned Search Bar Component */}
                        <HeroSearchBar citiesData={citiesData} />
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
