// features/rooms/routes.js
import express from 'express';
import mockAuth from '../../middleware/auth.js';
import { getRooms, getRoomById, getMyRooms, addRoom, editRoom, deleteRoom, getCities } from './roomController.js';
import { submitReview, checkUserReviewStatus } from '../bookings/bookingController.js';

const router = express.Router();

// Public routes
router.get('/', getRooms);
router.get('/cities/list', getCities);  // Must come before /:id
router.get('/mine', mockAuth, getMyRooms);  // Must come before /:id

// Review routes (also available under /api/rooms/:roomId/...)
router.get('/:roomId/review-status', mockAuth, checkUserReviewStatus);
router.post('/:roomId/reviews', mockAuth, (req, res) => {
    req.body.roomId = req.params.roomId;
    return submitReview(req, res);
});

router.get('/:id', getRoomById);

// Protected modification routes
router.post('/add', mockAuth, addRoom);
router.put('/edit/:id', mockAuth, editRoom);
router.delete('/delete/:id', mockAuth, deleteRoom);

export default router;
