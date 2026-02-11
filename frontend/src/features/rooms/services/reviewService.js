// RTK Query hooks for reviews
import { API_BASE_URL } from '../../../constants.jsx';

export {
    useSubmitReviewMutation,
    useCheckUserReviewStatusQuery
} from '../../../api/apiSlice.js';

// Direct async functions for use in event handlers
export const submitReview = async (roomId, reviewData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': localStorage.getItem('userId') || ''
            },
            body: JSON.stringify(reviewData)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.msg || 'Failed to submit review');
        }
        return await response.json();
    } catch (err) {
        console.error('Submit review error:', err);
        throw err;
    }
};

export const checkUserReviewStatus = async (roomId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/review-status`, {
            headers: {
                'x-user-id': localStorage.getItem('userId') || ''
            }
        });
        if (!response.ok) throw new Error('Failed to check review status');
        return await response.json();
    } catch (err) {
        console.error('Check review status error:', err);
        throw err;
    }
};
