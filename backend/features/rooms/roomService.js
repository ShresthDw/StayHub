
import axios from 'axios';
import { QuadTree, Rectangle, Point } from '../../utils/Quadtree.js';

/**
 * Fetch actual road distance between two coordinates using Geoapify API
 * Falls back to Haversine (straight-line) distance if API fails
 */
export const getActualRoadDistance = async (userLat, userLng, roomLat, roomLng) => {
    if (
        typeof userLat !== 'number' ||
        typeof userLng !== 'number' ||
        typeof roomLat !== 'number' ||
        typeof roomLng !== 'number'
    ) {
        return Infinity;
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) {
        // Fallback: use straight-line (Haversine) distance
        const lat1 = userLat * Math.PI / 180;
        const lat2 = roomLat * Math.PI / 180;
        const dlat = (roomLat - userLat) * Math.PI / 180;
        const dlng = (roomLng - userLng) * Math.PI / 180;
        const a = Math.sin(dlat/2) * Math.sin(dlat/2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlng/2) * Math.sin(dlng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = 6371 * c; // Earth radius in km
        return distance;
    }

    const url =
        `https://api.geoapify.com/v1/routing` +
        `?waypoints=${userLat},${userLng}|${roomLat},${roomLng}` +
        `&mode=drive&apiKey=${apiKey}`;

    try {
        const response = await axios.get(url, { timeout: 5000 });
        if (response.data?.features?.length > 0) {
            return response.data.features[0].properties.distance / 1000; // metres → km
        }
        throw new Error('No features in response');
    } catch (err) {
        // Fallback to straight-line (Haversine) distance
        const lat1 = userLat * Math.PI / 180;
        const lat2 = roomLat * Math.PI / 180;
        const dlat = (roomLat - userLat) * Math.PI / 180;
        const dlng = (roomLng - userLng) * Math.PI / 180;
        const a = Math.sin(dlat/2) * Math.sin(dlat/2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlng/2) * Math.sin(dlng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = 6371 * c; // Earth radius in km
        return distance;
    }
};

/**
 * Extract coordinates from room document (supports both GeoJSON and flat fields)
 */
export const getRoomCoordinates = (room) => {
    // Prefer the GeoJSON location field (standard in schema)
    if (
        room?.location?.coordinates?.length === 2 &&
        typeof room.location.coordinates[0] === 'number' &&
        typeof room.location.coordinates[1] === 'number'
    ) {
        return { lng: room.location.coordinates[0], lat: room.location.coordinates[1] };
    }
    // Fallback to flat fields (if they exist)
    if (typeof room.latitude === 'number' && typeof room.longitude === 'number') {
        return { lng: room.longitude, lat: room.latitude };
    }
    // Fallback to geo object (legacy)
    if (
        room?.geo?.coordinates?.length === 2 &&
        typeof room.geo.coordinates[0] === 'number' &&
        typeof room.geo.coordinates[1] === 'number'
    ) {
        return { lng: room.geo.coordinates[0], lat: room.geo.coordinates[1] };
    }
    console.warn(`Room ${room._id} (${room.title}) has no valid coordinates:`, { location: room.location, latitude: room.latitude, longitude: room.longitude });
    return null;
};

/**
 * Filter rooms by distance using QuadTree spatial indexing
 */
export const filterRoomsByDistance = async (allRooms, userLat, userLng, maxDistKm) => {
    // --- QuadTree setup ---
    // Boundary covers the entire globe: center at (0, 0), halfWidth 180, halfHeight 90
    // This creates bounds: lng [-180, 180], lat [-90, 90]
    const boundary = new Rectangle(0, 0, 180, 90);
    const qt = new QuadTree(boundary, 4);

    let roomsWithCoords = 0;
    let roomsWithoutCoords = [];
    let failedInserts = [];
    for (const room of allRooms) {
        const coords = getRoomCoordinates(room);
        if (coords) {
            const point = new Point(coords.lng, coords.lat, room);
            const inserted = qt.insert(point);
            if (inserted) {
                roomsWithCoords++;
            } else {
                failedInserts.push({ title: room.title, lng: coords.lng, lat: coords.lat });
            }
        } else {
            roomsWithoutCoords.push({ id: room._id, title: room.title });
        }
    }
    
    // Convert km → degrees, correcting longitude for latitude
    // 1° latitude  ≈ 111 km (constant)
    // 1° longitude ≈ 111 * cos(lat) km (shrinks toward poles)
    const degreesLat = maxDistKm / 111;
    const degreesLng = maxDistKm / (111 * Math.cos(userLat * Math.PI / 180));

    const searchRange = new Rectangle(userLng, userLat, degreesLng, degreesLat);
    const nearbyRooms = qt.query(searchRange);  // Returns room objects directly (userData)

    if (nearbyRooms.length === 0) {
        return [];
    }

    // Fetch road distances for candidate rooms
    const distances = await Promise.all(
        nearbyRooms.map(room => {
            const coords = getRoomCoordinates(room);
            if (!coords) return Promise.resolve(Infinity);
            return getActualRoadDistance(userLat, userLng, coords.lat, coords.lng);
        })
    );

    const roomsWithDistance = nearbyRooms
        .map((room, i) => {
            // Convert Mongoose document to plain object if needed
            const roomObj = room.toObject ? room.toObject() : room;
            return { ...roomObj, distance: distances[i] };
        })
        .filter(r => r.distance <= maxDistKm);

    // Sort by distance — V8's built-in sort (TimSort, O n log n) is optimal here
    roomsWithDistance.sort((a, b) => a.distance - b.distance);

    return roomsWithDistance;
};
