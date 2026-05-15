import { useEffect, useRef } from 'react';

const MapLocationSelector = ({ location, onLocationSelect, geoApiKey }) => {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const onSelectRef = useRef(onLocationSelect);
    onSelectRef.current = onLocationSelect;

    const createSelectorPin = () => {
        if (!window.L) return null;
        return L.divIcon({
            html: `
                <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: grab; filter: drop-shadow(0 6px 12px rgba(0,0,0,0.3));">
                    <div style="
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        background: #0f172a;
                        color: #ffffff;
                        padding: 5px 10px;
                        border-radius: 9999px;
                        font-size: 11px;
                        font-weight: 700;
                        white-space: nowrap;
                        border: 2px solid #ffffff;
                    ">
                        <span style="
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            width: 16px;
                            height: 16px;
                            border-radius: 50%;
                            background: #0d9488;
                            color: #ffffff;
                        ">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
                            </svg>
                        </span>
                        <span>Selected Spot</span>
                    </div>
                    <div style="
                        width: 0;
                        height: 0;
                        border-left: 6px solid transparent;
                        border-right: 6px solid transparent;
                        border-top: 7px solid #0f172a;
                        margin-top: -1px;
                    "></div>
                    <div style="
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        background: #0d9488;
                        border: 2px solid #ffffff;
                        box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.4);
                        margin-top: 2px;
                    "></div>
                </div>
            `,
            className: 'custom-selector-pin',
            iconSize: [0, 0],
            iconAnchor: [0, 0]
        });
    };

    useEffect(() => {
        if (!containerRef.current || !window.L) return;

        const defaultCenter = [30.3037, 78.0329];
        const initLat = location && typeof location.lat === 'number' ? location.lat : defaultCenter[0];
        const initLng = location && typeof location.lng === 'number' ? location.lng : defaultCenter[1];

        if (!mapRef.current) {
            mapRef.current = L.map(containerRef.current).setView([initLat, initLng], 12);

            const tileUrl = geoApiKey 
                ? `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${geoApiKey}`
                : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            
            const attribution = geoApiKey
                ? 'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a>'
                : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

            L.tileLayer(tileUrl, { attribution, maxZoom: 19 }).addTo(mapRef.current);

            // Add initial marker if location coordinates exist
            if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
                const pin = createSelectorPin();
                markerRef.current = L.marker([initLat, initLng], pin ? { icon: pin } : undefined).addTo(mapRef.current);
            }

            mapRef.current.on('click', async (e) => {
                const { lat, lng } = e.latlng;
                const pin = createSelectorPin();
                if (markerRef.current) {
                    markerRef.current.setLatLng([lat, lng]);
                    if (pin) markerRef.current.setIcon(pin);
                } else {
                    markerRef.current = L.marker([lat, lng], pin ? { icon: pin } : undefined).addTo(mapRef.current);
                }

                let address = `Coordinates: (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

                // Try Geoapify reverse geocode
                if (geoApiKey) {
                    try {
                        const res = await fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${geoApiKey}`);
                        const data = await res.json();
                        if (data.features?.length > 0) {
                            address = data.features[0].properties.formatted || address;
                        }
                    } catch (err) {
                        console.warn('Geoapify click reverse geocode failed:', err);
                    }
                }

                onSelectRef.current?.({ lat, lng, address });
            });
        } else if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
            const pin = createSelectorPin();
            if (markerRef.current) {
                markerRef.current.setLatLng([location.lat, location.lng]);
                if (pin) markerRef.current.setIcon(pin);
            } else {
                markerRef.current = L.marker([location.lat, location.lng], pin ? { icon: pin } : undefined).addTo(mapRef.current);
            }
        }
    }, [geoApiKey, location]);

    return (
        <div
            style={{ height: '100%', width: '100%' }}
            ref={containerRef}
            className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        />
    );
};

export default MapLocationSelector;
