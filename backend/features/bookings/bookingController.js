
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Booking from '../../models/Booking.js';
import Room from '../../models/Room.js';

// Lazy initialize Razorpay instance
let razorpay;
function getRazorpayInstance() {
    if (!razorpay) {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env');
        }
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
    }
    return razorpay;
}

export const createRazorpayOrder = async (req, res) => {
    try {
        const { roomId, fromDate, toDate, nights, bookingUnits, pricePerNight } = req.body;

        // Validation
        if (!roomId || !fromDate || !toDate || !bookingUnits) {
            return res.status(400).json({ msg: 'Missing required booking fields: roomId, fromDate, toDate, bookingUnits' });
        }

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ msg: 'Room not found' });
        }

        const finalPrice = pricePerNight || room.pricePerNight;
        if (!finalPrice || finalPrice <= 0) {
            return res.status(400).json({ msg: 'Invalid room pricing' });
        }

        const totalAmount = finalPrice * bookingUnits;

        const razorpayClient = getRazorpayInstance();
        const razorpayOrder = await razorpayClient.orders.create({
            amount: Math.round(totalAmount * 100), // Amount in paise
            currency: 'INR',
            receipt: `booking_${Date.now()}`,
            notes: {
                roomId,
                fromDate,
                toDate,
                nights: bookingUnits
            }
        });

        const booking = new Booking({
            guestId: req.user.id,
            roomId,
            hostId: room.hostId,
            fromDate,
            toDate,
            checkInDate: fromDate,
            checkOutDate: toDate,
            nights: bookingUnits,
            pricePerNight: finalPrice,
            totalAmount,
            status: 'pending_payment',
            razorpayOrderId: razorpayOrder.id 
        });

        await booking.save();

        res.status(201).json({
            msg: 'Order created successfully',
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            nights: bookingUnits,
            pricePerNight: finalPrice,
            totalAmount,
            bookingId: booking._id
        });

    } catch (err) {
        console.error('ERROR in POST /api/bookings/razorpay/order:', err.message);
        res.status(500).json({ message: 'Failed to create order', error: err.message });
    }
};


// POST /api/bookings/razorpay/verify

export const verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ msg: 'Missing payment verification fields' });
        }

        // Verify Razorpay signature
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            console.error('RAZORPAY_KEY_SECRET not configured');
            return res.status(500).json({ msg: 'Payment gateway not properly configured' });
        }

        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        const isValidSignature = expectedSignature === razorpay_signature;
        if (!isValidSignature) {
            console.error('Invalid Razorpay signature detected');
            return res.status(400).json({ msg: 'Payment verification failed: Invalid signature' });
        }

        let booking = await Booking.findOne({ razorpayOrderId: razorpay_order_id });
        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found' });
        }


        if (String(booking.guestId) !== String(req.user.id)) {
            return res.status(403).json({ msg: 'Not authorized to verify this booking' });
        }


        booking.status = 'confirmed';
        booking.paymentId = razorpay_payment_id;
        booking.paymentVerifiedAt = new Date();
        await booking.save();

        
        await booking.populate('hostId', 'name email phone');
        await booking.populate('roomId', 'title address images');

        res.status(200).json({
            msg: 'Payment verified and booking confirmed successfully',
            booking,
            bookingId: booking._id,
            paymentId: razorpay_payment_id
        });

    } catch (err) {
        console.error('ERROR in POST /api/bookings/razorpay/verify:', err.message);
        res.status(500).json({ message: 'Failed to verify payment', error: err.message });
    }
};


// GET /api/bookings/host-earnings

export const getHostEarnings = async (req, res) => {
    try {
      
        if (req.user.role !== 'owner') {
            return res.status(403).json({ msg: 'Only hosts can view earnings' });
        }

        
        const bookings = await Booking.find({
            hostId: req.user.id,
            status: 'confirmed'
        })
            .populate('roomId', 'title')
            .populate('guestId', 'name email')
            .sort({ checkInDate: -1 });

      
        const transformedBookings = bookings.map(booking => ({
            _id: booking._id,
            roomTitle: booking.roomId?.title || 'Unknown Room',
            guestName: booking.guestId?.name || 'Unknown Guest',
            bookingMode: 'daily',
            amount: booking.totalAmount,
            createdAt: booking.createdAt,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
            pricePerNight: booking.pricePerNight,
            nights: booking.nights,
            totalAmount: booking.totalAmount
        }));

        const totalEarnings = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
        const totalBookings = bookings.length;

        res.status(200).json({
            totalEarnings,
            totalBookings,
            bookings: transformedBookings
        });

    } catch (err) {
        console.error('ERROR in GET /api/bookings/host-earnings:', err);
        res.status(500).json({ message: 'Failed to fetch earnings' });
    }
};

/**
 * GET /api/bookings/booked-list
 * Get all confirmed and upcoming bookings for host's properties
 */
export const getBookedProperties = async (req, res) => {
    try {
        // User must be an owner
        if (req.user.role !== 'owner') {
            return res.status(403).json({ msg: 'Only hosts can view booked properties' });
        }

        // Get all confirmed and upcoming bookings for this host's rooms
        const bookings = await Booking.find({
            hostId: req.user.id,
            status: { $in: ['confirmed', 'completed'] }
        })
            .populate('roomId', 'title address images pricePerNight')
            .populate('guestId', 'name email phone')
            .sort({ checkInDate: -1 });

        // Transform bookings to match frontend expectations
        const bookedProperties = bookings.map(booking => ({
            _id: booking._id,
            roomId: booking.roomId?._id,
            roomTitle: booking.roomId?.title || 'Unknown Property',   //Agar kisi wajah se database mein room delete ho gaya ho, toh app crash nahi hogi; wo "Unknown Property" dikha dega
            roomAddress: booking.roomId?.address?.city || 'Unknown Location',
            roomImages: booking.roomId?.images || [],
            guestName: booking.guestId?.name || 'Unknown Guest',
            guestEmail: booking.guestId?.email,
            guestPhone: booking.guestId?.phone,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
            nights: booking.nights,
            totalAmount: booking.totalAmount,
            pricePerNight: booking.pricePerNight,
            status: booking.status,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt
        }));

        res.status(200).json(bookedProperties);

    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch booked properties' });
    }
};

