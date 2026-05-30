import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetPublicRoomsByTypeQuery } from '../../../api/apiSlice.js';
import { incrementCategoryPage, setCategoryHasMore } from '../../../store/roomsSlice.js';
import RoomCard from '../../../components/RoomCard.jsx';

const CategoryRow = ({ propertyType, icons, onRoomClick }) => {
    const dispatch = useDispatch();
    const { categoryPagination } = useSelector((state) => state.rooms);
    const { filters, checkInDate, checkOutDate, searchLocation } = useSelector((state) => state.app);
    
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const page = categoryPagination[propertyType]?.page || 1;
    const { data, isFetching, isLoading } = useGetPublicRoomsByTypeQuery({
        propertyType,
        filters,
        searchLocation,
        checkInDate,
        checkOutDate,
        page
    });

    const rooms = data?.rooms || [];

    useEffect(() => {
        if (data?.pagination) {
            dispatch(setCategoryHasMore({
                category: propertyType,
                hasMore: data.pagination.page < data.pagination.pages
            }));
        }
    }, [data, propertyType, dispatch]);

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

        const handleScroll = () => {
            updateScrollControls();
            const { scrollLeft, scrollWidth, clientWidth } = section;
            const distanceFromEnd = scrollWidth - (scrollLeft + clientWidth);
            const catPagination = categoryPagination[propertyType];
            if (distanceFromEnd < 200 && catPagination?.hasMore && !isFetching) {
                dispatch(incrementCategoryPage(propertyType));
            }
        };

        section.addEventListener('scroll', handleScroll, { passive: true });
        updateScrollControls();

        return () => section.removeEventListener('scroll', handleScroll);
    }, [categoryPagination, propertyType, isFetching, dispatch, updateScrollControls]);

    useEffect(() => {
        updateScrollControls();
    }, [rooms, updateScrollControls]);

    if (isLoading && rooms.length === 0) {
        return (
            <div className="space-y-3 py-2">
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="flex gap-5 overflow-hidden">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="w-56 h-64 bg-gray-200/70 dark:bg-gray-800/70 rounded-xl animate-pulse flex-shrink-0" />
                    ))}
                </div>
            </div>
        );
    }

    if (rooms.length === 0) return null;

    return (
        <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 capitalize">
                {propertyType}s
            </h3>
            <div className="relative min-w-0">
                {/* Left Chevron */}
                <button
                    type="button"
                    onClick={() => handleHorizontalScroll(-1)}
                    className={`absolute left-2 top-1/3 -translate-y-1/2 z-10 rounded-full bg-white/95 dark:bg-gray-800/95 shadow-md border border-gray-200 dark:border-gray-700 p-2 text-gray-700 dark:text-gray-200 transition-opacity hover:bg-white dark:hover:bg-gray-800 ${
                        canScrollLeft ? 'opacity-100 cursor-pointer' : 'opacity-40 cursor-default pointer-events-none'
                    }`}
                    aria-label={`Scroll ${propertyType} left`}
                    disabled={!canScrollLeft}
                >
                    {icons.chevronLeft}
                </button>

                {/* Horizontal scroll container */}
                <div
                    ref={scrollRef}
                    className="flex w-full min-w-0 gap-5 overflow-x-auto pb-4 no-scrollbar scroll-smooth snap-x"
                >
                    {rooms.map((room) => (
                        <div key={room._id} className="w-56 flex-shrink-0 snap-start">
                            <RoomCard room={room} icons={icons} compact onClick={() => onRoomClick?.(room)} />
                        </div>
                    ))}

                    {/* Loading indicator */}
                    {isFetching && (
                        <div className="w-56 flex-shrink-0 flex items-center justify-center py-12">
                            <div className="text-center space-y-3">
                                <div className="flex justify-center">
                                    <div className="relative w-10 h-10">
                                        <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-full opacity-25 animate-pulse" />
                                        <div className="absolute inset-0 border-4 border-transparent border-t-teal-600 border-r-teal-600 rounded-full animate-spin" />
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
                    onClick={() => handleHorizontalScroll(1)}
                    className={`absolute right-2 top-1/3 -translate-y-1/2 z-10 rounded-full bg-white/95 dark:bg-gray-800/95 shadow-md border border-gray-200 dark:border-gray-700 p-2 text-gray-700 dark:text-gray-200 transition-opacity hover:bg-white dark:hover:bg-gray-800 ${
                        canScrollRight ? 'opacity-100 cursor-pointer' : 'opacity-40 cursor-default pointer-events-none'
                    }`}
                    aria-label={`Scroll ${propertyType} right`}
                    disabled={!canScrollRight}
                >
                    {icons.chevronRight}
                </button>
            </div>
        </div>
    );
};

export default React.memo(CategoryRow);
