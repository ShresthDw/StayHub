// features/chat/chatService.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import Room from '../../models/Room.js';
import Booking from '../../models/Booking.js';
import User from '../../models/User.js';

export const stripEmojis = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]|[\uFE00-\uFE0F]|[\u{1F000}-\u{1FFFF}])/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
};

// BACKEND QUERY TOOLS

/**
 * Dynamically search rooms matching user criteria
 */
export const searchRoomsTool = async ({
    city,
    minPrice,
    maxPrice,
    propertyType,
    roomType,
    guests,
    amenities,
    minRating,
    sort = 'rating_desc',
    limit = 6
} = {}) => {
    try {
        const query = { isActive: true };

        if (city && typeof city === 'string' && city.trim()) {
            const cleanCity = city.trim();
            query.$or = [
                { 'address.city': { $regex: cleanCity, $options: 'i' } },
                { 'address.state': { $regex: cleanCity, $options: 'i' } },
                { 'address.country': { $regex: cleanCity, $options: 'i' } },
                { title: { $regex: cleanCity, $options: 'i' } }
            ];
        }

        if (propertyType && typeof propertyType === 'string' && propertyType.trim()) {
            query.propertyType = { $regex: propertyType.trim(), $options: 'i' };
        }

        if (roomType && typeof roomType === 'string' && roomType.trim()) {
            query.roomType = { $regex: roomType.trim(), $options: 'i' };
        }

        if (guests && Number(guests) > 0) {
            query.maxGuests = { $gte: Number(guests) };
        }

        if (minRating && Number(minRating) > 0) {
            query.rating = { $gte: Number(minRating) };
        }

        const priceFilter = {};
        if (minPrice && Number(minPrice) > 0) priceFilter.$gte = Number(minPrice);
        if (maxPrice && Number(maxPrice) > 0) priceFilter.$lte = Number(maxPrice);
        if (Object.keys(priceFilter).length > 0) {
            query.pricePerNight = priceFilter;
        }

        if (amenities) {
            const amenityList = Array.isArray(amenities)
                ? amenities
                : String(amenities).split(',').map(a => a.trim()).filter(Boolean);
            if (amenityList.length > 0) {
                query.amenities = {
                    $all: amenityList.map(item => new RegExp(`^${item}$`, 'i'))
                };
            }
        }

        let sortOption = { rating: -1, createdAt: -1 };
        if (sort === 'price_asc') sortOption = { pricePerNight: 1 };
        if (sort === 'price_desc') sortOption = { pricePerNight: -1 };
        if (sort === 'rating_desc') sortOption = { rating: -1, reviewCount: -1 };
        if (sort === 'newest') sortOption = { createdAt: -1 };

        const rooms = await Room.find(query)
            .select('title description propertyType roomType pricePerNight address location maxGuests bedrooms beds bathrooms amenities images rating reviewCount')
            .sort(sortOption)
            .limit(Math.min(limit, 10))
            .lean();

        const formattedRooms = rooms.map(room => ({
            id: room._id.toString(),
            title: room.title,
            description: room.description ? room.description.substring(0, 140) + '...' : '',
            propertyType: room.propertyType,
            roomType: room.roomType,
            pricePerNight: room.pricePerNight,
            city: room.address?.city || room.address?.state || 'Unknown Location',
            state: room.address?.state || '',
            rating: room.rating || 0,
            reviewCount: room.reviewCount || 0,
            maxGuests: room.maxGuests || 1,
            bedrooms: room.bedrooms || 1,
            amenities: room.amenities || [],
            image: (room.images && room.images.length > 0)
                ? (room.images.find(img => img.isPrimary)?.url || room.images[0].url)
                : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
            url: `/rooms/${room._id}`
        }));

        return {
            totalFound: formattedRooms.length,
            criteria: { city, minPrice, maxPrice, propertyType, guests, amenities },
            rooms: formattedRooms
        };
    } catch (err) {
        console.error('searchRoomsTool error:', err);
        return { totalFound: 0, rooms: [], error: err.message };
    }
};

/**
 * Get detailed information about a specific room
 */
