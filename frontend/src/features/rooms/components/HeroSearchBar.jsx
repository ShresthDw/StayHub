import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCheckInDate, setCheckOutDate, setFilters } from '../../../store/appSlice.js';
import { icons, PROPERTY_TYPES } from '../../../constants.jsx';

// Animated placeholder destinations
const PLACEHOLDER_TEXTS = [
    'Where to next?',
    'Try "Dehradun"...',
    'Try "Mussoorie"...',
    'Try "Rishikesh"...',
    'Try "Haldwani"...',
    'Try "Goa"...',
    'Try "Chennai"...'
];

// Popular destinations fallback
const POPULAR_DESTINATIONS = [
    { name: 'Dehradun', state: 'Uttarakhand', tag: 'Top Pick' },
    { name: 'Mussoorie', state: 'Uttarakhand', tag: 'Hill Station' },
    { name: 'Rishikesh', state: 'Uttarakhand', tag: 'Adventure' },
    { name: 'Haldwani', state: 'Uttarakhand', tag: 'Gateway' },
    { name: 'Goa', state: 'Goa', tag: 'Beach & Sun' },
    { name: 'Chennai', state: 'Tamil Nadu', tag: 'Coastal City' }
];

const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
    } catch {
        return dateString;
    }
};

const HeroSearchBar = ({ citiesData = [] }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { filters, checkInDate, checkOutDate } = useSelector((state) => state.app);

    const [searchInput, setSearchInput] = useState('');
    const [tempCheckInDate, setTempCheckInDate] = useState(checkInDate || '');
    const [tempCheckOutDate, setTempCheckOutDate] = useState(checkOutDate || '');
    const [selectedType, setSelectedType] = useState(filters.propertyType || '');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredCities, setFilteredCities] = useState([]);
    const [animatedPlaceholder, setAnimatedPlaceholder] = useState(PLACEHOLDER_TEXTS[0]);
    const [searchError, setSearchError] = useState('');
    const [activeSection, setActiveSection] = useState(null);

    const searchContainerRef = useRef(null);
    const checkInInputRef = useRef(null);
    const checkOutInputRef = useRef(null);
    const debounceTimerRef = useRef(null);

    // Sync Redux dates if they change externally
    useEffect(() => {
        if (checkInDate) setTempCheckInDate(checkInDate);
        if (checkOutDate) setTempCheckOutDate(checkOutDate);
    }, [checkInDate, checkOutDate]);

    // Animated cycling placeholder
    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % PLACEHOLDER_TEXTS.length;
            setAnimatedPlaceholder(PLACEHOLDER_TEXTS[index]);
        }, 3200);
        return () => clearInterval(interval);
    }, []);

    // Dismiss suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
                setShowSuggestions(false);
                setActiveSection(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced city search filter
    const handleCityInputChange = (value) => {
        setSearchInput(value);
        setSearchError('');

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        if (!value.trim()) {
            setFilteredCities([]);
            setShowSuggestions(true);
            return;
        }

        debounceTimerRef.current = setTimeout(() => {
            const query = value.toLowerCase().trim();
            const matched = citiesData.filter(city =>
                city.name?.toLowerCase().includes(query)
            );
            setFilteredCities(matched);
            setShowSuggestions(true);
        }, 200);
    };

    const handleSelectCity = (cityName) => {
        setSearchInput(cityName);
        setShowSuggestions(false);
        setSearchError('');
        executeSearch(cityName);
    };

    const executeSearch = (cityOverride) => {
        setSearchError('');
        const cityToSearch = cityOverride !== undefined ? cityOverride : searchInput;

        // Validate dates if set
        if (tempCheckInDate && tempCheckOutDate) {
            if (new Date(tempCheckOutDate) <= new Date(tempCheckInDate)) {
                setSearchError('Check-out date must be after check-in date.');
                return;
            }
            dispatch(setCheckInDate(tempCheckInDate));
            dispatch(setCheckOutDate(tempCheckOutDate));
        } else if (tempCheckInDate || tempCheckOutDate) {
            setSearchError('Please choose both check-in and check-out dates, or leave both empty.');
            return;
        } else {
            dispatch(setCheckInDate(''));
            dispatch(setCheckOutDate(''));
        }

        // Apply property type filter if changed
        if (selectedType !== filters.propertyType) {
            dispatch(setFilters({ ...filters, propertyType: selectedType }));
        }

        if (cityToSearch && cityToSearch.trim()) {
            navigate(`/cities/${encodeURIComponent(cityToSearch.trim())}`);
            return;
        }

        // If no city entered, take the first available city from database or popular list
        if (citiesData.length > 0) {
            navigate(`/cities/${encodeURIComponent(citiesData[0].name)}`);
            return;
        }

        setSearchError('Please select a destination city or choose a popular location.');
    };

    const todayStr = new Date().toISOString().split('T')[0];

    return (
        <div className="w-full max-w-5xl mx-auto relative z-30" ref={searchContainerRef}>
            {/* Main Search Bar Capsule (Compact Sleek Height) */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-full border border-gray-200 dark:border-gray-700 shadow-2xl p-1 sm:p-1.5 transition-all">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-0 items-center">
                    
                    {/* Segment 1: Destination (Where) */}
                    <div
                        className={`sm:col-span-4 relative rounded-xl sm:rounded-l-full sm:rounded-r-none px-3.5 py-1.5 transition-all cursor-pointer ${
                            activeSection === 'where'
                                ? 'bg-teal-50 dark:bg-teal-950/40 ring-1 ring-teal-500/40 shadow-inner'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                        }`}
                        onClick={() => {
                            setActiveSection('where');
                            setShowSuggestions(true);
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-600 dark:text-teal-300 flex items-center justify-center flex-shrink-0">
                                {icons.location || icons.mapPin}
                            </div>
                            <div className="flex-1 min-w-0">
                                <label className="block text-[9px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400 leading-none mb-0.5">
                                    Where
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="text"
                                        value={searchInput}
                                        onChange={(e) => handleCityInputChange(e.target.value)}
                                        onFocus={() => {
                                            setActiveSection('where');
                                            setShowSuggestions(true);
                                        }}
                                        placeholder={animatedPlaceholder}
                                        className="w-full bg-transparent border-none p-0 text-xs font-semibold text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-0 truncate leading-tight"
                                    />
                                    {searchInput && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSearchInput('');
                                                setFilteredCities([]);
                                            }}
                                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 text-xs ml-1"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Dropdown Suggestions Menu */}
                        {showSuggestions && (
                            <div className="absolute top-full left-0 right-0 sm:left-0 sm:w-96 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden max-h-80 overflow-y-auto animate-in fade-in-50 duration-150">
                                {searchInput.trim() ? (
                                    /* Search Match Results */
                                    <div>
                                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/60 border-b border-gray-100 dark:border-gray-700 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Matching Destinations
                                        </div>
                                        {filteredCities.length > 0 ? (
                                            filteredCities.map((city) => (
                                                <button
                                                    key={city.name}
                                                    type="button"
                                                    onClick={() => handleSelectCity(city.name)}
                                                    className="w-full px-4 py-2.5 text-left hover:bg-teal-50 dark:hover:bg-gray-700/60 border-b last:border-b-0 border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="p-1 rounded bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                        </span>
                                                        <div>
                                                            <div className="text-xs font-bold text-gray-900 dark:text-gray-100">
                                                                {city.name}
                                                            </div>
                                                            <div className="text-[11px] text-gray-400">
                                                                {city.state || 'Verified City'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {city.count !== undefined && (
                                                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
                                                            {city.count} {city.count === 1 ? 'stay' : 'stays'}
                                                        </span>
                                                    )}
                                                </button>
                                            ))
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleSelectCity(searchInput.trim())}
                                                className="w-full p-3.5 text-left hover:bg-teal-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                                            >
                                                <span className="text-teal-600 dark:text-teal-400">{icons.search}</span>
                                                <div>
                                                    <div className="text-xs font-bold text-teal-600 dark:text-teal-400">
                                                        Search stays in &quot;{searchInput}&quot;
                                                    </div>
                                                    <div className="text-[11px] text-gray-400">Explore matching accommodations</div>
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    /* Popular Destinations Header & List */
                                    <div>
                                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/60 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                                                Popular Destinations
                                            </span>
                                            <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400">
                                                Quick pick
                                            </span>
                                        </div>
                                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {(citiesData.length > 0 ? citiesData.slice(0, 6) : POPULAR_DESTINATIONS).map((city) => (
                                                <button
                                                    key={city.name}
                                                    type="button"
                                                    onClick={() => handleSelectCity(city.name)}
                                                    className="w-full px-4 py-2 text-left hover:bg-teal-50 dark:hover:bg-gray-700/60 flex items-center justify-between transition-colors group"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                        </span>
                                                        <div>
                                                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                                                {city.name}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 block">
                                                                {city.state || city.tag || 'Popular Destination'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform">
                                                        Explore →
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Segment 2 & 3: Check-in & Check-out Dates */}
                    <div className="sm:col-span-3 sm:border-l border-gray-200 dark:border-gray-700/80 grid grid-cols-2 gap-1 px-1.5 py-0.5">
                        {/* Check-in */}
                        <div
                            className={`rounded-xl px-2 py-1 transition-all cursor-pointer relative overflow-hidden group ${
                                activeSection === 'checkin'
                                    ? 'bg-teal-50 dark:bg-teal-950/40 ring-1 ring-teal-500/40 shadow-inner'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                            }`}
                            onClick={() => setActiveSection('checkin')}
                        >
                            <label className="block text-[9px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 leading-none mb-0.5 pointer-events-none">
                                Check in
                            </label>
                            <div className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate pointer-events-none">
                                {tempCheckInDate ? formatDateDisplay(tempCheckInDate) : <span className="text-gray-400 font-normal">Add date</span>}
                            </div>
                            <input
                                ref={checkInInputRef}
                                type="date"
                                min={todayStr}
                                value={tempCheckInDate}
                                onChange={(e) => {
                                    setTempCheckInDate(e.target.value);
                                    if (tempCheckOutDate && new Date(tempCheckOutDate) <= new Date(e.target.value)) {
                                        setTempCheckOutDate('');
                                    }
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                title="Select check-in date"
                            />
                            {tempCheckInDate && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        setTempCheckInDate('');
                                    }}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 z-20 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs p-0.5"
                                    title="Clear date"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Check-out */}
                        <div
                            className={`rounded-xl px-2 py-1 transition-all cursor-pointer relative overflow-hidden group ${
                                activeSection === 'checkout'
                                    ? 'bg-teal-50 dark:bg-teal-950/40 ring-1 ring-teal-500/40 shadow-inner'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                            }`}
                            onClick={() => setActiveSection('checkout')}
                        >
                            <label className="block text-[9px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 leading-none mb-0.5 pointer-events-none">
                                Check out
                            </label>
                            <div className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate pointer-events-none">
                                {tempCheckOutDate ? formatDateDisplay(tempCheckOutDate) : <span className="text-gray-400 font-normal">Add date</span>}
                            </div>
                            <input
                                ref={checkOutInputRef}
                                type="date"
                                min={tempCheckInDate || todayStr}
                                value={tempCheckOutDate}
                                onChange={(e) => setTempCheckOutDate(e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                title="Select check-out date"
                            />
                            {tempCheckOutDate && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        setTempCheckOutDate('');
                                    }}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 z-20 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs p-0.5"
                                    title="Clear date"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Segment 4: Property Type / Category Selector */}
                    <div className="sm:col-span-2 sm:border-l border-gray-200 dark:border-gray-700/80 px-2.5 py-1 relative">
                        <label className="block text-[9px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 leading-none mb-0.5">
                            Stay Type
                        </label>
                        <div className="relative">
                            <select
                                value={selectedType}
                                onChange={(e) => {
                                    setSelectedType(e.target.value);
                                    dispatch(setFilters({ ...filters, propertyType: e.target.value }));
                                }}
                                className="w-full bg-transparent border-none p-0 pr-4 text-xs font-bold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0 cursor-pointer capitalize appearance-none leading-tight"
                            >
                                <option value="" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">All Stays</option>
                                {PROPERTY_TYPES.map((type) => (
                                    <option key={type} value={type} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white capitalize">
                                        {type}s
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Segment 5: Search Button */}
                    <div className="sm:col-span-3 flex justify-end pl-1.5">
                        <button
                            type="button"
                            onClick={() => executeSearch()}
                            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-xs sm:text-sm rounded-xl sm:rounded-full shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5 group"
                        >
                            <span className="group-hover:rotate-12 transition-transform duration-200">
                                {icons.search}
                            </span>
                            <span>Search</span>
                        </button>
                    </div>

                </div>
            </div>

            {/* Error Message Toast / Alert */}
            {searchError && (
                <div className="mt-3 p-3 bg-red-600 text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in duration-200">
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{searchError}</span>
                    </span>
                    <button
                        type="button"
                        onClick={() => setSearchError('')}
                        className="text-white hover:text-red-200 text-sm font-bold ml-2"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Trending Destinations Quick Chips */}
            <div className="mt-3.5 flex items-center gap-2 text-xs flex-wrap">
                <span className="text-white font-bold flex items-center gap-1.5 drop-shadow-sm">
                    <svg className="w-3.5 h-3.5 text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="hidden sm:inline">Popular:</span>
                </span>
                {(citiesData.length > 0 ? citiesData.slice(0, 5) : POPULAR_DESTINATIONS.slice(0, 5)).map((city) => (
                    <button
                        key={city.name}
                        type="button"
                        onClick={() => handleSelectCity(city.name)}
                        className="px-3.5 py-1.5 rounded-full bg-white text-gray-800 hover:bg-teal-50 hover:text-teal-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 text-xs font-bold border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
                    >
                        {city.name}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default HeroSearchBar;
