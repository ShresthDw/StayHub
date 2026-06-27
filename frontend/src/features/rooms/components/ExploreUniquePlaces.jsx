import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useGetPublicRoomsQuery } from '../../../api/apiSlice.js';
import RoomCard from '../../../components/RoomCard.jsx';

const ExploreUniquePlaces = ({ icons, onRoomClick }) => {
    const { filters, checkInDate, checkOutDate, searchLocation } = useSelector((state) => state.app);
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const { data, isLoading } = useGetPublicRoomsQuery({
        filters,
        searchLocation,
        checkInDate,
        checkOutDate,
        page: 1
    });

    const rooms = data?.rooms || [];

    const updateScrollControls = useCallback(() => {
        const section = scrollRef.current;
        if (!section) return;
        setCanScrollLeft(section.scrollLeft > 4);
        setCanScrollRight(section.scrollLeft + section.clientWidth < section.scrollWidth - 4);
    }, []);

    const handleHorizontalScroll = (direction) => {
        const section = scrollRef.current;
        if (!section) return;
        const amount = Math.max(280, Math.round(section.clientWidth * 0.8));
        section.scrollBy({ left: direction * amount, behavior: 'smooth' });
        window.setTimeout(updateScrollControls, 250);
    };

    useEffect(() => {
        const section = scrollRef.current;
        if (!section) return;
        const handleScroll = () => updateScrollControls();
        section.addEventListener('scroll', handleScroll, { passive: true });
        updateScrollControls();
        return () => section.removeEventListener('scroll', handleScroll);
    }, [updateScrollControls]);

    useEffect(() => {
        updateScrollControls();
    }, [rooms, updateScrollControls]);

    if (isLoading && rooms.length === 0) {
        return (
            <div>
                <div className="flex items-center justify-between mb-1">
                    <div className="h-7 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                </div>
                <div className="h-4 w-72 bg-gray-200/60 dark:bg-gray-800 rounded-md animate-pulse mb-5 mt-1" />
                <div className="flex gap-5 overflow-hidden pb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="w-56 bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden flex-shrink-0 animate-pulse border border-gray-100 dark:border-gray-700/60">
                            <div className="h-36 sm:h-40 w-full bg-gray-200 dark:bg-gray-700" />
                            <div className="p-2.5 space-y-2">
                                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                                <div className="h-3 w-1/2 bg-gray-100 dark:bg-gray-700/60 rounded" />
                                <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded mt-1" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (rooms.length === 0) return null;

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                    Explore unique places to stay
                </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                Handpicked properties from around the world
            </p>

            <div className="relative min-w-0">
                {/* Left Chevron */}
                <button
                    type="button"
                    onClick={() => handleHorizontalScroll(-1)}
                    className={`absolute left-2 top-1/3 -translate-y-1/2 z-10 rounded-full bg-white/95 dark:bg-gray-800/95 shadow-md border border-gray-200 dark:border-gray-700 p-2 text-gray-700 dark:text-gray-200 transition-opacity hover:bg-white dark:hover:bg-gray-800 ${
                        canScrollLeft ? 'opacity-100 cursor-pointer' : 'opacity-40 cursor-default pointer-events-none'
                    }`}
                    aria-label="Scroll left"
                    disabled={!canScrollLeft}
                >
                    {icons.chevronLeft}
                </button>

                {/* Horizontal scroll container */}
                <div
                    ref={scrollRef}
                    className="flex w-full min-w-0 gap-5 overflow-x-auto pb-4 no-scrollbar scroll-smooth snap-x"
                >
                    {rooms.map((room, idx) => (
                        <div key={room._id} className={`w-56 flex-shrink-0 snap-start animate-card-cascade stagger-${Math.min(idx + 1, 8)}`}>
                            <RoomCard room={room} icons={icons} compact onClick={() => onRoomClick?.(room)} />
                        </div>
                    ))}
                </div>

                {/* Right Chevron */}
                <button
                    type="button"
                    onClick={() => handleHorizontalScroll(1)}
                    className={`absolute right-2 top-1/3 -translate-y-1/2 z-10 rounded-full bg-white/95 dark:bg-gray-800/95 shadow-md border border-gray-200 dark:border-gray-700 p-2 text-gray-700 dark:text-gray-200 transition-opacity hover:bg-white dark:hover:bg-gray-800 ${
                        canScrollRight ? 'opacity-100 cursor-pointer' : 'opacity-40 cursor-default pointer-events-none'
                    }`}
                    aria-label="Scroll right"
                    disabled={!canScrollRight}
                >
                    {icons.chevronRight}
                </button>
            </div>
        </div>
    );
};

export default React.memo(ExploreUniquePlaces);