export const getRoomDetailsTool = async ({ roomId, titleQuery } = {}) => {
    try {
        let query = {};
        if (roomId) {
            query._id = roomId;
        } else if (titleQuery) {
            query.title = { $regex: titleQuery, $options: 'i' };
        } else {
            return { error: 'Please provide a roomId or titleQuery' };
        }

        const room = await Room.findOne(query)
            .populate('hostId', 'name email avatar phone')
            .lean();

        if (!room) {
            return { error: 'Stay not found matching your query.' };
        }

        return {
            id: room._id.toString(),
            title: room.title,
            description: room.description,
            propertyType: room.propertyType,
            roomType: room.roomType,
            pricePerNight: room.pricePerNight,
            address: room.address,
            maxGuests: room.maxGuests,
            bedrooms: room.bedrooms,
            beds: room.beds,
            bathrooms: room.bathrooms,
            amenities: room.amenities,
            rating: room.rating,
            reviewCount: room.reviewCount,
            host: {
                name: room.hostId?.name || 'Verified Host',
                avatar: room.hostId?.avatar || null
            },
            recentReviews: (room.reviews || []).slice(-3).map(r => ({
                guestName: r.guestName,
                rating: r.rating,
                comment: r.comment,
                date: r.createdAt
            })),
            image: (room.images && room.images.length > 0)
                ? (room.images.find(img => img.isPrimary)?.url || room.images[0].url)
                : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
            url: `/rooms/${room._id}`
        };
    } catch (err) {
        console.error('getRoomDetailsTool error:', err);
        return { error: err.message };
    }
};

/**
 * Get bookings for the authenticated user
 */
export const getUserBookingsTool = async ({ userId, status } = {}) => {
    try {
        if (!userId) {
            return {
                isGuest: true,
                message: 'You need to be logged in to view your bookings. Please log in or sign up to check your trips.'
            };
        }

        const query = { guestId: userId };
        if (status && ['pending_payment', 'confirmed', 'completed', 'cancelled'].includes(status)) {
            query.status = status;
        }

        const bookings = await Booking.find(query)
            .populate('roomId', 'title images address pricePerNight propertyType rating')
            .populate('hostId', 'name email phone')
            .sort({ checkInDate: -1 })
            .lean();

        const formatted = bookings.map(b => ({
            id: b._id.toString(),
            roomTitle: b.roomId?.title || 'Stay Listing',
            roomId: b.roomId?._id?.toString(),
            roomImage: (b.roomId?.images && b.roomId.images.length > 0)
                ? (b.roomId.images.find(i => i.isPrimary)?.url || b.roomId.images[0].url)
                : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
            city: b.roomId?.address?.city || b.roomId?.address?.state || 'Destination',
            checkInDate: b.checkInDate || b.fromDate,
            checkOutDate: b.checkOutDate || b.toDate,
            nights: b.nights || 1,
            totalAmount: b.totalAmount || (b.pricePerNight * (b.nights || 1)),
            pricePerNight: b.pricePerNight,
            status: b.status,
            hostName: b.hostId?.name || 'StayHub Host',
            url: b.roomId?._id ? `/rooms/${b.roomId._id}` : '/my-bookings'
        }));

        return {
            isGuest: false,
            count: formatted.length,
            bookings: formatted
        };
    } catch (err) {
        console.error('getUserBookingsTool error:', err);
        return { error: err.message };
    }
};

/**
 * Get wishlist items for the user
 */
export const getUserWishlistTool = async ({ userId } = {}) => {
    try {
        if (!userId) {
            return {
                isGuest: true,
                message: 'Please log in to view your saved wishlist stays.'
            };
        }

        const user = await User.findById(userId)
            .populate({
                path: 'wishlist',
                select: 'title description propertyType pricePerNight address images rating reviewCount isActive'
            })
            .lean();

        if (!user || !user.wishlist || user.wishlist.length === 0) {
            return {
                isGuest: false,
                count: 0,
                wishlist: [],
                message: 'Your wishlist is currently empty. Start exploring stays and save your favorites.'
            };
        }

        const activeWishlist = user.wishlist.filter(room => room && room.isActive !== false);

        const formatted = activeWishlist.map(room => ({
            id: room._id.toString(),
            title: room.title,
            propertyType: room.propertyType,
            pricePerNight: room.pricePerNight,
            city: room.address?.city || room.address?.state || 'Destination',
            rating: room.rating || 0,
            image: (room.images && room.images.length > 0)
                ? (room.images.find(img => img.isPrimary)?.url || room.images[0].url)
                : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
            url: `/rooms/${room._id}`
        }));

        return {
            isGuest: false,
            count: formatted.length,
            wishlist: formatted
        };
    } catch (err) {
        console.error('getUserWishlistTool error:', err);
        return { error: err.message };
    }
};

/**
 * Get host properties and earnings summary
 */
