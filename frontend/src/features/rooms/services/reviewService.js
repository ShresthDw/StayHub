import { API_BASE_URL } from '../../../constants.jsx';
import axios from 'axios';

// Direct async functions for use in event handlers
export const submitReview = async (roomId, rating, comment) => {
    try {
        const payload = typeof rating === 'object' 
            ? { roomId, ...rating }
            : { roomId, rating, comment };

        const response = await axios.post(`${API_BASE_URL}/rooms/${roomId}/reviews`, payload, {
            withCredentials: true,
            headers: {
                'x-user-id': localStorage.getItem('userId') || ''
            }
        });
        return response.data;
    } catch (err) {
        console.error('Submit review error:', err);
        throw err;
    }
};

export const checkUserReviewStatus = async (roomId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/rooms/${roomId}/review-status`, {
            withCredentials: true,
            headers: {
                'x-user-id': localStorage.getItem('userId') || ''
            }
        });
        return response.data;
    } catch (err) {
        console.error('Check review status error:', err);
        return { canReview: false, hasReviewed: false };
    }
};
