// features/chat/chatController.js
import { processChatMessage, generateContextualSuggestions } from './chatService.js';

/**
 * POST /api/chat/message
 * Handles user questions and returns dynamic backend responses
 */
export const handleChatMessage = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ msg: 'Message text is required' });
        }

        const sanitizedMessage = message.trim().slice(0, 1000);

        const response = await processChatMessage({
            message: sanitizedMessage,
            history: Array.isArray(history) ? history : [],
            user: req.user || null
        });

        return res.status(200).json(response);
    } catch (err) {
        console.error('ERROR in POST /api/chat/message:', err);
        return res.status(500).json({
            reply: 'An error occurred while processing your request. Please try again.',
            cards: [],
            cardType: null,
            suggestions: ['Find stays in Goa', 'Explore top cities', 'Check my bookings'],
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * GET /api/chat/suggestions
 * Returns initial quick prompt suggestions
 */
export const getChatSuggestions = async (req, res) => {
    try {
        const suggestions = generateContextualSuggestions({
            cardType: null,
            user: req.user || null
        });
        return res.status(200).json({ suggestions });
    } catch (err) {
        console.error('ERROR in GET /api/chat/suggestions:', err);
        return res.status(200).json({
            suggestions: [
                'Villas in Goa under ₹5000',
                'Apartments in Mumbai',
                'Check my bookings',
                'My Wishlist'
            ]
        });
    }
};
