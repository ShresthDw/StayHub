// features/rooms/roomController.js
import Room from '../../models/Room.js';
import Booking from '../../models/Booking.js';

// In-memory cache for home feed (TTL: 45s)
let homeFeedCache = null;
let homeFeedCacheTime = 0;
const CACHE_TTL_MS = 45 * 1000;

export const invalidateHomeFeedCache = () => {
    homeFeedCache = null;
    homeFeedCacheTime = 0;
};

// Helper function to check if a room is available for a date range
const isRoomAvailable = async (roomId, checkInDate, checkOutDate) => {
    try {
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);

        const conflictingBooking = await Booking.findOne({
            roomId,
            status: 'confirmed',
            $expr: {
                $not: {
                    $or: [
                        { $lt: [new Date('$checkOutDate'), checkIn] },
                        { $gte: [new Date('$checkInDate'), checkOut] }
                    ]
                }
            }
        });

        return !conflictingBooking;
    } catch (err) {
        console.error('Error checking room availability:', err);
        return true;
    }
};

// GET /api/rooms
export const getRooms = async (req, res) => {
    const { page = 1, limit = 10, lat, lng, maxDistance, propertyType, amenities, isActive, hostId, checkInDate, checkOutDate, city } = req.query;

    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (propertyType) query.propertyType = propertyType;
    if (amenities) query.amenities = { $all: amenities.split(',') };
    if (hostId) query.hostId = hostId;
    if (city) query['address.city'] = { $regex: city, $options: 'i' };

    try {
        const pageNum = Math.max(1, parseInt(page) || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(limit) || 20));
        const skip = (pageNum - 1) * pageSize;

        const projectionFields = 'title propertyType address location images pricePerNight rating reviewCount maxGuests hostId';
        
        if (!lat || !lng || !maxDistance) {
            let dbQuery = Room.find(query)
                .select(projectionFields)
                .populate('hostId', 'name email phone avatar')
                .limit(pageSize)
                .skip(skip)
                .lean();
            
            const [rooms, total] = await Promise.all([
                dbQuery,
                Room.countDocuments(query)
            ]);
            let allRooms = rooms;

            if (checkInDate && checkOutDate) {
                const availableRooms = [];
                for (const room of allRooms) {
                    const isAvailable = await isRoomAvailable(room._id, checkInDate, checkOutDate);
                    if (isAvailable) {
                        availableRooms.push(room);
                    }
                }
                allRooms = availableRooms;
            }

            return res.status(200).json({
                rooms: allRooms,
                pagination: {
                    page: pageNum,
                    limit: pageSize,
                    total,
                    pages: Math.ceil(total / pageSize)
                }
            });
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const maxDistKm = parseFloat(maxDistance);

        if (isNaN(userLat) || isNaN(userLng) || isNaN(maxDistKm) || maxDistKm <= 0) {
            console.error('Invalid location parameters');
            return res.status(400).json({ message: 'Invalid location or distance parameters' });
        }

        const geoQuery = {
            ...query,
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [userLng, userLat]
                    },
                    $maxDistance: maxDistKm * 1000
                }
            }
        };

        let nearbyRooms = await Room.find(geoQuery)
            .select(projectionFields)
            .populate('hostId', 'name email phone avatar')
            .lean();

        if (checkInDate && checkOutDate) {
            const availableRooms = [];
            for (const room of nearbyRooms) {
                const isAvailable = await isRoomAvailable(room._id, checkInDate, checkOutDate);
                if (isAvailable) {
                    availableRooms.push(room);
                }
            }
            nearbyRooms = availableRooms;
        }

        const total = nearbyRooms.length;
        const paginatedRooms = nearbyRooms.slice(skip, skip + pageSize);

        return res.status(200).json({
            rooms: paginatedRooms,
            pagination: {
                page: pageNum,
                limit: pageSize,
                total,
                pages: Math.ceil(total / pageSize)
            }
        });

    } catch (err) {
        console.error('ERROR in GET /api/rooms:', err.message, err.stack);
        res.status(500).json({ message: 'Failed to fetch rooms' });
    }
};

