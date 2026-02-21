// features/rooms/routes.js
import express from 'express';
import mockAuth from '../../middleware/auth.js';
import { getRooms, getRoomById, getMyRooms, addRoom, editRoom, deleteRoom, getCities } from './roomController.js';

const router = express.Router();

// Public routes
router.get('/', getRooms);
router.get('/cities/list', getCities);  // Must come before /:id
router.get('/mine', mockAuth, getMyRooms);  // Must come before /:id
router.get('/:id', getRoomById);

// Protected modification routes
router.post('/add', mockAuth, addRoom);
router.put('/edit/:id', mockAuth, editRoom);
router.delete('/delete/:id', mockAuth, deleteRoom);

export default router;
