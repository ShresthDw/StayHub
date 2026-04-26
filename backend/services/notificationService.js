// services/notificationService.js
import Notification from '../models/Notification.js';
import { emitToUser } from '../config/socket.js';
import {
    sendBookingConfirmationEmail,
    sendNewBookingHostAlertEmail,
    sendBookingCancelledEmail,
    sendReviewNotificationEmail
} from './emailService.js';

/**
 * Core notification dispatcher: saves to DB, emits via WebSocket, and triggers email.
 */
export const createNotification = async ({
    recipientId,
    senderId = null,
    type,
    title,
    message,
    link = '/my-bookings',
    data = {}
}) => {
    try {
        const rawRecipient = recipientId?._id || recipientId;
        const rawSender = senderId?._id || senderId || null;

        if (!rawRecipient) {
            console.warn('createNotification skipped: recipientId is missing.');
            return null;
        }

        // 1. Save to Database
        const notification = new Notification({
            recipient: rawRecipient,
            sender: rawSender || undefined,
            type,
            title,
            message,
            link,
            data
        });

        await notification.save();
        console.log(`[Notification Created] Type: ${type} | Recipient: ${rawRecipient} | Title: "${title}"`);

        // 2. Fetch fresh unread count for badge sync
        const unreadCount = await Notification.countDocuments({
            recipient: rawRecipient,
            isRead: false
        });

        // 3. Emit real-time WebSocket event
        emitToUser(rawRecipient.toString(), 'new_notification', notification);
        emitToUser(rawRecipient.toString(), 'unread_count_update', { count: unreadCount });

        return notification;
    } catch (err) {
        console.error('ERROR in createNotification:', err);
        return null;
    }
};

/**
 * Notify both Guest and Host when a booking payment is confirmed
 */
export const notifyBookingConfirmed = async ({ guest, host, room, booking }) => {
    try {
        const guestId = guest?._id || guest || booking?.guestId?._id || booking?.guestId;
        const hostId = host?._id || host || room?.hostId?._id || room?.hostId || booking?.hostId?._id || booking?.hostId;
        const roomTitle = room?.title || 'Property';
        const checkInDate = booking?.checkInDate || booking?.fromDate;
        const checkOutDate = booking?.checkOutDate || booking?.toDate;
        const totalAmount = booking?.totalAmount;
        const nights = booking?.nights || 1;

        console.log(`[NotifyBookingConfirmed] GuestId: ${guestId}, HostId: ${hostId}, Room: ${roomTitle}`);

        // 1. In-App Notification for Guest
        await createNotification({
            recipientId: guestId,
            senderId: hostId,
            type: 'booking_confirmed',
            title: 'Booking Confirmed! 🎉',
            message: `Your reservation at ${roomTitle} from ${checkInDate} to ${checkOutDate} is confirmed. Total: ₹${totalAmount?.toLocaleString('en-IN') || totalAmount}.`,
            link: '/my-bookings',
            data: {
                bookingId: booking?._id,
                roomId: room?._id || booking?.roomId,
                roomTitle,
                hostName: host?.name || 'Host',
                totalAmount,
                checkInDate,
                checkOutDate,
                nights
            }
        });

        // 2. In-App Notification for Host
        await createNotification({
            recipientId: hostId,
            senderId: guestId,
            type: 'new_booking_received',
            title: 'New Booking Received! 🛎️',
            message: `${guest?.name || 'A guest'} booked ${roomTitle} from ${checkInDate} to ${checkOutDate} for ₹${totalAmount?.toLocaleString('en-IN') || totalAmount}.`,
            link: '/booked-properties',
            data: {
                bookingId: booking?._id,
                roomId: room?._id || booking?.roomId,
                roomTitle,
                guestName: guest?.name || 'Guest',
                totalAmount,
                checkInDate,
                checkOutDate,
                nights
            }
        });

        // 3. Email Dispatch to Guest (Async fire-and-forget)
        if (guest?.email) {
            sendBookingConfirmationEmail({
                guestEmail: guest.email,
                guestName: guest.name,
                roomTitle,
                checkInDate,
                checkOutDate,
                nights,
                totalAmount,
                bookingId: booking._id
            }).catch((e) => console.error('Guest email error:', e.message));
        }

        // 4. Email Dispatch to Host (Async fire-and-forget)
        if (host?.email) {
            sendNewBookingHostAlertEmail({
                hostEmail: host.email,
                hostName: host.name,
                guestName: guest?.name,
                roomTitle,
                checkInDate,
                checkOutDate,
                nights,
                totalAmount
            }).catch((e) => console.error('Host email error:', e.message));
        }
    } catch (err) {
        console.error('ERROR in notifyBookingConfirmed:', err);
    }
};

