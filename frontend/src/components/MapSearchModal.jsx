import { useEffect, useState } from 'react';
import { getSafeDistance, hasCoordinates } from '../constants.jsx';
import MapLocationSelector from './MapLocationSelector.jsx';

const MapSearchModal = ({ isOpen, onClose, onApplySearch, initialLocation, geoApiKey, icons }) => {
    const [selectedLocation, setSelectedLocation] = useState(initialLocation);

    useEffect(() => {
        if (isOpen) setSelectedLocation(initialLocation);
    }, [isOpen, initialLocation]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-xl w-full relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white">{icons.close}</button>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Select Search Area</h2>
                <div style={{ height: '300px', width: '100%' }}>
                    <MapLocationSelector location={selectedLocation} onLocationSelect={setSelectedLocation} geoApiKey={geoApiKey} />
                </div>
                <div className="mt-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Max Distance (km)</label>
                    <input
                        type="number"
                        value={getSafeDistance(selectedLocation.distance)}
                        onChange={(e) => setSelectedLocation((prev) => ({ ...prev, distance: getSafeDistance(e.target.value) }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                    />
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 border dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                    <button onClick={() => onApplySearch({ ...selectedLocation, distance: getSafeDistance(selectedLocation.distance) })} disabled={!hasCoordinates(selectedLocation)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md disabled:bg-indigo-300">Apply Search</button>
                </div>
            </div>
        </div>
    );
};

export default MapSearchModal;
