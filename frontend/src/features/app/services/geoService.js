// RTK Query hook for app config
export { useGetAppConfigQuery } from '../../../api/apiSlice.js';

/**
 * Get API key from app config
 */
export const getGeoApiKey = async (configData) => {
    if (!configData) return null;
    return configData.geoApiKey;
};

/**
 * Geocode an address using Geoapify API
 */
export const geocodeAddress = async (address, geoApiKey) => {
    const encoded = encodeURIComponent(address);
    const res = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${encoded}&apiKey=${geoApiKey}`);
    return res.json();
};