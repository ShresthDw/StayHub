// features/chat/routes.js
import express from 'express';
import { optionalAuth } from '../../middleware/auth.js';
import { handleChatMessage, getChatSuggestions } from './chatController.js';

const router = express.Router();

// Both endpoints support optionalAuth so guest visitors can chat and logged-in users get personalized data
router.post('/message', optionalAuth, handleChatMessage);
router.get('/suggestions', optionalAuth, getChatSuggestions);

export default router;
