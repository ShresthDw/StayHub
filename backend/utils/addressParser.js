/**
 * Address parsing utility using Geoapify reverse geocoding
 * Extracts structured address components from coordinates
 */

export const parseAddressFromCoordinates = async (latitude, longitude, apiKey) => {
    if (!apiKey || !latitude || !longitude) {
        return null;
    }

    try {
        const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.features && data.features.length > 0) {
            const properties = data.features[0].properties;

            return {
                street: properties.address_line1 || '',
                city: properties.city || properties.town || properties.village || '',
                state: properties.state || properties.province || '',
                country: properties.country || '',
                zipCode: properties.postcode || ''
            };
        }
    } catch (err) {
        console.error('Error parsing address from coordinates:', err.message);
    }

    return null;
};

/**
 * Endpoint handler for reverse geocoding
 * GET /api/address/reverse-geocode?lat=X&lng=Y
 */
export const reverseGeocodeAddress = async (req, res) => {
    try {
        const { lat, lng } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ msg: 'Latitude and longitude are required' });
        }

        const apiKey = process.env.GEOAPIFY_API_KEY;
        if (!apiKey) {
            return res.status(400).json({ msg: 'Geocoding service not available' });
        }

        const address = await parseAddressFromCoordinates(parseFloat(lat), parseFloat(lng), apiKey);

        if (!address) {
            return res.status(404).json({ msg: 'Address not found for coordinates' });
        }

        res.status(200).json(address);
    } catch (err) {
        console.error('ERROR in reverseGeocodeAddress:', err);
        res.status(500).json({ message: 'Failed to parse address' });
    }
};