// POST /api/rooms/add
export const addRoom = async (req, res) => {
    if (req.user.role !== 'owner') {
        return res.status(403).json({ msg: 'Only owners can add rooms' });
    }
    if (!req.user.verified) {
        return res.status(403).json({ msg: 'Account is not verified' });
    }

    try {
        const { title, description, pricePerNight, address, latitude, longitude, location, maxGuests, bedrooms, beds, bathrooms, images, propertyType, roomType, amenities, availabilityType, isActive } = req.body;

        if (!title || !description || !pricePerNight || !propertyType) {
            return res.status(400).json({ msg: 'Missing required fields: title, description, pricePerNight, propertyType' });
        }

        let locationData;
        if (location && location.coordinates && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
            locationData = location;
        } else if (typeof latitude === 'number' && typeof longitude === 'number') {
            locationData = { type: 'Point', coordinates: [longitude, latitude] };
        } else {
            return res.status(400).json({ msg: 'Valid coordinates are required (either location or latitude/longitude)' });
        }

        if (!Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ msg: 'At least one image URL is required' });
        }

        const room = new Room({
            hostId: req.user.id,
            title,
            description,
            pricePerNight,
            address,
            maxGuests,
            bedrooms,
            beds,
            bathrooms,
            location: locationData,
            images,
            propertyType,
            roomType,
            amenities: Array.isArray(amenities) ? amenities : [],
            availabilityType,
            isActive: isActive !== false
        });

        await room.save();
        invalidateHomeFeedCache();
        res.status(201).json({ msg: 'Room added', room });

    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ msg: messages.join('; ') });
        }
        console.error('ERROR in POST /api/rooms/add:', err);
        res.status(500).json({ message: 'Failed to add room' });
    }
};

// PUT /api/rooms/edit/:id
export const editRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ msg: 'Room not found' });
        }
        
        if (String(room.hostId) !== String(req.user.id)) {
            return res.status(403).json({ msg: 'Not authorized to edit this room' });
        }

        const { title, description, pricePerNight, address, latitude, longitude, maxGuests, bedrooms, beds, bathrooms, images, propertyType, roomType, amenities, availabilityType, isActive } = req.body;

        const update = {};
        if (title !== undefined) update.title = title;
        if (description !== undefined) update.description = description;
        if (pricePerNight !== undefined) update.pricePerNight = pricePerNight;
        if (address !== undefined) update.address = address;
        if (maxGuests !== undefined) update.maxGuests = maxGuests;
        if (bedrooms !== undefined) update.bedrooms = bedrooms;
        if (beds !== undefined) update.beds = beds;
        if (bathrooms !== undefined) update.bathrooms = bathrooms;
        if (images !== undefined) update.images = images;
        if (propertyType !== undefined) update.propertyType = propertyType;
        if (roomType !== undefined) update.roomType = roomType;
        if (amenities !== undefined) update.amenities = amenities;
        if (availabilityType !== undefined) update.availabilityType = availabilityType;
        if (isActive !== undefined) update.isActive = isActive;

        if (latitude !== undefined && longitude !== undefined) {
            update.location = { type: 'Point', coordinates: [longitude, latitude] };
        }

        const updatedRoom = await Room.findByIdAndUpdate(
            req.params.id,
            { $set: update },
            { new: true, runValidators: true }
        );

        invalidateHomeFeedCache();
        res.status(200).json({ msg: 'Room updated', room: updatedRoom });

    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ msg: messages.join('; ') });
        }
        console.error('ERROR in PUT /api/rooms/edit:', err);
        res.status(500).json({ message: 'Failed to update room' });
    }
};

// DELETE /api/rooms/delete/:id
export const deleteRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ msg: 'Room not found' });
        }
        if (String(room.hostId) !== String(req.user.id)) {
            return res.status(403).json({ msg: 'Not authorized to delete this room' });
        }

        await Room.findByIdAndDelete(req.params.id);
        invalidateHomeFeedCache();
        res.status(200).json({ msg: 'Room deleted' });

    } catch (err) {
        console.error('ERROR in DELETE /api/rooms/delete:', err);
        res.status(500).json({ message: 'Failed to delete room' });
    }
};

