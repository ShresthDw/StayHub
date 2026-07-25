import React from 'react';
import { getCityCardImage, getCityCardSrcSet, getCityCardSizes } from '../utils/imageKitOptimizer.js';

const CityCard = ({ city, imageUrl, roomCount, onClick }) => {
	const optimizedImageUrl = getCityCardImage(imageUrl);
	const srcSet = getCityCardSrcSet(imageUrl);
	const sizes = getCityCardSizes();
	return (
		<div
			onClick={onClick}
			className="relative rounded-lg overflow-hidden shadow-md hover:shadow-xl w-full transform hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
		>
			{/* Background Image */}
			<img
				src={optimizedImageUrl}
				srcSet={srcSet}
				sizes={sizes}
				alt={city}
				loading="lazy"
				decoding="async"
				className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
			/>

			{/* Overlay */}
			<div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-end p-4">
				<h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{city}</h3>
				<p className="text-xs sm:text-sm text-gray-200 mt-0.5 font-medium">{roomCount} {roomCount === 1 ? 'property' : 'properties'}</p>
			</div>
		</div>
	);
};

// OPTIMIZATION: Memoize to prevent re-renders when props haven't changed
export default React.memo(CityCard, (prevProps, nextProps) => {
	return prevProps.city === nextProps.city && prevProps.roomCount === nextProps.roomCount;
});
