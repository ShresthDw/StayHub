// RTK Query hooks for wishlist
import { API_BASE_URL } from '../../../constants.jsx';

export {
    useGetWishlistQuery,
    useToggleWishlistMutation
} from '../../../api/apiSlice.js';

// Direct async function for use in event handlers
export const toggleWishlist = async (roomId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/wishlist/${roomId}`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': localStorage.getItem('userId') || ''
            }
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.msg || 'Failed to toggle wishlist');
        }
        return await response.json();
    } catch (err) {
        console.error('Toggle wishlist error:', err);
        throw err;
    }
};