// GET /api/bookings

export const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ guestId: req.user.id })
            .populate('roomId', 'title images location address pricePerNight')
            .populate('hostId', 'name email phone')
            .sort({ checkInDate: -1 });

        // Transform bookings to include payment status and formatted data
        const transformedBookings = bookings.map(booking => ({
            _id: booking._id,
            roomId: booking.roomId?._id,
            roomTitle: booking.roomId?.title || 'Unknown Property',
            roomAddress: booking.roomId?.address?.city || 'Unknown Location',
            roomImages: booking.roomId?.images || [],
            hostName: booking.hostId?.name || 'Unknown Host',
            hostEmail: booking.hostId?.email,
            hostPhone: booking.hostId?.phone,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
            nights: booking.nights,
            totalAmount: booking.totalAmount,
            pricePerNight: booking.pricePerNight,
            status: booking.status,
            paymentStatus: booking.status === 'confirmed' ? 'Paid' : booking.status === 'pending_payment' ? 'Pending' : 'Cancelled',
            paymentId: booking.paymentId,
            razorpayOrderId: booking.razorpayOrderId,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt
        }));

        res.status(200).json(transformedBookings);

    } catch (err) {
        console.error('ERROR in GET /api/bookings:', err);
        res.status(500).json({ message: 'Failed to fetch bookings' });
    }
};

// DELETE /api/bookings/:id

export const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found' });
        }

        if (String(booking.guestId) !== String(req.user.id)) {
            return res.status(403).json({ msg: 'Not authorized to cancel this booking' });
        }

        if (!['pending_payment', 'confirmed'].includes(booking.status)) {
            return res.status(400).json({ msg: 'Cannot cancel this booking' });
        }

        booking.status = 'cancelled';
        await booking.save();

        res.status(200).json({ msg: 'Booking cancelled', booking });

    } catch (err) {
        console.error('ERROR in DELETE /api/bookings/:id:', err);
        res.status(500).json({ message: 'Failed to cancel booking' });
    }
};

export const submitReview = async (req, res) => {
    try {
        const { roomId, rating, comment } = req.body;
        const guestId = req.user.id;

        // Validation
        if (!roomId || !rating || !comment) {
            return res.status(400).json({ msg: 'Missing required fields: roomId, rating, comment' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
        }

        if (comment.trim().length < 10) {
            return res.status(400).json({ msg: 'Comment must be at least 10 characters long' });
        }

        // Check if user has a booking for this room where checkout date has passed
        const booking = await Booking.findOne({
            guestId,
            roomId,
            status: { $in: ['confirmed', 'completed', 'cancelled'] }
        });

        if (!booking) {
            return res.status(403).json({ msg: 'You must have a booking for this property to review it' });
        }

        // Check if checkout date has passed
        const checkoutDate = new Date(booking.checkOutDate);
        checkoutDate.setHours(0, 0, 0, 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (checkoutDate >= today) {
            return res.status(403).json({ msg: 'You can review this property after your checkout date' });
        }

        const room = await Room.findById(roomId).populate('reviews.guestId', 'name');
        if (!room) {
            return res.status(404).json({ msg: 'Room not found' });
        }

        // Check if user already reviewed this room
        const existingReview = room.reviews.find(r => String(r.guestId) === String(guestId));
        if (existingReview) {
            return res.status(400).json({ msg: 'You have already reviewed this property' });
        }

        // Get guest info
        const guestInfo = await Booking.findOne({ guestId }).populate('guestId', 'name');
        const guestName = guestInfo?.guestId?.name || 'Guest';

        // Add review to room
        room.reviews.push({
            guestId,
            guestName,
            rating: Number(rating),
            comment: comment.trim(),
            createdAt: new Date()
        });

        // Update room rating and review count
        const totalRating = room.reviews.reduce((sum, r) => sum + r.rating, 0);
        room.rating = Number((totalRating / room.reviews.length).toFixed(1));
        room.reviewCount = room.reviews.length;

        await room.save();

        res.status(200).json({
            msg: 'Review submitted successfully',
            room,
            review: room.reviews[room.reviews.length - 1]
        });

    } catch (err) {
        console.error('ERROR in POST /api/bookings/reviews/submit:', err);
        res.status(500).json({ msg: 'Failed to submit review' });
    }
};

export const checkUserReviewStatus = async (req, res) => {
    try {
        const { roomId } = req.params;
        const guestId = req.user.id;

        // Check if user has a booking for this room
        const booking = await Booking.findOne({
            guestId,
            roomId,
            status: { $in: ['confirmed', 'completed', 'cancelled'] }
        });

        // Check if checkout date has passed
        let canReview = false;
        if (booking) {
            const checkoutDate = new Date(booking.checkOutDate);
            checkoutDate.setHours(0, 0, 0, 0);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            canReview = checkoutDate < today;
        }

        // Check if user already reviewed
        const room = await Room.findById(roomId);
        const hasReviewed = room?.reviews?.some(r => String(r.guestId) === String(guestId));

        res.status(200).json({
            canReview,
            hasReviewed,
            booking
        });

    } catch (err) {
        console.error('ERROR in GET /api/bookings/reviews/status/:roomId:', err);
        res.status(500).json({ msg: 'Failed to check review status' });
    }
};
