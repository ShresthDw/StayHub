// features/notifications/notificationController.js
import Notification from '../../models/Notification.js';
import { emitToUser } from '../../config/socket.js';

/**
 * GET /api/notifications
 * Fetch paginated notifications for current user with optional filters
 */
export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const unreadOnly = req.query.unreadOnly === 'true';
        const type = req.query.type;

        const filter = { recipient: userId };
        if (unreadOnly) {
            filter.isRead = false;
        }
        if (type && type !== 'all') {
            filter.type = type;
        }

        const [notifications, totalCount, unreadCount] = await Promise.all([
            Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Notification.countDocuments(filter),
            Notification.countDocuments({ recipient: userId, isRead: false })
        ]);

        res.status(200).json({
            notifications,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit) || 1
            },
            unreadCount
        });
    } catch (err) {
        console.error('ERROR in GET /api/notifications:', err);
        res.status(500).json({ msg: 'Failed to fetch notifications' });
    }
};

/**
 * GET /api/notifications/unread-count
 * Fast endpoint for header badge polling/syncing
 */
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            isRead: false
        });

        res.status(200).json({ unreadCount });
    } catch (err) {
        console.error('ERROR in GET /api/notifications/unread-count:', err);
        res.status(500).json({ msg: 'Failed to fetch unread count' });
    }
};

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
export const markNotificationAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, recipient: userId },
            { isRead: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ msg: 'Notification not found' });
        }

        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            isRead: false
        });

        emitToUser(userId, 'unread_count_update', { count: unreadCount });

        res.status(200).json({ msg: 'Notification marked as read', notification, unreadCount });
    } catch (err) {
        console.error('ERROR in PATCH /api/notifications/:id/read:', err);
        res.status(500).json({ msg: 'Failed to mark notification as read' });
    }
};

/**
 * PATCH /api/notifications/mark-all-read
 * Mark all notifications for current user as read
 */
export const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await Notification.updateMany(
            { recipient: userId, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        emitToUser(userId, 'unread_count_update', { count: 0 });

        res.status(200).json({ msg: 'All notifications marked as read', unreadCount: 0 });
    } catch (err) {
        console.error('ERROR in PATCH /api/notifications/mark-all-read:', err);
        res.status(500).json({ msg: 'Failed to mark all as read' });
    }
};

/**
 * DELETE /api/notifications/:id
 * Delete a specific notification
 */
export const deleteNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const deleted = await Notification.findOneAndDelete({
            _id: id,
            recipient: userId
        });

        if (!deleted) {
            return res.status(404).json({ msg: 'Notification not found' });
        }

        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            isRead: false
        });

        emitToUser(userId, 'unread_count_update', { count: unreadCount });

        res.status(200).json({ msg: 'Notification deleted successfully', unreadCount });
    } catch (err) {
        console.error('ERROR in DELETE /api/notifications/:id:', err);
        res.status(500).json({ msg: 'Failed to delete notification' });
    }
};

/**
 * DELETE /api/notifications/clear-all
 * Clear all notifications for current user
 */
export const clearAllNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        await Notification.deleteMany({ recipient: userId });

        emitToUser(userId, 'unread_count_update', { count: 0 });

        res.status(200).json({ msg: 'All notifications cleared successfully', unreadCount: 0 });
    } catch (err) {
        console.error('ERROR in DELETE /api/notifications/clear-all:', err);
        res.status(500).json({ msg: 'Failed to clear notifications' });
    }
};
