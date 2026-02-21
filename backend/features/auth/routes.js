
import express from 'express';
import mockAuth from '../../middleware/auth.js';
import { register, login, getCurrentUser, updateProfile, becomeOwner, logout, getWishlist, toggleWishlist } from './authController.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (require authentication)
router.get('/me', mockAuth, getCurrentUser);
router.put('/profile', mockAuth, updateProfile);
router.post('/become-owner', mockAuth, becomeOwner);
router.post('/logout', mockAuth, logout);

// Wishlist routes
router.get('/wishlist', mockAuth, getWishlist);
router.post('/wishlist/:roomId', mockAuth, toggleWishlist);

export default router;