export const getHostStatsTool = async ({ userId } = {}) => {
    try {
        if (!userId) {
            return {
                isGuest: true,
                message: 'Please log in to view host statistics and earnings.'
            };
        }

        const user = await User.findById(userId).lean();
        if (!user) return { error: 'User not found' };

        if (user.role !== 'owner') {
            return {
                isOwner: false,
                message: 'You are currently a Guest. You can become a Host easily from your Profile or Dashboard to list properties and start earning.'
            };
        }

        const hostRooms = await Room.find({ hostId: userId }).lean();
        const roomIds = hostRooms.map(r => r._id);

        const bookings = await Booking.find({
            $or: [
                { hostId: userId },
                { roomId: { $in: roomIds } }
            ]
        }).lean();

        const confirmedBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
        const totalEarnings = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const pendingBookings = bookings.filter(b => b.status === 'pending_payment');

        return {
            isOwner: true,
            totalListings: hostRooms.length,
            activeListings: hostRooms.filter(r => r.isActive).length,
            totalBookings: bookings.length,
            confirmedBookings: confirmedBookings.length,
            pendingBookings: pendingBookings.length,
            totalEarningsINR: totalEarnings,
            properties: hostRooms.map(r => ({
                id: r._id.toString(),
                title: r.title,
                city: r.address?.city || 'Location',
                pricePerNight: r.pricePerNight,
                rating: r.rating || 0,
                isActive: r.isActive
            }))
        };
    } catch (err) {
        console.error('getHostStatsTool error:', err);
        return { error: err.message };
    }
};

/**
 * Get all available destination cities
 */
export const getAvailableCitiesTool = async () => {
    try {
        const cities = await Room.aggregate([
            { $match: { isActive: true, 'address.city': { $exists: true, $ne: '' } } },
            {
                $group: {
                    _id: '$address.city',
                    count: { $sum: 1 },
                    minPrice: { $min: '$pricePerNight' },
                    firstImage: { $first: '$images' }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const formatted = cities.map(c => ({
            name: c._id,
            count: c.count,
            minPrice: c.minPrice,
            image: c.firstImage && c.firstImage.length > 0 ? c.firstImage[0].url : null,
            url: `/cities/${encodeURIComponent(c._id)}`
        }));

        return {
            totalCities: formatted.length,
            cities: formatted
        };
    } catch (err) {
        console.error('getAvailableCitiesTool error:', err);
        return { cities: [], error: err.message };
    }
};

/**
 * Knowledge Base / FAQ for StayHub
 */
export const getPlatformFaqTool = ({ topic } = {}) => {
    const faqs = {
        booking: {
            title: 'How Booking Works on StayHub',
            content: '1. Browse stays or ask StayBot for recommendations.\n2. Select your check-in & check-out dates and guest count.\n3. Click "Book Now" and proceed to secure checkout powered by Razorpay.\n4. Once payment is confirmed, your booking is locked in instantly and visible under "My Bookings".'
        },
        cancellation: {
            title: 'Cancellation & Refund Policy',
            content: 'StayHub offers flexible cancellations:\n- Full refund if cancelled 48 hours prior to the check-in date.\n- Partial refund (50%) if cancelled within 48 hours of check-in.\n- Refunds are processed directly back to your original payment method via Razorpay within 3-5 business days.'
        },
        payment: {
            title: 'Payment Methods & Security',
            content: 'StayHub supports secure payments through Razorpay:\n- UPI (Google Pay, PhonePe, Paytm, BHIM)\n- Credit and Debit Cards (Visa, MasterCard, RuPay, Amex)\n- Net Banking (all major banks)\n- Wallets'
        },
        hosting: {
            title: 'How to Become a Host & List a Property',
            content: '1. Go to your Profile and click "Become a Host".\n2. Navigate to "Add Property".\n3. Fill in title, description, property type (villa, apartment, hotel, etc.), price per night, address with map location picker, and photos.\n4. Submit to list immediately and start receiving bookings and earnings.'
        },
        checkin: {
            title: 'Check-in and Check-out Procedures',
            content: 'Standard check-in starts at 2:00 PM and check-out is by 11:00 AM. You will receive the exact host contact details and address in your booking confirmation.'
        },
        safety: {
            title: 'Trust, Safety & Verification',
            content: 'StayHub requires email/phone verification for guests and hosts. All user reviews are verified from actual completed stays.'
        }
    };

    if (topic && faqs[topic.toLowerCase()]) {
        return faqs[topic.toLowerCase()];
    }
    return {
        allTopics: Object.keys(faqs),
        summary: 'StayHub is a modern vacation rental and stay booking platform offering apartments, villas, cottages, resorts, and hotels across popular destinations.'
    };
};


// GEMINI TOOL DECLARATIONS FOR FUNCTION CALLING

const geminiToolDeclarations = [
    {
        name: 'searchRooms',
        description: 'Search available stays, rooms, villas, apartments, hotels on StayHub with destination, budget, amenities, guests, and property type filters.',
        parameters: {
            type: 'OBJECT',
            properties: {
                city: { type: 'STRING', description: 'Destination city or location name, e.g. Goa, Mumbai, Delhi, Jaipur, Bengaluru, Manali, Pune' },
                minPrice: { type: 'NUMBER', description: 'Minimum price per night in INR (₹)' },
                maxPrice: { type: 'NUMBER', description: 'Maximum price per night in INR (₹)' },
                propertyType: { type: 'STRING', description: 'Type of property: apartment, villa, hotel, resort, cottage, house, hostel' },
                roomType: { type: 'STRING', description: 'entire_place, private_room, shared_room' },
                guests: { type: 'NUMBER', description: 'Number of guests accommodation needed' },
                amenities: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Required amenities like WiFi, Parking, AC, Gym, Laundry, Balcony, Pool' },
                minRating: { type: 'NUMBER', description: 'Minimum rating (1 to 5)' },
                sort: { type: 'STRING', description: 'price_asc, price_desc, rating_desc, newest' }
            }
        }
    },
    {
        name: 'getRoomDetails',
        description: 'Get in-depth details, pricing, amenities, host details, and reviews for a specific stay by ID or title.',
        parameters: {
            type: 'OBJECT',
            properties: {
                roomId: { type: 'STRING', description: 'MongoDB ObjectID of the room' },
                titleQuery: { type: 'STRING', description: 'Name or title fragment of the stay property' }
            }
        }
    },
    {
        name: 'getUserBookings',
        description: "Retrieve current user's past, active, and upcoming bookings with status, dates, and amounts.",
        parameters: {
            type: 'OBJECT',
            properties: {
                status: { type: 'STRING', description: 'Filter by status: confirmed, pending_payment, completed, cancelled' }
            }
        }
    },
    {
        name: 'getUserWishlist',
        description: "Get the list of stays saved to the current user's wishlist/favorites.",
        parameters: {
            type: 'OBJECT',
            properties: {}
        }
    },
    {
        name: 'getHostStats',
        description: "Get host properties, active listing count, booked guest properties, and total earnings for the authenticated host.",
        parameters: {
            type: 'OBJECT',
            properties: {}
        }
    },
    {
        name: 'getAvailableCities',
        description: 'Get the list of popular cities/destinations with active stays and starting prices on StayHub.',
        parameters: {
            type: 'OBJECT',
            properties: {}
        }
    },
    {
        name: 'getPlatformFaq',
        description: 'Answer platform questions about booking process, cancellation policy, Razorpay payments, hosting guide, check-in rules, safety.',
        parameters: {
            type: 'OBJECT',
            properties: {
                topic: { type: 'STRING', description: 'booking, cancellation, payment, hosting, checkin, safety' }
            }
        }
    }
];

const wait = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds));

const withRetry = async (operation, label, attempts = 3) => {
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            return await operation();
        } catch (error) {
            const status = Number(error?.status || error?.statusCode);
            const retryable = !status || status === 408 || status === 429 || status >= 500;
            if (!retryable || attempt === attempts) throw error;

            const delay = 500 * (2 ** (attempt - 1));
            console.warn(`${label} request failed (attempt ${attempt}/${attempts}), retrying in ${delay}ms:`, error.message);
            await wait(delay);
        }
    }
};


