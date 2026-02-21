/**
 * Frontend service for address parsing
 * Communicates with backend reverse geocoding endpoint
 */

// RTK Query hook for reverse geocoding
export { useReverseGeocodeAddressQuery } from '../api/apiSlice.js';

// Direct async function for use in event handlers (not through RTK Query)
export const reverseGeocodeAddress = async (lat, lng) => {
    try {
        const response = await fetch(`/api/address/reverse-geocode?lat=${lat}&lng=${lng}`);
        if (!response.ok) throw new Error('Failed to reverse geocode');
        const data = await response.json();
        return data.address || null;
    } catch (err) {
        console.error('Reverse geocoding error:', err);
        throw err;
    }
};

/**
 * Format address object for display
 */
export const formatAddressForDisplay = (address) => {
    if (!address) return '';
    if (typeof address === 'string') return address;
    
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.country) parts.push(address.country);
    if (address.zipCode) parts.push(address.zipCode);
    
    return parts.filter(Boolean).join(', ');
};

/**
 * Extract city name from address object
 */
export const getCityFromAddress = (address) => {
    if (!address) return '';
    if (typeof address === 'string') return address;
    return address.city || '';
};
