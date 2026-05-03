/**
 * Frontend service for address parsing
 * Communicates with backend reverse geocoding endpoint, with client Geoapify and OpenStreetMap fallbacks
 */
import { API_BASE_URL } from '../constants.jsx';

// Direct async function for use in event handlers
export const reverseGeocodeAddress = async (lat, lng, fallbackApiKey) => {
    if (!lat || !lng) return null;

    // 1. Try backend endpoint first
    try {
        const response = await fetch(`${API_BASE_URL}/address/reverse-geocode?lat=${lat}&lng=${lng}`);
        if (response.ok) {
            const data = await response.json();
            const address = data.address || data;
            if (address && (address.city || address.street || address.country || address.state)) {
                return {
                    street: address.street || '',
                    city: address.city || '',
                    state: address.state || '',
                    country: address.country || '',
                    zipCode: address.zipCode || ''
                };
            }
        }
    } catch (err) {
        console.warn('Backend reverse geocode attempt failed, using fallback:', err);
    }

    // 2. Client fallback: Geoapify direct if API key is provided
    if (fallbackApiKey) {
        try {
            const res = await fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${fallbackApiKey}`);
            if (res.ok) {
                const data = await res.json();
                if (data.features && data.features.length > 0) {
                    const props = data.features[0].properties;
                    return {
                        street: props.address_line1 || props.street || '',
                        city: props.city || props.town || props.village || props.county || '',
                        state: props.state || props.province || '',
                        country: props.country || '',
                        zipCode: props.postcode || ''
                    };
                }
            }
        } catch (err) {
            console.warn('Geoapify client reverse geocode failed:', err);
        }
    }

    // 3. Universal Fallback: OpenStreetMap Nominatim (No key required)
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
            headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            return {
                street: [addr.road, addr.house_number].filter(Boolean).join(' ') || addr.suburb || '',
                city: addr.city || addr.town || addr.village || addr.county || addr.state_district || '',
                state: addr.state || '',
                country: addr.country || '',
                zipCode: addr.postcode || ''
            };
        }
    } catch (err) {
        console.error('Nominatim reverse geocode error:', err);
    }

    return null;
};
