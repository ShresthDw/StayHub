import React from 'react';
import { getRoomCardThumbnail, getRoomCardSrcSet, getRoomCardSizes } from '../utils/imageKitOptimizer.js';

const RoomCard = ({ room, icons, isDashboard = false, compact = false, onEdit, onDelete, onClick, showWishlistAction = false, isWishlisted = false, onWishlistToggle }) => {
    const rawImageUrl = Array.isArray(room.images) && room.images.length > 0
        ? (room.images[0]?.url || room.images[0])
        : 'https://placehold.co/600x400?text=No+Image';
    const imageUrl = getRoomCardThumbnail(rawImageUrl);
    const srcSet = getRoomCardSrcSet(rawImageUrl);
    const sizes = getRoomCardSizes();

    const displayLocation = room.address?.city || (typeof room.location === 'string' ? room.location : 'Location not specified');

    const getAddressLine = (room) => {
        const parts = [room?.address?.street, room?.address?.city, room?.address?.state, room?.address?.country]
            .filter(Boolean);
        if (parts.length > 0) return parts.join(', ');
        if (typeof room?.location === 'string' && room.location.trim()) return room.location;
        if (room?.address?.formatted) return room.address.formatted;
        return 'Location not provided';
    };

    return (
        <div className="cursor-pointer group flex flex-col" onClick={onClick}>
            <div className="relative overflow-hidden bg-gray-100 dark:bg-gray-750 rounded-none">
                {isDashboard && !room.isActive && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded z-10">DRAFT</div>
                )}
                {showWishlistAction && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onWishlistToggle?.(room); }}
                        className={`absolute top-2 right-2 z-10 p-1.5 rounded-md shadow-md transition-colors ${isWishlisted ? 'bg-teal-600 text-white' : 'bg-white/90 text-gray-700 hover:bg-white'}`}
                        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                        {isWishlisted ? (
                            <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        )}
                    </button>
                )}
                {!isDashboard && (
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded z-10">
                        {room.propertyType ? room.propertyType.charAt(0).toUpperCase() + room.propertyType.slice(1) : 'Property'}
                    </div>
                )}
                {compact && (
                    <div className="absolute bottom-2 right-2 z-10 flex items-center gap-0.5 bg-white/95 px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-800 shadow-sm [&>svg]:h-3 [&>svg]:w-3 dark:bg-gray-850 dark:text-gray-100 dark:border dark:border-white/10">
                        {icons.star}
                        <span>{room.rating || 'New'}</span>
                    </div>
                )}
                <img
                    className={`${compact ? 'h-36 sm:h-40' : 'h-56'} w-full object-cover rounded-none group-hover:scale-105 transition-transform duration-300`}
                    src={imageUrl}
                    srcSet={srcSet}
                    sizes={sizes}
                    alt={room.title}
                    loading="lazy"
                    decoding="async"
                />
            </div>
            <div className={compact ? 'flex flex-col pt-2.5 pb-1 px-0' : 'flex flex-col pt-3 pb-1 px-0'}>
                <h3 className={`${compact ? 'text-sm' : 'text-base sm:text-lg'} font-semibold text-gray-900 dark:text-gray-100 truncate`}>{room.title}</h3>
                <div className={`flex items-center gap-1 text-gray-500 dark:text-gray-400 mt-1 min-w-0 ${compact ? 'text-[11px]' : 'text-xs sm:text-sm'}`}>
                    <svg className="w-3.5 h-3.5 shrink-0 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="truncate">{getAddressLine(room)}</span>
                </div>
                {(!compact || isDashboard) && <div className="flex items-center justify-between mt-1.5">
                    {!compact && <div className="flex flex-col">
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-200">
                            {icons.star}<span className="ml-1">{room.rating || 'New'}</span>
                        </div>
                    </div>}
                    {isDashboard && (
                        <div className="flex items-center space-x-3">
                            <button onClick={(e) => { e.stopPropagation(); onEdit(room); }} className="text-indigo-600 dark:text-teal-300 hover:text-indigo-800 dark:hover:text-teal-200 flex items-center text-sm font-medium">
                                {icons.edit}<span className="ml-1">Edit</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onDelete(room); }} className="text-red-500 dark:text-rose-400 hover:text-red-700 dark:hover:text-rose-300 flex items-center text-sm font-medium">
                                {icons.trash}<span className="ml-1">Delete</span>
                            </button>
                        </div>
                    )}
                </div>}
                <p className={`${compact ? 'mt-1.5 text-sm' : 'mt-2 text-base sm:text-lg'} font-bold text-gray-900 dark:text-white`}>
                    ₹{Math.max(1, Math.round(room.pricePerNight || 0)).toLocaleString()} <span className="text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400">/ night</span>
                </p>
            </div>
        </div>
    );
};

// OPTIMIZATION: Memoize component to prevent re-renders when props haven't changed
export default React.memo(RoomCard, (prevProps, nextProps) => {
    // Custom comparison: return true if props are equal (don't re-render)
    return (
        prevProps.room?._id === nextProps.room?._id &&
        prevProps.isWishlisted === nextProps.isWishlisted &&
        prevProps.isDashboard === nextProps.isDashboard &&
        prevProps.compact === nextProps.compact
    );
});
