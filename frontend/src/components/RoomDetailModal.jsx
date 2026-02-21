import { getRoomDetailImage } from '../utils/imageKitOptimizer.js';

const RoomDetailModal = ({ isOpen, onClose, room, icons }) => {
    if (!isOpen || !room) return null;

    const owner = room.hostId || { name: 'N/A', email: 'N/A', phone: 'N/A' };
    const getImageUrl = (img) => {
        const rawUrl = typeof img === 'string' ? img : img?.url;
        return getRoomDetailImage(rawUrl);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-3xl w-full relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white">{icons.close}</button>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">{room.title}</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{room.address?.city || 'Location not provided'}</p>
                <div className="grid grid-cols-2 gap-2 mb-6">
                    {room.images.slice(0, 4).map((img, i) => (
                        <img key={i} src={getImageUrl(img)} alt={`${room.title} ${i + 1}`} className="h-40 w-full object-cover rounded-lg" />
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-4">
                            ₹{(room.pricePerNight || 0).toLocaleString()} <span className="text-lg font-normal text-gray-600 dark:text-gray-400">/ night</span>
                        </p>
                        <p className="text-md font-medium text-gray-700 dark:text-gray-300 mb-1">Property Type: <span className="capitalize">{room.propertyType}</span></p>
                        <p className="text-md font-medium text-gray-700 dark:text-gray-300 mb-1">Capacity: {room.maxGuests || '-'} Guests</p>
                        <div className="flex items-center text-md text-gray-700 dark:text-gray-300 mt-2">{icons.star}<span className="ml-1">{room.rating || 'New'}</span></div>
                        {room.distance !== undefined && room.distance !== null && (
                            <p className="text-md text-gray-700 dark:text-gray-300 mt-1 flex items-center">{icons.map}<span className="ml-1">{room.distance.toFixed(1)} km away</span></p>
                        )}
                    </div>
                    <div className="md:col-span-2">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Description</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{room.description}</p>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Amenities</h3>
                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 columns-2">
                            {(room.amenities || []).map((f, i) => <li key={i}>{f}</li>)}
                        </ul>
                    </div>
                </div>
                <div className="mt-8 p-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Contact Owner</h3>
                    <p className="text-gray-700 dark:text-gray-300">Name: {owner.name}</p>
                    <p className="text-gray-700 dark:text-gray-300">Email: <a href={`mailto:${owner.email}`} className="text-indigo-600 dark:text-indigo-400">{owner.email}</a></p>
                    <p className="text-gray-700 dark:text-gray-300">Phone: {owner.phone || 'N/A'}</p>
                </div>
            </div>
        </div>
    );
};

export default RoomDetailModal;
