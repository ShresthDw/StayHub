import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCheckInDate, setCheckOutDate } from '../../../store/appSlice.js';
import { icons } from '../../../constants.jsx';

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
    const { checkInDate, checkOutDate } = useSelector((state) => state.app);

    const [searchInput, setSearchInput] = useState('');
    const [tempCheckInDate, setTempCheckInDate] = useState(checkInDate || '');
    const [tempCheckOutDate, setTempCheckOutDate] = useState(checkOutDate || '');
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

    // Helper to immediately pop up browser calendar
    const openDatePicker = (inputRef) => {
        if (!inputRef?.current) return;
        try {
            if (typeof inputRef.current.showPicker === 'function') {
                inputRef.current.showPicker();
            } else {
                inputRef.current.focus();
            }
        } catch {
            inputRef.current?.focus();
        }
    };

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
            {/* Main Search Bar Capsule */}
            <div className="bg-white rounded-2xl sm:rounded-full border border-gray-200 shadow-2xl p-1.5 sm:p-2">
                <div className="flex flex-wrap sm:flex-nowrap items-center w-full">

                    {/* TOP ROW (Mobile) / MIDDLE-LEFT (Desktop): Check-in */}
                    <div
                        className={`order-1 sm:order-2 w-1/2 sm:w-32 md:w-36 flex-shrink-0 sm:border-l border-gray-300 rounded-l-xl rounded-r-none sm:rounded-xl px-3 py-1.5 transition-all cursor-pointer relative overflow-hidden group ${
                            activeSection === 'checkin'
                                ? 'bg-teal-50 ring-1 ring-teal-500/40 shadow-inner'
                                : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                            setActiveSection('checkin');
                            openDatePicker(checkInInputRef);
                        }}
                    >
                        <label className="block text-[9px] font-extrabold uppercase tracking-wider text-gray-500 leading-none mb-0.5 pointer-events-none">
                            Check in
                        </label>
                        <div className="text-xs font-bold text-gray-900 truncate pointer-events-none">
                            {tempCheckInDate ? formatDateDisplay(tempCheckInDate) : <span className="text-gray-400 font-normal">Add date</span>}
                        </div>
                        <input
                            ref={checkInInputRef}
                            type="date"
                            min={todayStr}
                            value={tempCheckInDate}
                            onClick={(e) => {
                                try { e.target.showPicker?.(); } catch {}
                            }}
                            onFocus={(e) => {
                                try { e.target.showPicker?.(); } catch {}
                            }}
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
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 text-gray-400 hover:text-gray-600 text-xs p-0.5"
                                title="Clear date"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* TOP ROW (Mobile) / MIDDLE-RIGHT (Desktop): Check-out */}
                    <div
                        className={`order-2 sm:order-3 w-1/2 sm:w-32 md:w-36 flex-shrink-0 border-l border-gray-300 rounded-r-xl rounded-l-none sm:rounded-xl px-3 py-1.5 transition-all cursor-pointer relative overflow-hidden group ${
                            activeSection === 'checkout'
                                ? 'bg-teal-50 ring-1 ring-teal-500/40 shadow-inner'
                                : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                            setActiveSection('checkout');
                            openDatePicker(checkOutInputRef);
                        }}
                    >
                        <label className="block text-[9px] font-extrabold uppercase tracking-wider text-gray-500 leading-none mb-0.5 pointer-events-none">
                            Check out
                        </label>
                        <div className="text-xs font-bold text-gray-900 truncate pointer-events-none">
                            {tempCheckOutDate ? formatDateDisplay(tempCheckOutDate) : <span className="text-gray-400 font-normal">Add date</span>}
                        </div>
                        <input
                            ref={checkOutInputRef}
                            type="date"
                            min={tempCheckInDate || todayStr}
                            value={tempCheckOutDate}
                            onClick={(e) => {
                                try { e.target.showPicker?.(); } catch {}
                            }}
                            onFocus={(e) => {
                                try { e.target.showPicker?.(); } catch {}
                            }}
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
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 text-gray-400 hover:text-gray-600 text-xs p-0.5"
                                title="Clear date"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* HORIZONTAL DIVIDER on Mobile separating Dates from Destination */}
                    <div className="order-3 w-full border-t border-gray-200 sm:hidden my-1" />

                    {/* BOTTOM-LEFT (Mobile) / LEFTMOST (Desktop): Where Input */}
                    <div
                        className={`order-4 sm:order-1 flex-1 min-w-0 relative rounded-xl sm:rounded-l-full sm:rounded-r-none px-2.5 sm:px-4 py-1.5 sm:py-2 transition-all cursor-pointer ${
                            activeSection === 'where'
                                ? 'bg-teal-50 ring-1 ring-teal-500/40 shadow-inner'
                                : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                            setActiveSection('where');
                            setShowSuggestions(true);
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0">
                                {icons.location || icons.mapPin}
                            </div>
                            <div className="flex-1 min-w-0">
                                <label className="block text-[9px] font-extrabold uppercase tracking-wider text-teal-700 leading-none mb-0.5">
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
                                        className="w-full bg-transparent border-none p-0 text-xs sm:text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 truncate leading-tight"
                                    />
                                    {searchInput && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSearchInput('');
                                                setFilteredCities([]);
                                            }}
                                            className="text-gray-400 hover:text-gray-600 p-0.5 text-xs ml-1 flex-shrink-0"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Dropdown Suggestions Menu */}
                        {showSuggestions && (
                            <div className="absolute top-full left-0 w-full sm:w-96 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden max-h-80 overflow-y-auto animate-in fade-in-50 duration-150">
                                {searchInput.trim() ? (
                                    /* Search Match Results */
                                    <div>
                                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                            Matching Destinations
                                        </div>
                                        {filteredCities.length > 0 ? (
                                             filteredCities.map((city) => (
                                                <button
                                                    key={city.name}
                                                    type="button"
                                                    onClick={() => handleSelectCity(city.name)}
                                                    className="w-full px-4 py-2.5 text-left hover:bg-teal-50 border-b last:border-b-0 border-gray-100 flex items-center justify-between transition-colors"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="p-1 rounded bg-teal-50 text-teal-600">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                        </span>
                                                        <div>
                                                            <div className="text-xs font-bold text-gray-900">
                                                                {city.name}
                                                            </div>
                                                            <div className="text-[11px] text-gray-400">
                                                                {city.state || 'Verified City'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {city.count !== undefined && (
                                                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                                                            {city.count} {city.count === 1 ? 'stay' : 'stays'}
                                                        </span>
                                                    )}
                                                </button>
                                            ))
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleSelectCity(searchInput.trim())}
                                                className="w-full p-3.5 text-left hover:bg-teal-50 transition-colors flex items-center gap-2"
                                            >
                                                <span className="text-teal-600">{icons.search}</span>
                                                <div>
                                                    <div className="text-xs font-bold text-teal-600">
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
                                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-900">
                                                Popular Destinations
                                            </span>
                                            <span className="text-[10px] font-semibold text-teal-600">
                                                Quick pick
                                            </span>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {(citiesData.length > 0 ? citiesData.slice(0, 6) : POPULAR_DESTINATIONS).map((city) => (
                                                <button
                                                    key={city.name}
                                                    type="button"
                                                    onClick={() => handleSelectCity(city.name)}
                                                    className="w-full px-4 py-2 text-left hover:bg-teal-50 flex items-center justify-between transition-colors group"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                         <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                                                             <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                             </svg>
                                                         </span>
                                                         <div>
                                                             <span className="text-xs font-bold text-gray-800 block group-hover:text-teal-600 transition-colors">
                                                                 {city.name}
                                                             </span>
                                                             <span className="text-[10px] text-gray-400 block">
                                                                 {city.state || city.tag || 'Popular Destination'}
                                                             </span>
                                                         </div>
                                                     </div>
                                                     <span className="text-xs font-semibold text-teal-600 group-hover:translate-x-0.5 transition-transform">
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

                    {/* SEARCH BUTTON: Bottom-Right on Mobile beside Where (order-5), Far-Right on Desktop (sm:order-4) */}
                    <div className="order-5 sm:order-4 flex-shrink-0 pl-2 pr-0.5 sm:pr-0">
                        <button
                            type="button"
                            onClick={() => executeSearch()}
                            className="w-10 h-10 sm:w-auto sm:h-11 sm:px-6 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-xs sm:text-sm rounded-full shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all inline-flex items-center justify-center gap-2 group flex-shrink-0"
                            title="Search stays"
                            aria-label="Search"
                        >
                            <span className="group-hover:rotate-12 transition-transform duration-200 flex items-center justify-center flex-shrink-0">
                                {icons.search}
                            </span>
                            <span className="hidden sm:inline font-bold tracking-wide">Search</span>
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
            <div className="mt-3 flex items-center gap-2 text-xs flex-wrap">
                <span className="text-white/90 font-semibold flex items-center gap-1.5 drop-shadow-sm">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="hidden sm:inline">Popular:</span>
                </span>
                {(citiesData.length > 0 ? citiesData.slice(0, 5) : POPULAR_DESTINATIONS.slice(0, 5)).map((city) => (
                    <button
                        key={city.name}
                        type="button"
                        onClick={() => handleSelectCity(city.name)}
                        className="h-7 px-3 rounded-full bg-black/30 hover:bg-black/50 text-white/90 hover:text-white backdrop-blur-md text-xs font-medium border border-white/20 hover:border-white/40 shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 inline-flex items-center justify-center"
                    >
                        {city.name}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default HeroSearchBar;
