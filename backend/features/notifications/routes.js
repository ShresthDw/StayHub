// features/notifications/routes.js
import express from 'express';
import mockAuth from '../../middleware/auth.js';
import {
    getNotifications,
    getUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications
} from './notificationController.js';

const router = express.Router();

// All notification routes require authentication
router.use(mockAuth);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/mark-all-read', markAllNotificationsAsRead);
router.patch('/:id/read', markNotificationAsRead);
router.delete('/clear-all', clearAllNotifications);
router.delete('/:id', deleteNotification);

export default router;
