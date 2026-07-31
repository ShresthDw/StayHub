
import express from 'express';
import mockAuth, { optionalAuth } from '../../middleware/auth.js';
import { register, login, googleAuth, getCurrentUser, updateProfile, becomeOwner, logout, getWishlist, toggleWishlist } from './authController.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);

// Session check route (gracefully handles unauthenticated / guest visitors with 200 { user: null })
router.get('/me', optionalAuth, getCurrentUser);

// Protected routes (require authentication)
router.put('/profile', mockAuth, updateProfile);
router.post('/become-owner', mockAuth, becomeOwner);
router.post('/logout', mockAuth, logout);

// Wishlist routes
router.get('/wishlist', mockAuth, getWishlist);
router.post('/wishlist/:roomId', mockAuth, toggleWishlist);

export default router;
