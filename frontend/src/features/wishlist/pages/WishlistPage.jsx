import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Toast from '../../../components/Toast.jsx';
import BackButton from '../../../components/BackButton.jsx';
import { setCurrentUser } from '../../../store/appSlice.js';
import { useGetWishlistQuery, useToggleWishlistMutation } from '../services/wishlistService.js';
import { PageSkeleton } from '../../../components/Skeletons.jsx';
import { getRoomCardThumbnail } from '../../../utils/imageKitOptimizer.js';

const getAddressLine = (room) => {
    const parts = [room?.address?.street, room?.address?.city, room?.address?.state]
        .filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
    if (typeof room?.location === 'string' && room.location.trim()) return room.location;
    return 'Location not provided';
};

const WishlistPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { currentUser } = useSelector((state) => state.app);

    // RTK Query hooks
    const { data: wishlistData, isLoading, error, refetch } = useGetWishlistQuery();
    const [toggleWishlistMutation] = useToggleWishlistMutation();

    const wishlist = wishlistData?.wishlist || [];
    const wishlistedIds = useMemo(() => new Set((currentUser?.wishlist || []).map(String)), [currentUser?.wishlist]);
    
    const message = error?.data?.msg || (error ? 'Unable to load wishlist.' : '');
    const msgType = error ? 'error' : 'success';

    const handleToggleWishlist = async (room) => {
        try {
            const response = await toggleWishlistMutation(room._id).unwrap();
            if (response.user) {
                dispatch(setCurrentUser(response.user));
            }
            refetch();
        } catch (err) {
            console.error('Wishlist toggle error:', err);
        }
    };

    const handleRoomClick = (room) => navigate(`/rooms/${room._id}`);

    return (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-12 min-h-screen">
            <BackButton fallback="/" className="mb-2" />
            
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-200 dark:border-gray-800">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                        Wishlist
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {wishlist.length} saved stay{wishlist.length !== 1 ? 's' : ''} for your upcoming trips.
                    </p>
                </div>
            </div>

            {message && <div className="mb-5"><Toast message={message} type={msgType} /></div>}

            {isLoading ? (
                <PageSkeleton />
            ) : wishlist.length > 0 ? (
                /* Compact Horizontal List Rows Matching Screenshot */
                <div className="space-y-3">
                    {wishlist.map((room, idx) => {
                        const rawImageUrl = Array.isArray(room.images) && room.images.length > 0 
                            ? (typeof room.images[0] === 'string' ? room.images[0] : room.images[0]?.url)
                            : 'https://placehold.co/600x400?text=No+Image';
                        const imageUrl = getRoomCardThumbnail(rawImageUrl);
                        const isWishlisted = wishlistedIds.has(String(room._id));

                        return (
                            <div
                                key={room._id}
                                onClick={() => handleRoomClick(room)}
                                className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200/80 dark:border-gray-700/80 overflow-hidden shadow-xs hover:shadow-sm transition-all flex items-center p-3 sm:p-3.5 gap-3.5 group cursor-pointer animate-card-cascade stagger-${Math.min(idx + 1, 8)}`}
                            >
                                {/* Thumbnail with Heart Button */}
                                <div className="relative w-24 h-20 sm:w-28 sm:h-22 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-750 shrink-0">
                                    <img
                                        src={imageUrl}
                                        alt={room.title}
                                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-200"
                                        loading="lazy"
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleWishlist(room);
                                        }}
                                        className={`absolute top-1.5 right-1.5 rounded-md w-6 h-6 flex items-center justify-center shadow-xs transition-transform active:scale-90 ${
                                            isWishlisted
                                                ? 'bg-rose-500 text-white'
                                                : 'bg-white/90 text-gray-700 hover:bg-white dark:bg-gray-800/90 dark:text-gray-200'
                                        }`}
                                        aria-label="Toggle wishlist"
                                    >
                                        {isWishlisted ? (
                                            <svg className="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24">
                                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                {/* Content Box */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                    {/* Top Line: Category Badge + Location + Star Rating */}
                                    <div className="flex items-center justify-between gap-1.5">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            {room.propertyType && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 shrink-0">
                                                    {room.propertyType}
                                                </span>
                                            )}
                                            <p className="text-xs text-gray-400 dark:text-gray-400 truncate flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span>{getAddressLine(room)}</span>
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1 text-xs font-bold text-gray-800 dark:text-gray-200 shrink-0">
                                            <svg className="w-3.5 h-3.5 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            <span>{room.rating || room.ratingAverage || '4.9'}</span>
                                        </div>
                                    </div>

                                    {/* Middle Line: Title */}
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mt-1">
                                        {room.title}
                                    </h3>

                                    {/* Bottom Line: Price & View Action */}
                                    <div className="mt-2 flex items-center justify-between gap-2">
                                        <div>
                                            <span className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-gray-100">
                                                ₹{Math.max(1, Math.round(room.pricePerNight || 0)).toLocaleString()}
                                            </span>
                                            <span className="text-xs text-gray-400 font-normal"> / nt</span>
                                        </div>

                                        <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-0.5">
                                            View Stay →
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-16 px-4 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-850/40 text-center max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 fill-rose-500" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Your wishlist is empty</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Explore properties and click the heart icon to save your favorites.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="mt-4 px-4 py-2 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition"
                    >
                        Explore Stays
                    </button>
                </div>
            )}
        </main>
    );
};

export default WishlistPage;
