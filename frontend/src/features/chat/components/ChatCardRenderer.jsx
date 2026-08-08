// features/chat/components/ChatCardRenderer.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const StarIcon = () => (
    <svg className="w-3 h-3 text-yellow-500 fill-current" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const LocationPinIcon = ({ className = 'w-3.5 h-3.5 text-teal-600 dark:text-teal-400' }) => (
    <svg className={`${className} shrink-0`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
);

export const RoomCardItem = ({ room, onNavigate }) => {
    return (
        <div className="flex-shrink-0 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div className="relative h-32 w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img
                    src={room.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                    alt={room.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
                    }}
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md text-white text-xs font-semibold rounded-full capitalize">
                    {room.propertyType || 'Stay'}
                </span>
                {room.rating > 0 && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md text-gray-800 dark:text-gray-200 text-xs font-bold rounded-full flex items-center gap-1 shadow-sm">
                        <StarIcon />
                        <span>{room.rating.toFixed(1)}</span>
                    </span>
                )}
            </div>

            <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1 mb-0.5" title={room.title}>
                        {room.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-2">
                        <LocationPinIcon />
                        <span className="truncate">{room.city}</span>
                    </p>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between mt-auto">
                    <div>
                        <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400">
                            ₹{room.pricePerNight?.toLocaleString('en-IN') || room.pricePerNight}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium"> / night</span>
                    </div>

                    <button
                        onClick={() => onNavigate(`/rooms/${room.id}`)}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-medium rounded-lg transition-all shadow-sm shadow-teal-500/20"
                    >
                        View Stay
                    </button>
                </div>
            </div>
        </div>
    );
};

export const BookingCardItem = ({ booking, onNavigate }) => {
    const isConfirmed = booking.status === 'confirmed' || booking.status === 'completed';
    const statusColor = isConfirmed
        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';

    return (
        <div className="flex-shrink-0 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
            <div className="p-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate" title={booking.roomTitle}>
                            {booking.roomTitle}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                            <LocationPinIcon />
                            <span>{booking.city}</span>
                        </p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full capitalize shrink-0 ${statusColor}`}>
                        {booking.status?.replace('_', ' ') || 'Booked'}
                    </span>
                </div>

                <div className="bg-gray-50 dark:bg-gray-850 p-2.5 rounded-xl text-xs space-y-1 border border-gray-100 dark:border-gray-700/50">
                    <div className="flex justify-between text-gray-600 dark:text-gray-300">
                        <span>Check-in:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{booking.checkInDate}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-gray-300">
                        <span>Check-out:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{booking.checkOutDate}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700 font-bold text-gray-900 dark:text-white">
                        <span>Total Paid:</span>
                        <span className="text-teal-600 dark:text-teal-400">₹{booking.totalAmount?.toLocaleString('en-IN') || booking.totalAmount}</span>
                    </div>
                </div>

                <div className="flex gap-2 pt-1">
                    {booking.roomId && (
                        <button
                            onClick={() => onNavigate(`/rooms/${booking.roomId}`)}
                            className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-lg transition-colors text-center"
                        >
                            Room Details
                        </button>
                    )}
                    <button
                        onClick={() => onNavigate('/my-bookings')}
                        className="flex-1 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors text-center shadow-sm shadow-teal-500/20"
                    >
                        My Bookings
                    </button>
                </div>
            </div>
        </div>
    );
};

export const CityCardItem = ({ city, onNavigate }) => {
    return (
        <div
            onClick={() => onNavigate(`/cities/${encodeURIComponent(city.name)}`)}
            className="flex-shrink-0 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-teal-500 cursor-pointer transition-all duration-200 group"
        >
            <div className="relative h-24 w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img
                    src={city.image || `https://placehold.co/400x300?text=${encodeURIComponent(city.name)}`}
                    alt={city.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <span className="absolute bottom-2 left-2 text-white font-bold text-sm drop-shadow-sm">
                    {city.name}
                </span>
            </div>
            <div className="p-2.5 flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400 font-medium">
                    {city.count} {city.count === 1 ? 'stay' : 'stays'}
                </span>
                {city.minPrice && (
                    <span className="text-teal-600 dark:text-teal-400 font-bold">
                        From ₹{city.minPrice}
                    </span>
                )}
            </div>
        </div>
    );
};

export const HostPropertyCardItem = ({ property, onNavigate }) => {
    return (
        <div className="flex-shrink-0 w-60 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-1 mb-1.5">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate" title={property.title}>
                    {property.title}
                </h4>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${property.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-gray-200 text-gray-700'}`}>
                    {property.isActive ? 'Active' : 'Inactive'}
                </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-2">
                <LocationPinIcon />
                <span>{property.city}</span>
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                    ₹{property.pricePerNight}/night
                </span>
                <button
                    onClick={() => onNavigate(`/rooms/${property.id}`)}
                    className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white text-xs rounded-lg transition-colors font-medium"
                >
                    Manage
                </button>
            </div>
        </div>
    );
};

export const ChatCardsCarousel = ({ cards, cardType, onNavigate }) => {
    if (!cards || cards.length === 0) return null;

    return (
        <div className="w-full mt-3 pt-2 pb-1">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                {cards.map((item, index) => {
                    if (cardType === 'rooms' || !cardType) {
                        return <RoomCardItem key={item.id || index} room={item} onNavigate={onNavigate} />;
                    }
                    if (cardType === 'bookings') {
                        return <BookingCardItem key={item.id || index} booking={item} onNavigate={onNavigate} />;
                    }
                    if (cardType === 'cities') {
                        return <CityCardItem key={item.name || index} city={item} onNavigate={onNavigate} />;
                    }
                    if (cardType === 'host_properties') {
                        return <HostPropertyCardItem key={item.id || index} property={item} onNavigate={onNavigate} />;
                    }
                    return null;
                })}
            </div>
        </div>
    );
};
