import { useEffect, useRef } from 'react';

const MapLocationSelector = ({ location, onLocationSelect, geoApiKey }) => {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const onSelectRef = useRef(onLocationSelect);
    onSelectRef.current = onLocationSelect;

    useEffect(() => {
        if (!containerRef.current || !window.L || !geoApiKey) return;

        const defaultCenter = [30.3037, 78.0329];
        const initLat = location && typeof location.lat === 'number' ? location.lat : defaultCenter[0];
        const initLng = location && typeof location.lng === 'number' ? location.lng : defaultCenter[1];

        if (!mapRef.current) {
            mapRef.current = L.map(containerRef.current).setView([initLat, initLng], 12);
            L.tileLayer(`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${geoApiKey}`, {
                attribution: 'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a>'
            }).addTo(mapRef.current);

            mapRef.current.on('click', async (e) => {
                const { lat, lng } = e.latlng;
                if (markerRef.current) {
                    markerRef.current.setLatLng([lat, lng]);
                } else {
                    markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
                }

                let address = `Coordinates: (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
                try {
                    const res = await fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${geoApiKey}`);
                    const data = await res.json();
                    if (data.features?.length > 0) address = data.features[0].properties.formatted;
                } catch (err) {
                    console.error('Reverse geocoding failed', err);
                }

                onSelectRef.current({ lat, lng, address });
            });
        }

        if (location && typeof location.lat === 'number' && !markerRef.current) {
            markerRef.current = L.marker([initLat, initLng]).addTo(mapRef.current);
        }
    }, [geoApiKey, location]);

    return <div style={{ height: '100%', width: '100%' }} ref={containerRef} className="rounded-md border border-gray-300 dark:border-gray-600" />;
};

export default MapLocationSelector;
