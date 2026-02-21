import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import RoomCard from '../../../components/RoomCard.jsx';
import Toast from '../../../components/Toast.jsx';
import { icons } from '../../../constants.jsx';
import { setCurrentUser } from '../../../store/appSlice.js';
import { useGetWishlistQuery, useToggleWishlistMutation } from '../services/wishlistService.js';
import { PageSkeleton } from '../../../components/Skeletons.jsx';

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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Wishlist</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Rooms you saved for later.</p>
                </div>
            </div>

            {message && <div className="mb-6"><Toast message={message} type={msgType} /></div>}

            {isLoading ? (
                <PageSkeleton />
            ) : wishlist.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {wishlist.map((room) => (
                        <RoomCard
                            key={room._id}
                            room={room}
                            icons={icons}
                            onClick={() => handleRoomClick(room)}
                            showWishlistAction={true}
                            isWishlisted={wishlistedIds.has(String(room._id))}
                            onWishlistToggle={handleToggleWishlist}
                        />
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center text-gray-500 dark:text-gray-400">
                    Your wishlist is empty.
                </div>
            )}
        </main>
    );
};

export default WishlistPage;