// GET /api/rooms/:id
export const getRoomById = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id)
            .populate('hostId', 'name email phone')
            .lean(); 

        if (!room) {
            return res.status(404).json({ msg: 'Room not found' });
        }

        res.status(200).json(room);

    } catch (err) {
        console.error('ERROR in GET /api/rooms/:id:', err);
        res.status(500).json({ message: 'Failed to fetch room' });
    }
};

// GET /api/rooms/mine
export const getMyRooms = async (req, res) => {
    try {
        const rooms = await Room.find({ hostId: req.user.id })
            .populate('hostId', 'name email phone')
            .lean();

        res.status(200).json(rooms);

    } catch (err) {
        console.error('ERROR in GET /api/rooms/mine:', err);
        res.status(500).json({ message: 'Failed to fetch your rooms' });
    }
};

// GET /api/rooms/cities/list
export const getCities = async (req, res) => {
    try {
        const cities = await Room.aggregate([
            {
                $match: { isActive: true }
            },
            {
                $group: {
                    _id: '$address.city',
                    count: { $sum: 1 },
                    firstImage: { $first: '$images' }
                }
            },
            {
                $match: { _id: { $ne: null } }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 8
            }
        ]);

        const formattedCities = cities.map(city => ({
            name: city._id,
            count: city.count,
            imageUrl: city.firstImage && city.firstImage.length > 0 
                ? city.firstImage[0].url 
                : `https://placehold.co/400x300?text=${encodeURIComponent(city._id)}`
        }));

        res.status(200).json(formattedCities);

    } catch (err) {
        console.error('ERROR in GET /api/rooms/cities/list:', err);
        res.status(500).json({ message: 'Failed to fetch cities' });
    }
};

// GET /api/rooms/home-feed - Ultra-fast consolidated feed endpoint
export const getHomeFeed = async (req, res) => {
    const now = Date.now();
    if (homeFeedCache && (now - homeFeedCacheTime < CACHE_TTL_MS)) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
        return res.status(200).json(homeFeedCache);
    }

    try {
        const projectionFields = 'title propertyType address location images pricePerNight rating reviewCount maxGuests hostId';
        const PROPERTY_TYPES = ["apartment", "house", "villa", "hotel", "resort", "cottage", "hostel"];

        const [featured, categoryResults, cities] = await Promise.all([
            // Featured listings (limit 6)
            Room.find({ isActive: true })
                .select(projectionFields)
                .populate('hostId', 'name avatar')
                .sort({ rating: -1, createdAt: -1 })
                .limit(6)
                .lean(),

            // Top rooms per property type in parallel
            Promise.all(
                PROPERTY_TYPES.map(async (type) => {
                    const rooms = await Room.find({ isActive: true, propertyType: type })
                        .select(projectionFields)
                        .populate('hostId', 'name avatar')
                        .limit(8)
                        .lean();
                    return { type, rooms };
                })
            ),

            // Top cities
            Room.aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: '$address.city',
                        count: { $sum: 1 },
                        firstImage: { $first: '$images' }
                    }
                },
                { $match: { _id: { $ne: null } } },
                { $sort: { count: -1 } },
                { $limit: 8 }
            ])
        ]);

        const categories = {};
        categoryResults.forEach(item => {
            categories[item.type] = item.rooms;
        });

        const formattedCities = cities.map(city => ({
            name: city._id,
            count: city.count,
            imageUrl: city.firstImage && city.firstImage.length > 0 
                ? city.firstImage[0].url 
                : `https://placehold.co/400x300?text=${encodeURIComponent(city._id)}`
        }));

        const result = {
            featured,
            categories,
            cities: formattedCities
        };

        homeFeedCache = result;
        homeFeedCacheTime = Date.now();

        res.setHeader('X-Cache', 'MISS');
        res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
        res.status(200).json(result);

    } catch (err) {
        console.error('ERROR in GET /api/rooms/home-feed:', err);
        res.status(500).json({ message: 'Failed to fetch home feed' });
    }
};
