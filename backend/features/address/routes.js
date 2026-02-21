import express from 'express';
import { reverseGeocodeAddress } from '../../utils/addressParser.js';

const router = express.Router();

// Public routes
router.get('/reverse-geocode', reverseGeocodeAddress);

export default router;
