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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 cursor-pointer group" onClick={onClick}>
            <div className="relative">
                {isDashboard && !room.isActive && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">DRAFT</div>
                )}
                {showWishlistAction && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onWishlistToggle?.(room); }}
                        className={`absolute top-2 right-2 z-10 rounded-full p-2 shadow-md transition-colors ${isWishlisted ? 'bg-green-600 text-white' : 'bg-white/90 text-gray-700 hover:bg-white'}`}
                        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                        <span className="text-sm font-bold">{isWishlisted ? '♥' : '♡'}</span>
                    </button>
                )}
                {!isDashboard && (
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-full z-10">
                        {room.propertyType ? room.propertyType.charAt(0).toUpperCase() + room.propertyType.slice(1) : 'Property'}
                    </div>
                )}
                {compact && (
                    <div className="absolute bottom-2 right-2 z-10 flex items-center gap-0.5 rounded-full bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-gray-800 shadow-sm [&>svg]:h-3 [&>svg]:w-3 dark:bg-gray-900/95 dark:text-white">
                        {icons.star}
                        <span>{room.rating || 'New'}</span>
                    </div>
                )}
                <img className={`${compact ? 'h-36 sm:h-40' : 'h-56'} w-full object-cover`} src={imageUrl} srcSet={srcSet} sizes={sizes} alt={room.title}/>
            </div>
            <div className={compact ? 'flex flex-col p-2.5' : 'p-4'}>
                <h3 className={`${compact ? 'text-sm' : 'text-lg'} font-semibold text-gray-800 dark:text-gray-100 truncate`}>{room.title}</h3>
                <p className={`${compact ? 'text-[11px]' : 'text-xs sm:text-sm'} flex text-gray-600 dark:text-gray-400 mt-1 truncate`}>{icons.location} {getAddressLine(room)}</p>
                {(!compact || isDashboard) && <div className="flex items-center justify-between mt-2">
                    {!compact && <div className="flex flex-col">
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                            {icons.star}<span className="ml-1">{room.rating || 'New'}</span>
                        </div>

                    </div>}
                    {isDashboard && (
                        <div className="flex items-center space-x-3">
                            <button onClick={(e) => { e.stopPropagation(); onEdit(room); }} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center text-sm font-medium">
                                {icons.edit}<span className="ml-1">Edit</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onDelete(room); }} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center text-sm font-medium">
                                {icons.trash}<span className="ml-1">Delete</span>
                            </button>
                        </div>
                    )}
                </div>}
                <p className={`${compact ? 'mt-2 text-sm' : 'mt-2 text-lg'} font-bold text-gray-900 dark:text-white`}>
                    ₹{Math.max(1, Math.round(room.pricePerNight || 0)).toLocaleString()} <span className="text-sm font-normal text-gray-600 dark:text-gray-400">/ night</span>
                </p>
            </div>
        </div>
    );
};

// ✅ OPTIMIZATION: Memoize component to prevent re-renders when props haven't changed
export default React.memo(RoomCard, (prevProps, nextProps) => {
    // Custom comparison: return true if props are equal (don't re-render)
    return (
        prevProps.room?._id === nextProps.room?._id &&
        prevProps.isWishlisted === nextProps.isWishlisted &&
        prevProps.isDashboard === nextProps.isDashboard &&
        prevProps.compact === nextProps.compact
    );
});