/**
 * Notify Guest and Host when a booking is cancelled
 */
export const notifyBookingCancelled = async ({ guest, host, room, booking, cancelledBy = 'guest' }) => {
    try {
        const guestId = guest?._id || guest || booking?.guestId?._id || booking?.guestId;
        const hostId = host?._id || host || room?.hostId?._id || room?.hostId || booking?.hostId?._id || booking?.hostId;
        const roomTitle = room?.title || 'Property';
        const checkInDate = booking?.checkInDate || booking?.fromDate;
        const checkOutDate = booking?.checkOutDate || booking?.toDate;

        // 1. In-App Notification for Guest
        await createNotification({
            recipientId: guestId,
            senderId: hostId,
            type: 'booking_cancelled',
            title: 'Booking Cancelled ℹ️',
            message: `Your booking for ${roomTitle} (${checkInDate} - ${checkOutDate}) has been cancelled.`,
            link: '/my-bookings',
            data: {
                bookingId: booking?._id,
                roomId: room?._id || booking?.roomId,
                roomTitle,
                checkInDate,
                checkOutDate
            }
        });

        // 2. In-App Notification for Host
        await createNotification({
            recipientId: hostId,
            senderId: guestId,
            type: 'booking_cancelled',
            title: 'Reservation Cancelled ⚠️',
            message: `${guest?.name || 'A guest'} cancelled their reservation for ${roomTitle} (${checkInDate} - ${checkOutDate}).`,
            link: '/booked-properties',
            data: {
                bookingId: booking?._id,
                roomId: room?._id || booking?.roomId,
                roomTitle,
                guestName: guest?.name || 'Guest',
                checkInDate,
                checkOutDate
            }
        });

        // 3. Email to Guest
        if (guest?.email) {
            sendBookingCancelledEmail({
                recipientEmail: guest.email,
                recipientName: guest.name,
                isHost: false,
                guestName: guest.name,
                roomTitle,
                checkInDate,
                checkOutDate
            }).catch((e) => console.error('Guest cancel email error:', e.message));
        }

        // 4. Email to Host
        if (host?.email) {
            sendBookingCancelledEmail({
                recipientEmail: host.email,
                recipientName: host.name,
                isHost: true,
                guestName: guest?.name,
                roomTitle,
                checkInDate,
                checkOutDate
            }).catch((e) => console.error('Host cancel email error:', e.message));
        }
    } catch (err) {
        console.error('ERROR in notifyBookingCancelled:', err);
    }
};

/**
 * Notify Host when a guest leaves a review
 */
export const notifyReviewReceived = async ({ guest, host, room, rating, comment }) => {
    try {
        const hostId = host?._id || host || room?.hostId?._id || room?.hostId;
        const guestId = guest?._id || guest;
        const roomTitle = room?.title || 'Property';

        if (!hostId) return;

        // 1. In-App Notification for Host
        await createNotification({
            recipientId: hostId,
            senderId: guestId,
            type: 'review_received',
            title: 'New Review Received! ⭐',
            message: `${guest?.name || 'A guest'} left a ${rating}★ review on ${roomTitle}: "${comment.length > 60 ? comment.substring(0, 57) + '...' : comment}"`,
            link: `/rooms/${room._id}`,
            data: {
                roomId: room._id,
                roomTitle,
                guestName: guest?.name || 'Guest',
                rating,
                comment
            }
        });

        // 2. Email to Host
        if (host?.email) {
            sendReviewNotificationEmail({
                hostEmail: host.email,
                hostName: host.name,
                guestName: guest?.name,
                roomTitle,
                rating,
                comment
            }).catch((e) => console.error('Review email error:', e.message));
        }
    } catch (err) {
        console.error('ERROR in notifyReviewReceived:', err);
    }
};