// HYBRID NLP PARSER & INTENT RECOGNITION (FALLBACK ENGINE)


export const parseIntentAndExecute = async ({ message, user }) => {
    const text = (message || '').trim().toLowerCase();
    let cards = [];
    let cardType = null;
    let reply = '';

    // 1. Check for Bookings Intent
    if (
        text.includes('my booking') ||
        text.includes('my reservation') ||
        text.includes('my trips') ||
        text.includes('upcoming stay') ||
        text.includes('check my booking') ||
        text.includes('booked room') ||
        (text.includes('booking') && (text.includes('show') || text.includes('view') || text.includes('check') || text.includes('status')))
    ) {
        const result = await getUserBookingsTool({ userId: user?.id });
        if (result.isGuest) {
            return {
                reply: `**Sign-in Required**\n\nTo view your personal bookings and active reservations, please log in to your StayHub account.\n\nOnce logged in, I can display your trip dates, booking status, payment receipts, and property details.`,
                cards: [],
                cardType: null,
                suggestions: ['Log in to StayHub', 'Find stays in Goa', 'Explore top cities', 'How does booking work?']
            };
        }

        if (!result.bookings || result.bookings.length === 0) {
            return {
                reply: `**No Active Bookings Found**\n\nYou do not have any active or upcoming bookings yet. Let me know where you would like to travel (e.g., *"Show me villas in Goa"* or *"Apartments in Mumbai under ₹3000"*), and I will find stays for you.`,
                cards: [],
                cardType: null,
                suggestions: ['Find villas in Goa', 'Stays in Mumbai', 'Top rated stays', 'Explore destinations']
            };
        }

        cards = result.bookings;
        cardType = 'bookings';
        reply = `**Your Bookings (${result.count} found):**\n\nHere are your reservation records from the backend:`;

        return {
            reply,
            cards,
            cardType,
            suggestions: ['Find stays in Goa', 'Show my wishlist', 'Cancellation policy', 'Contact host']
        };
    }

    // 2. Check for Wishlist Intent
    if (
        text.includes('wishlist') ||
        text.includes('saved stays') ||
        text.includes('favorite') ||
        text.includes('saved property')
    ) {
        const result = await getUserWishlistTool({ userId: user?.id });
        if (result.isGuest) {
            return {
                reply: `**Sign-in Required**\n\nPlease log in to view and manage your saved wishlist properties.`,
                cards: [],
                cardType: null,
                suggestions: ['Log in to StayHub', 'Search rooms in Mumbai', 'Explore destinations']
            };
        }

        if (!result.wishlist || result.wishlist.length === 0) {
            return {
                reply: `**Your Wishlist is Empty**\n\nYou have not saved any stays to your wishlist yet. Click the heart icon on any property card while browsing to save it for quick access.`,
                cards: [],
                cardType: null,
                suggestions: ['Explore stays in Goa', 'Apartments in Mumbai', 'Villas in Jaipur', 'Budget stays under ₹2000']
            };
        }

        cards = result.wishlist;
        cardType = 'rooms';
        reply = `**Your Saved Wishlist Stays (${result.count} stays):**\n\nHere are the properties saved in your account:`;

        return {
            reply,
            cards,
            cardType,
            suggestions: ['Find more stays in Goa', 'Check my bookings', 'Budget stays']
        };
    }

    // 3. Check for Host / Earnings Intent
    if (
        text.includes('my earning') ||
        text.includes('host earning') ||
        text.includes('my properties') ||
        text.includes('my listing') ||
        text.includes('how much i made') ||
        text.includes('host stat') ||
        text.includes('booked properties')
    ) {
        const result = await getHostStatsTool({ userId: user?.id });
        if (result.isGuest) {
            return {
                reply: `**Host Portal**\n\nPlease log in with your StayHub host account to check your listed properties and earnings overview.`,
                cards: [],
                cardType: null,
                suggestions: ['Log in', 'How to become a host?', 'Search stays']
            };
        }

        if (!result.isOwner) {
            return {
                reply: `**Become a StayHub Host**\n\n${result.message}\n\n**Host Benefits:**\n- Earn income by renting out your space\n- Full control over pricing and calendar availability\n- Fast payouts directly to your account`,
                cards: [],
                cardType: null,
                suggestions: ['How to host a room?', 'Find stays in Goa', 'Check destinations']
            };
        }

        reply = `**Host Dashboard & Earnings Overview:**\n\n- **Total Listings:** ${result.totalListings} (${result.activeListings} active)\n- **Total Bookings Received:** ${result.totalBookings} (${result.confirmedBookings} confirmed)\n- **Total Revenue Earned:** ₹${result.totalEarningsINR.toLocaleString('en-IN')}\n\nYou can manage your properties anytime from the Dashboard.`;

        return {
            reply,
            cards: result.properties || [],
            cardType: 'host_properties',
            suggestions: ['View my properties', 'Check guest bookings', 'Add new property', 'Hosting tips']
        };
    }

    // 4. Check for Cities / Destinations Intent
    if (
        text.includes('cities') ||
        text.includes('destinations') ||
        text.includes('where can i travel') ||
        text.includes('where can i go') ||
        text.includes('popular places') ||
        text.includes('available locations')
    ) {
        const result = await getAvailableCitiesTool();
        if (result.cities && result.cities.length > 0) {
            cards = result.cities;
            cardType = 'cities';
            reply = `**Popular Destinations on StayHub:**\n\nWe have verified stays available across these destinations:`;
            return {
                reply,
                cards,
                cardType,
                suggestions: result.cities.slice(0, 4).map(c => `Stays in ${c.name}`)
            };
        }
    }

    // 5. Check for FAQ / Platform Policy Intent
    if (
        text.includes('cancel') ||
        text.includes('refund') ||
        text.includes('pay') ||
        text.includes('razorpay') ||
        text.includes('how to book') ||
        text.includes('become a host') ||
        text.includes('checkin') ||
        text.includes('check in') ||
        text.includes('checkout') ||
        text.includes('safety')
    ) {
        let topic = 'booking';
        if (text.includes('cancel') || text.includes('refund')) topic = 'cancellation';
        else if (text.includes('pay') || text.includes('razorpay')) topic = 'payment';
        else if (text.includes('host') || text.includes('list')) topic = 'hosting';
        else if (text.includes('checkin') || text.includes('check-in') || text.includes('checkout')) topic = 'checkin';
        else if (text.includes('safe') || text.includes('verify')) topic = 'safety';

        const faq = getPlatformFaqTool({ topic });
        reply = `**${faq.title}**\n\n${faq.content}`;
        return {
            reply,
            cards: [],
            cardType: null,
            suggestions: ['Find stays in Goa', 'Budget stays under ₹2000', 'Check my bookings', 'Explore cities']
        };
    }

    // 6. Natural Language Search Parameter Extraction
    const propTypes = ['apartment', 'villa', 'hotel', 'resort', 'cottage', 'house', 'hostel'];
    let matchedPropType = propTypes.find(type => text.includes(type));

    let matchedRoomType = null;
    if (text.includes('entire') || text.includes('whole house') || text.includes('full place')) matchedRoomType = 'entire_place';
    else if (text.includes('private room') || text.includes('single room')) matchedRoomType = 'private_room';
    else if (text.includes('shared room') || text.includes('dorm')) matchedRoomType = 'shared_room';

    let maxPrice = null;
    let minPrice = null;

    const underMatch = text.match(/(?:under|below|less than|max(?:imum)?|budget of|within)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
    if (underMatch) maxPrice = parseInt(underMatch[1], 10);

    const aboveMatch = text.match(/(?:above|more than|min(?:imum)?|at least)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
    if (aboveMatch) minPrice = parseInt(aboveMatch[1], 10);

    const rangeMatch = text.match(/between\s*(?:₹|rs\.?|inr)?\s*(\d+)\s*(?:and|to|-)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
    if (rangeMatch) {
        minPrice = parseInt(rangeMatch[1], 10);
        maxPrice = parseInt(rangeMatch[2], 10);
    }

    if (!maxPrice && (text.includes('cheap') || text.includes('budget') || text.includes('affordable'))) {
        maxPrice = 2500;
    }
    if (!minPrice && (text.includes('luxury') || text.includes('premium') || text.includes('high end'))) {
        minPrice = 5000;
    }

    let guests = null;
    const guestMatch = text.match(/(\d+)\s*(?:people|guests|persons|adults)/i);
    if (guestMatch) guests = parseInt(guestMatch[1], 10);

    const amenityKeywords = ['wifi', 'parking', 'ac', 'gym', 'laundry', 'balcony', 'pool'];
    const matchedAmenities = amenityKeywords.filter(amenity => text.includes(amenity));

    let detectedCity = null;
    const cityList = ['goa', 'mumbai', 'delhi', 'bengaluru', 'bangalore', 'jaipur', 'manali', 'pune', 'kolkata', 'chennai', 'hyderabad', 'udaipur', 'shimla', 'agra', 'kochi', 'rishikesh', 'pondicherry', 'varanasi'];
    for (const city of cityList) {
        if (text.includes(city)) {
            detectedCity = city === 'bangalore' ? 'bengaluru' : city;
            break;
        }
    }

    if (!detectedCity) {
        const locMatch = text.match(/(?:in|at|near|around|visit|stay at)\s+([a-zA-Z]{3,20})/i);
        if (locMatch) {
            const candidate = locMatch[1].toLowerCase();
            const ignoredWords = ['hotel', 'villa', 'apartment', 'resort', 'cottage', 'hostel', 'place', 'house', 'stay', 'the', 'my', 'a', 'an', 'some'];
            if (!ignoredWords.includes(candidate)) {
                detectedCity = candidate;
            }
        }
    }

    let sort = 'rating_desc';
    if (text.includes('cheapest') || text.includes('lowest price') || text.includes('price low')) sort = 'price_asc';
    else if (text.includes('most expensive') || text.includes('price high')) sort = 'price_desc';
    else if (text.includes('top rated') || text.includes('best rated') || text.includes('highest rating')) sort = 'rating_desc';
    else if (text.includes('newest') || text.includes('latest')) sort = 'newest';

    const searchResult = await searchRoomsTool({
        city: detectedCity,
        propertyType: matchedPropType,
        roomType: matchedRoomType,
        minPrice,
        maxPrice,
        guests,
        amenities: matchedAmenities,
        sort,
        limit: 6
    });

    if (searchResult.rooms && searchResult.rooms.length > 0) {
        cards = searchResult.rooms;
        cardType = 'rooms';

        const filterSummary = [];
        if (detectedCity) filterSummary.push(`in **${detectedCity.charAt(0).toUpperCase() + detectedCity.slice(1)}**`);
        if (matchedPropType) filterSummary.push(`**${matchedPropType}s**`);
        if (maxPrice && minPrice) filterSummary.push(`between **₹${minPrice} - ₹${maxPrice}/night**`);
        else if (maxPrice) filterSummary.push(`under **₹${maxPrice}/night**`);
        else if (minPrice) filterSummary.push(`above **₹${minPrice}/night**`);
        if (matchedAmenities.length > 0) filterSummary.push(`with **${matchedAmenities.join(', ')}**`);

        const criteriaStr = filterSummary.length > 0 ? filterSummary.join(' ') : 'top rated stays';
        reply = `**Found ${searchResult.totalFound} matching stays ${criteriaStr}:**\n\nHere are our top recommendations based on your query:`;

        return {
            reply,
            cards,
            cardType,
            suggestions: [
                'Sort by price: Low to High',
                'Show stays with WiFi & AC',
                'Check my bookings',
                'Explore other cities'
            ]
        };
    }

    if (detectedCity || matchedPropType || maxPrice) {
        const broadResult = await searchRoomsTool({ limit: 4, sort: 'rating_desc' });
        cards = broadResult.rooms || [];
        cardType = 'rooms';
        reply = `I could not find exact matches for your specific criteria ${detectedCity ? `in *${detectedCity}*` : ''}.\n\nHere are our **highest-rated popular stays** across other destinations:`;
        return {
            reply,
            cards,
            cardType,
            suggestions: ['Explore all destinations', 'Villas in Goa', 'Apartments in Mumbai', 'How to book?']
        };
    }

    // Default friendly conversational response
    return {
        reply: `**Hello, I am StayBot, your StayHub AI assistant.**\n\nI can query live database records to help you with:\n\n- **Search stays:** *"Find villas in Goa with pool and wifi under ₹6000"*\n- **Budget stays:** *"Show apartments in Mumbai under ₹3000"*\n- **Your bookings:** *"What are my upcoming trips?"*\n- **Wishlist:** *"Show my saved properties"*\n- **Host stats:** *"What are my earnings this month?"*\n- **Assistance:** *"How does payment and cancellation work?"*\n\nHow can I help you today?`,
        cards: [],
        cardType: null,
        suggestions: [
            'Villas in Goa under ₹5000',
            'Apartments in Mumbai',
            'Check my bookings',
            'My Wishlist',
            'Top rated stays'
        ]
    };
};


// MAIN ENTRY POINT: PROCESS USER MESSAGE

export const processChatMessage = async ({ message, history = [], user = null }) => {
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.AI_API_KEY;

    // If Gemini API Key is available, leverage Gemini LLM with function calling
    if (geminiApiKey && geminiApiKey.trim() !== '') {
        try {
            const genAI = new GoogleGenerativeAI(geminiApiKey.trim());
            const model = genAI.getGenerativeModel({
                model: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
                systemInstruction: `You are StayBot, the AI Concierge for StayHub (a vacation rental platform).
You have direct access to database tools to answer real-time queries about stays, rooms, bookings, user wishlists, host earnings, and platform policies.

RULES:
1. Always call the appropriate tool when the user asks about stays, prices, cities, their bookings, wishlist, or host earnings.
2. Provide concise, helpful responses formatted in clean Markdown with clear bold headings and bullet points. Do NOT use emojis.
3. Pricing is in Indian Rupees (₹).
4. If a user is not logged in and asks about personal data (bookings, wishlist, host stats), inform them to log in.
5. Highlight key amenities, location, and ratings when recommending stays.`,
                tools: [{ functionDeclarations: geminiToolDeclarations }]
            });

            // Gemini chat history must begin with a user message and cannot
            // contain consecutive messages from the same role. The UI may
            // persist a bot greeting as the first message, so normalize it
            // before creating the chat session.
            const geminiHistory = [];
            for (const msg of Array.isArray(history) ? history.slice(-6) : []) {
                const text = typeof msg?.text === 'string' ? msg.text.trim() : '';
                if (!text) continue;

                const role = msg.sender === 'user' ? 'user' : 'model';
                const previous = geminiHistory[geminiHistory.length - 1];

                if (previous?.role === role) {
                    previous.parts[0].text += `\n${text}`;
                } else {
                    geminiHistory.push({
                        role,
                        parts: [{ text }]
                    });
                }
            }

            while (geminiHistory[0]?.role === 'model') {
                geminiHistory.shift();
            }

            const chat = model.startChat({
                history: geminiHistory
            });

            // Send message and handle tool calling loop
            let result = await withRetry(() => chat.sendMessage(message), 'Gemini');
            let response = result.response;
            let functionCalls = response.functionCalls ? response.functionCalls() : null;

            let toolResultsCards = [];
            let toolCardType = null;

            // Execute function calls if requested by the model
            if (functionCalls && functionCalls.length > 0) {
                const call = functionCalls[0];
                const { name, args } = call;
                let functionResponseData = {};

                if (name === 'searchRooms') {
                    const searchRes = await searchRoomsTool(args);
                    functionResponseData = searchRes;
                    toolResultsCards = searchRes.rooms || [];
                    toolCardType = 'rooms';
                } else if (name === 'getRoomDetails') {
                    const roomRes = await getRoomDetailsTool(args);
                    functionResponseData = roomRes;
                    if (roomRes.id) {
                        toolResultsCards = [roomRes];
                        toolCardType = 'rooms';
                    }
                } else if (name === 'getUserBookings') {
                    const bookRes = await getUserBookingsTool({ userId: user?.id, ...args });
                    functionResponseData = bookRes;
                    toolResultsCards = bookRes.bookings || [];
                    toolCardType = 'bookings';
                } else if (name === 'getUserWishlist') {
                    const wishRes = await getUserWishlistTool({ userId: user?.id });
                    functionResponseData = wishRes;
                    toolResultsCards = wishRes.wishlist || [];
                    toolCardType = 'rooms';
                } else if (name === 'getHostStats') {
                    const hostRes = await getHostStatsTool({ userId: user?.id });
                    functionResponseData = hostRes;
                    toolResultsCards = hostRes.properties || [];
                    toolCardType = 'host_properties';
                } else if (name === 'getAvailableCities') {
                    const cityRes = await getAvailableCitiesTool();
                    functionResponseData = cityRes;
                    toolResultsCards = cityRes.cities || [];
                    toolCardType = 'cities';
                } else if (name === 'getPlatformFaq') {
                    functionResponseData = getPlatformFaqTool(args);
                }

                // The current Gemini endpoint rejects the SDK's generated
                // `function` role for functionResponse parts. Send the tool
                // result as user context instead, which is supported by all
                // configured Gemini models.
                const secondResult = await withRetry(() => chat.sendMessage(
                    `Tool result for ${name}. Use this data to answer the user's request accurately:\n${JSON.stringify(functionResponseData)}`
                ), 'Gemini');

                const finalReply = stripEmojis(secondResult.response.text());
                return {
                    reply: finalReply,
                    cards: toolResultsCards,
                    cardType: toolCardType,
                    suggestions: generateContextualSuggestions({ cardType: toolCardType, user }),
                    timestamp: new Date().toISOString()
                };
            }

            // Normal text response from Gemini
            return {
                reply: stripEmojis(response.text()),
                cards: [],
                cardType: null,
                suggestions: generateContextualSuggestions({ cardType: null, user }),
                timestamp: new Date().toISOString()
            };

        } catch (llmError) {
            console.warn('Gemini LLM error, falling back to dynamic NLP engine:', llmError.message);
        }
    }

    // Fast, highly accurate fallback dynamic parser
    const fallbackResult = await parseIntentAndExecute({ message, user });
    return {
        ...fallbackResult,
        reply: stripEmojis(fallbackResult.reply),
        suggestions: (fallbackResult.suggestions || []).map(stripEmojis),
        timestamp: new Date().toISOString()
    };
};

/**
 * Generate quick reply suggestion pills
 */
export const generateContextualSuggestions = ({ cardType, user } = {}) => {
    let list = [];
    if (cardType === 'rooms') {
        list = [
            'Sort by price: Low to High',
            'Under ₹3000 only',
            'Show with WiFi & AC',
            'Villas with Pool'
        ];
    } else if (cardType === 'bookings') {
        list = [
            'Cancellation policy',
            'Find stays in Goa',
            'Show my wishlist',
            'Explore top destinations'
        ];
    } else if (cardType === 'cities') {
        list = [
            'Stays in Goa',
            'Stays in Mumbai',
            'Stays in Jaipur',
            'Stays in Manali'
        ];
    } else {
        list = [
            'Villas in Goa under ₹5000',
            'Apartments in Mumbai',
            'Top rated stays'
        ];

        if (user) {
            list.push('Check my bookings', 'My Wishlist');
            if (user.role === 'owner') {
                list.push('My host earnings');
            }
        } else {
            list.push('How does booking work?');
        }
    }

    return list.map(stripEmojis);
};
