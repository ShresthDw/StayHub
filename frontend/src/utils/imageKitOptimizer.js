/**
 * ImageKit Optimizer Utility
 * Converts image URLs to optimized ImageKit URLs with automatic transformations
 * 
 * Features:
 * - Automatic resizing based on device/container width
 * - Format conversion to next-gen formats (WebP)
 * - Quality optimization
 * - Global CDN caching
 * 
 * Configuration:
 * - ImageKit Endpoint: https://ik.imagekit.io/shresthdw/
 * - Web Proxy: Configured for Adobe Stock URLs
 */

const IMAGEKIT_ENDPOINT = 'https://ik.imagekit.io/shresthdw/';

/**
 * Generates an optimized ImageKit URL
 * @param {string} imageUrl - The original image URL (can be Adobe URL, local path, or any external URL)
 * @param {object} options - Transformation options
 * @param {number} options.width - Image width in pixels (default: 800)
 * @param {number} options.height - Image height in pixels (optional)
 * @param {number} options.quality - Quality 1-100 (default: 80)
 * @param {string} options.format - Image format: 'auto', 'webp', 'jpg', 'png' (default: 'auto')
 * @returns {string} Optimized ImageKit URL
 */
export const optimizeImage = (imageUrl, options = {}) => {
    if (!imageUrl) {
        return 'https://placehold.co/600x400?text=No+Image';
    }

    // Don't optimize placeholder images or data URLs
    if (imageUrl.includes('placehold.co') || imageUrl.startsWith('data:')) {
        return imageUrl;
    }

    const {
        width = 800,
        height = null,
        quality = 80,
        format = 'auto'
    } = options;

    // Build transformation string
    const transformations = [];
    transformations.push(`w-${width}`);
    if (height) {
        transformations.push(`h-${height}`);
    }
    transformations.push(`q-${quality}`);
    transformations.push(`f-${format}`);

    const transformationString = transformations.join(',');

    // Construct the final URL
    // ImageKit Web Proxy format: https://ik.imagekit.io/[endpoint]/[remote-url]?tr=transformations
    return `${IMAGEKIT_ENDPOINT}${imageUrl}?tr=${transformationString}`;
};

/**
 * Get optimized URL for room card thumbnail (aspect ratio: 4:3, responsive sizing)
 * Quality reduced to 70% for additional compression - imperceptible quality loss
 * @param {string} imageUrl - The original image URL
 * @returns {string} Optimized ImageKit URL
 */
export const getRoomCardThumbnail = (imageUrl) => {
    return optimizeImage(imageUrl, {
        width: 400,
        height: 300,
        quality: 70, // Reduced from 75% for better compression
        format: 'auto'
    });
};

/**
 * Get optimized URL for room detail modal image (larger display)
 * @param {string} imageUrl - The original image URL
 * @returns {string} Optimized ImageKit URL
 */
export const getRoomDetailImage = (imageUrl) => {
    return optimizeImage(imageUrl, {
        width: 800,
        quality: 85,
        format: 'auto'
    });
};

/**
 * Get optimized URL for city card background (responsive sizing)
 * City cards are typically 200-400px wide depending on viewport
 * Using 400px as optimal for responsive display
 * Quality reduced to 70% for better compression
 * @param {string} imageUrl - The original image URL
 * @returns {string} Optimized ImageKit URL
 */
export const getCityCardImage = (imageUrl) => {
    return optimizeImage(imageUrl, {
        width: 400, // Reduced from 800 - matches actual display size
        height: 225, // Maintains h-56 aspect ratio (16:9)
        quality: 70, // Reduced from 75% for better compression
        format: 'auto'
    });
};

/**
 * Get responsive srcset for city cards across different viewports
 * Generates multiple sizes for optimal loading on mobile/tablet/desktop
 * Quality reduced to 70% for better compression
 * @param {string} imageUrl - The original image URL
 * @returns {string} srcset string for responsive images
 */
export const getCityCardSrcSet = (imageUrl) => {
    if (!imageUrl || imageUrl.includes('placehold.co') || imageUrl.startsWith('data:')) {
        return null;
    }

    const sizes = [
        { width: 300, height: 169 }, // Mobile (16:9)
        { width: 400, height: 225 }, // Tablet (16:9)
        { width: 600, height: 338 }  // Desktop (16:9)
    ];

    return sizes
        .map(({ width, height }) => {
            const url = optimizeImage(imageUrl, { width, height, quality: 70, format: 'auto' });
            return `${url} ${width}w`;
        })
        .join(', ');
};

/**
 * Get sizes attribute for city card responsive images
 * City cards on desktop display in 3+ column layouts = ~30vw actual width
 * Adjusted to better match actual display dimensions
 * @returns {string} sizes attribute value
 */
export const getCityCardSizes = () => {
    return '(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 40vw, 30vw';
};

/**
 * Get responsive srcset for room cards across different viewports
 * Generates multiple sizes for optimal loading on different devices
 * Room cards display at ~300px mobile, ~400px tablet, ~500px desktop
 * Quality reduced to 70% for better compression
 * @param {string} imageUrl - The original image URL
 * @returns {string} srcset string for responsive images
 */
export const getRoomCardSrcSet = (imageUrl) => {
    if (!imageUrl || imageUrl.includes('placehold.co') || imageUrl.startsWith('data:')) {
        return null;
    }

    const sizes = [
        { width: 300, height: 225 }, // Mobile (4:3)
        { width: 400, height: 300 }, // Tablet (4:3)
        { width: 500, height: 375 }  // Desktop (4:3)
    ];

    return sizes
        .map(({ width, height }) => {
            const url = optimizeImage(imageUrl, { width, height, quality: 70, format: 'auto' });
            return `${url} ${width}w`;
        })
        .join(', ');
};

/**
 * Get sizes attribute for room card responsive images
 * Room cards on desktop display in 4+ column layouts = ~22-25vw actual width
 * Adjusted to be more conservative to prevent oversized image loading
 * @returns {string} sizes attribute value
 */
export const getRoomCardSizes = () => {
    return '(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 22vw';
};

/**
 * Get optimized URL for responsive images based on device width
 * Useful for images that scale based on viewport
 * @param {string} imageUrl - The original image URL
 * @param {number} containerWidth - Width of the container in pixels
 * @returns {string} Optimized ImageKit URL
 */
export const getResponsiveImage = (imageUrl, containerWidth = 400) => {
    return optimizeImage(imageUrl, {
        width: Math.min(containerWidth, 1200),
        quality: 80,
        format: 'auto'
    });
};

export default {
    optimizeImage,
    getRoomCardThumbnail,
    getRoomDetailImage,
    getCityCardImage,
    getCityCardSrcSet,
    getCityCardSizes,
    getRoomCardSrcSet,
    getRoomCardSizes,
    getResponsiveImage,
    IMAGEKIT_ENDPOINT
};
