import express from 'express';
import axios   from 'axios';
import Room    from '../models/Room.js';
import User    from '../models/User.js';
import { QuadTree, Rectangle, Point } from '../utils/Quadtree.js';

const router = express.Router();

/* ===================================================
   MOCK AUTH  (replace with real JWT middleware later)
   Now performs a DB lookup to verify the user exists
   and trusts the role from the DB, not the header.
   =================================================== */
const mockAuth = async (req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({ msg: 'Authentication required' });
    }

    try {
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(401).json({ msg: 'User not found' });
        }
        // Role comes from DB — client cannot spoof it
        req.user = { id: user._id.toString(), role: user.role, verified: user.verified };
        next();
    } catch (err) {
        return res.status(401).json({ msg: 'Invalid user ID' });
    }
};

/* ===================================================
   GEOAPIFY ROAD DISTANCE
   =================================================== */
const getActualRoadDistance = async (userLat, userLng, roomLat, roomLng) => {
    if (
        typeof userLat  !== 'number' ||
        typeof userLng  !== 'number' ||
        typeof roomLat  !== 'number' ||
        typeof roomLng  !== 'number'
    ) return Infinity;

    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) return Infinity;

    const url =
        `https://api.geoapify.com/v1/routing` +
        `?waypoints=${userLat},${userLng}|${roomLat},${roomLng}` +
        `&mode=drive&apiKey=${apiKey}`;

    try {
        const response = await axios.get(url);
        if (response.data?.features?.length > 0) {
            return response.data.features[0].properties.distance / 1000; // metres → km
        }
        return Infinity;
    } catch {
        return Infinity;
    }
};

/* ===================================================
   COORDINATE HELPER
   =================================================== */
const getRoomCoordinates = room => {
    // Prefer the GeoJSON field (now properly in the schema)
    if (
        room?.geo?.coordinates?.length === 2 &&
        typeof room.geo.coordinates[0] === 'number' &&
        typeof room.geo.coordinates[1] === 'number'
    ) {
        return { lng: room.geo.coordinates[0], lat: room.geo.coordinates[1] };
    }
    // Fallback to flat fields
    if (typeof room.latitude === 'number' && typeof room.longitude === 'number') {
        return { lng: room.longitude, lat: room.latitude };
    }
    return null;
};

/* ===================================================
   GET /api/rooms
   Query params: lat, lng, maxDistance, type, facilities, status, owner
   =================================================== */
router.get('/', async (req, res) => {
    const { lat, lng, maxDistance, type, facilities, status, owner } = req.query;

    const query = {};
    if (status)     query.status = status;
    if (type)       query.type   = type;
    if (facilities) query.facilities = { $all: facilities.split(',') };
    if (owner)      query.owner  = owner;   // Server-side owner filter

    try {
        const allRooms = await Room.find(query)
            .populate('owner', 'name email phone')
            .lean();

        // No location filter requested → return as-is
        if (!lat || !lng || !maxDistance) {
            return res.status(200).json(allRooms);
        }

        const userLat    = parseFloat(lat);
        const userLng    = parseFloat(lng);
        const maxDistKm  = parseFloat(maxDistance);

        if (isNaN(userLat) || isNaN(userLng) || isNaN(maxDistKm) || maxDistKm <= 0) {
            return res.status(400).json({ message: 'Invalid location or distance parameters' });
        }

        // --- QuadTree setup ---
        // Boundary covers the entire globe: origin at (-180, -90), width 360, height 180
        const boundary = new Rectangle(-180, -90, 360, 180);
        const qt       = new QuadTree(boundary, 4);

        for (const room of allRooms) {
            const coords = getRoomCoordinates(room);
            if (coords) {
                qt.insert(new Point(coords.lng, coords.lat, room));
            }
        }

        // Convert km → degrees, correcting longitude for latitude
        // 1° latitude  ≈ 111 km (constant)
        // 1° longitude ≈ 111 * cos(lat) km (shrinks toward poles)
        const degreesLat = maxDistKm / 111;
        const degreesLng = maxDistKm / (111 * Math.cos(userLat * Math.PI / 180));

        const searchRange  = new Rectangle(userLng - degreesLng, userLat - degreesLat, degreesLng * 2, degreesLat * 2);
        const nearbyPoints = qt.query(searchRange);

        // Fetch road distances for candidate rooms
        const distances = await Promise.all(
            nearbyPoints.map(p => {
                const coords = getRoomCoordinates(p.data);
                if (!coords) return Promise.resolve(Infinity);
                return getActualRoadDistance(userLat, userLng, coords.lat, coords.lng);
            })
        );

        const roomsWithDistance = nearbyPoints
            .map((p, i) => ({ ...p.data, distance: distances[i] }))
            .filter(r => r.distance <= maxDistKm);

        // Sort by distance — V8's built-in sort (TimSort, O n log n) is optimal here
        roomsWithDistance.sort((a, b) => a.distance - b.distance);

        return res.status(200).json(roomsWithDistance);

    } catch (err) {
        console.error('ERROR in GET /api/rooms:', err);
        res.status(500).json({ message: 'Failed to fetch rooms' });
    }
});

