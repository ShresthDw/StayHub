// models/Booking.js
import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema(
    {
        guestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room',
            required: true
        },
        hostId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        fromDate: {
            type: String,
            required: true
        },
        toDate: {
            type: String,
            required: true
        },
        checkInDate: {
            type: String,
            required: true
        },
        checkOutDate: {
            type: String,
            required: true
        },
        nights: Number,
        pricePerNight: Number,
        totalAmount: Number,
        guests: Number,
        status: {
            type: String,
            enum: ['pending_payment', 'confirmed', 'cancelled', 'completed'],
            default: 'pending_payment'
        },
        paymentId: String,
        razorpayOrderId: String,
        paymentVerifiedAt: Date
    },
    { timestamps: true }
);

BookingSchema.index({ guestId: 1 });
BookingSchema.index({ hostId: 1 });
BookingSchema.index({ roomId: 1 });
BookingSchema.index({ checkInDate: 1, checkOutDate: 1 });
BookingSchema.index({ status: 1 });

const Booking = mongoose.model('Booking', BookingSchema);
export default Booking;
