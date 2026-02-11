// RTK Query hooks for bookings
import { API_BASE_URL } from '../../../constants.jsx';

export {
    useCreateRazorpayOrderMutation,
    useVerifyRazorpayPaymentMutation,
    useGetHostEarningsQuery,
    useGetBookedPropertiesQuery,
    useGetMyBookingsQuery,
    useCancelBookingMutation
} from '../../../api/apiSlice.js';

// Direct async functions for use in event handlers
export const createRazorpayOrder = async (bookingData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/bookings/razorpay/order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': localStorage.getItem('userId') || ''
            },
            body: JSON.stringify(bookingData)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.msg || 'Failed to create Razorpay order');
        }
        return await response.json();
    } catch (err) {
        console.error('Create Razorpay order error:', err);
        throw err;
    }
};

export const verifyRazorpayPayment = async (paymentData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/bookings/razorpay/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': localStorage.getItem('userId') || ''
            },
            body: JSON.stringify(paymentData)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.msg || 'Failed to verify payment');
        }
        return await response.json();
    } catch (err) {
        console.error('Verify payment error:', err);
        throw err;
    }
};
