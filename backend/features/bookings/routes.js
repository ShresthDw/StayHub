
import express from 'express';
import mockAuth from '../../middleware/auth.js';
import {
    createRazorpayOrder,
    verifyRazorpayPayment,
    getHostEarnings,
    getBookedProperties,
    getMyBookings,
    cancelBooking,
    submitReview,
    checkUserReviewStatus
} from './bookingController.js';

const router = express.Router();

// All bookings routes require authentication
router.post('/razorpay/order', mockAuth, createRazorpayOrder);
router.post('/razorpay/verify', mockAuth, verifyRazorpayPayment);
router.get('/host-earnings', mockAuth, getHostEarnings);
router.get('/booked-list', mockAuth, getBookedProperties);
router.delete('/:id', mockAuth, cancelBooking);
router.get('/', mockAuth, getMyBookings);

// Review routes
router.post('/reviews/submit', mockAuth, submitReview);
router.get('/reviews/status/:roomId', mockAuth, checkUserReviewStatus);

export default router;
