import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { icons, PROPERTY_TYPES } from '../../../constants.jsx';
import CityCard from '../../../components/CityCard.jsx';
import HeroBackgroundAnimation from '../components/HeroBackgroundAnimation.jsx';
import HeroSearchBar from '../components/HeroSearchBar.jsx';
import CategoryRow from '../components/CategoryRow.jsx';
import ExploreUniquePlaces from '../components/ExploreUniquePlaces.jsx';
import { useGetHomeFeedQuery, useGetCitiesQuery } from '../../../api/apiSlice.js';

const HomePage = () => {
    const navigate = useNavigate();
    const { filters, checkInDate, checkOutDate, searchLocation } = useSelector((state) => state.app);

    const handleRoomClick = (room) => navigate(`/rooms/${room._id}`);

    const hasActiveFilters = Boolean(
        filters.propertyType ||
        (filters.amenities && filters.amenities.length > 0) ||
        searchLocation?.lat ||
        searchLocation?.address ||
        checkInDate ||
        checkOutDate
    );

    // Fetch consolidated home feed in a single ultra-fast network request
    const { data: homeFeed } = useGetHomeFeedQuery(undefined, {
        skip: hasActiveFilters
    });

    // Fallback cities query if homeFeed is skipped due to active filters
    const { data: fallbackCities = [] } = useGetCitiesQuery(undefined, {
        skip: !hasActiveFilters && Boolean(homeFeed?.cities?.length)
    });

    const citiesData = homeFeed?.cities || fallbackCities || [];

    return (
        <main className="w-full">
            <div className="space-y-10 pb-12">
                {/* Hero Search Section with Real-Time Cinematic Animated Background extending behind transparent navbar */}
                <div className="relative w-full -mt-12 pt-20 sm:pt-24 md:pt-28 pb-10 sm:pb-12 px-0 shadow-md bg-gray-950 min-h-[400px] flex items-center z-20">
                    {/* Cinematic Slideshow + Canvas Particle Engine + Cloud Mist */}
                    <HeroBackgroundAnimation />

                    <div className="home-content-rail relative z-10 w-full">
                        <h1 className="font-hero-title text-left text-3xl sm:text-4xl md:text-5xl lg:text-[3.75rem] font-normal text-white mb-2.5 drop-shadow-md leading-[1.25]">
                            Find your next favorite stay
                        </h1>
                        <p className="font-hero-subtitle text-left text-teal-100/90 dark:text-teal-100 text-sm sm:text-base md:text-lg mb-6 font-medium max-w-2xl leading-relaxed drop-shadow-sm">
                            Explore extraordinary villas, cozy cottages, luxury apartments, and boutique rooms.
                        </p>
                        
                        {/* Redesigned Search Bar Component */}
                        <HeroSearchBar citiesData={citiesData} />
                    </div>
                </div>

                <div className="home-content-rail space-y-14">
                    {filters.propertyType ? (
                        /* Filtered Single Property Type Category */
                        <CategoryRow
                            propertyType={filters.propertyType}
                            icons={icons}
                            onRoomClick={handleRoomClick}
                            initialRooms={homeFeed?.categories?.[filters.propertyType]}
                        />
                    ) : (
                        <>
                            {/* Explore Unique Places to Stay (Featured Section) */}
                            <ExploreUniquePlaces
                                icons={icons}
                                onRoomClick={handleRoomClick}
                                initialRooms={homeFeed?.featured}
                            />

                            {/* All Property Types Loaded Instantly via Home Feed */}
                            <div className="space-y-12">
                                {PROPERTY_TYPES.map((propertyType) => (
                                    <CategoryRow
                                        key={propertyType}
                                        propertyType={propertyType}
                                        icons={icons}
                                        onRoomClick={handleRoomClick}
                                        initialRooms={homeFeed?.categories?.[propertyType]}
                                    />
                                ))}
                            </div>
                        </>
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
                                {citiesData.map((city, idx) => (
                                    <div 
                                        key={city.name} 
                                        className={`animate-card-cascade stagger-${Math.min(idx + 1, 8)}`}
                                    >
                                        <CityCard 
                                            city={city.name}
                                            imageUrl={city.imageUrl}
                                            roomCount={city.count}
                                            onClick={() => navigate(`/cities/${encodeURIComponent(city.name)}`)}
                                        />
                                    </div>
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