/* ===================================================
   POST /api/rooms/add
   =================================================== */
router.post('/add', mockAuth, async (req, res) => {
    if (req.user.role !== 'owner') {
        return res.status(403).json({ msg: 'Only owners can add rooms' });
    }
    if (!req.user.verified) {
        return res.status(403).json({ msg: 'Account is not verified' });
    }

    try {
        const { title, description, price, location, latitude, longitude, capacity, images, type, facilities, status } = req.body;

        // --- Input validation ---
        if (!title || !description || !location || !type) {
            return res.status(400).json({ msg: 'Missing required fields' });
        }
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return res.status(400).json({ msg: 'Valid latitude and longitude are required' });
        }
        if (!Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ msg: 'At least one image URL is required' });
        }

        const room = new Room({
            owner:       req.user.id,
            title,
            description,
            price,
            location,
            latitude,
            longitude,
            geo:         { type: 'Point', coordinates: [longitude, latitude] },
            capacity,
            images,
            type,
            facilities:  Array.isArray(facilities) ? facilities : [],
            status:      status || 'inactive'
        });

        await room.save();
        res.status(201).json({ msg: 'Room added', room });

    } catch (err) {
        // Surface Mongoose validation errors clearly
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ msg: messages.join('; ') });
        }
        console.error('ERROR in POST /api/rooms/add:', err);
        res.status(500).json({ message: 'Failed to add room' });
    }
});

/* ===================================================
   PUT /api/rooms/edit/:id
   =================================================== */
router.put('/edit/:id', mockAuth, async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ msg: 'Room not found' });
        }
        // Ownership check: compare stringified ObjectIds from DB — no header trust
        if (String(room.owner) !== String(req.user.id)) {
            return res.status(403).json({ msg: 'Not authorized to edit this room' });
        }

        const { title, description, price, location, latitude, longitude, capacity, images, type, facilities, status } = req.body;

        // Build update object — only include fields that were actually sent
        const update = {};
        if (title       !== undefined) update.title       = title;
        if (description !== undefined) update.description = description;
        if (price       !== undefined) update.price       = price;
        if (location    !== undefined) update.location    = location;
        if (capacity    !== undefined) update.capacity    = capacity;
        if (images      !== undefined) update.images      = images;
        if (type        !== undefined) update.type        = type;
        if (facilities  !== undefined) update.facilities  = facilities;
        if (status      !== undefined) update.status      = status;

        // Only update geo if both coordinates are provided
        if (latitude !== undefined && longitude !== undefined) {
            update.latitude  = latitude;
            update.longitude = longitude;
            update.geo       = { type: 'Point', coordinates: [longitude, latitude] };
        }

        const updatedRoom = await Room.findByIdAndUpdate(
            req.params.id,
            { $set: update },
            { new: true, runValidators: true }   // runValidators ensures schema validators fire on update
        );

        res.status(200).json({ msg: 'Room updated', room: updatedRoom });

    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ msg: messages.join('; ') });
        }
        console.error('ERROR in PUT /api/rooms/edit:', err);
        res.status(500).json({ message: 'Failed to update room' });
    }
});

/* ===================================================
   DELETE /api/rooms/delete/:id
   =================================================== */
router.delete('/delete/:id', mockAuth, async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ msg: 'Room not found' });
        }
        if (String(room.owner) !== String(req.user.id)) {
            return res.status(403).json({ msg: 'Not authorized to delete this room' });
        }

        await Room.findByIdAndDelete(req.params.id);
        res.status(200).json({ msg: 'Room deleted' });

    } catch (err) {
        console.error('ERROR in DELETE /api/rooms/delete:', err);
        res.status(500).json({ message: 'Failed to delete room' });
    }
});

export default router;