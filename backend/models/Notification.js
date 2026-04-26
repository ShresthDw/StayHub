// models/Notification.js
import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        type: {
            type: String,
            enum: [
                'booking_confirmed',
                'booking_cancelled',
                'new_booking_received',
                'checkin_reminder',
                'review_received',
                'review_prompt',
                'system'
            ],
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        link: {
            type: String,
            default: '/my-bookings'
        },
        data: {
            bookingId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Booking'
            },
            roomId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Room'
            },
            roomTitle: String,
            guestName: String,
            hostName: String,
            totalAmount: Number,
            checkInDate: String,
            checkOutDate: String,
            nights: Number,
            rating: Number,
            comment: String
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true
        },
        readAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

// Compound index for querying user notifications efficiently
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', NotificationSchema);
export default Notification;
