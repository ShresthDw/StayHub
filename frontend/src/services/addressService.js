/**
 * Frontend service for address parsing
 * Communicates with backend reverse geocoding endpoint
 */

// RTK Query hook for reverse geocoding
export { useReverseGeocodeAddressQuery } from '../api/apiSlice.js';
import { API_BASE_URL } from '../constants.jsx';

// Direct async function for use in event handlers (not through RTK Query)
export const reverseGeocodeAddress = async (lat, lng) => {
    try {
        const response = await fetch(`${API_BASE_URL}/address/reverse-geocode?lat=${lat}&lng=${lng}`);
        if (!response.ok) throw new Error('Failed to reverse geocode');
        const data = await response.json();
        return data.address || null;
    } catch (err) {
        console.error('Reverse geocoding error:', err);
        throw err;
    }
};

