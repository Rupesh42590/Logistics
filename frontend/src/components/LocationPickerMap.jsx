import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useState, useEffect } from 'react';

// Common India Lat/Long
const CENTER = [28.6139, 77.2090];
const ZOOM = 11;

function LocationMarker({ onLocationSelect }) {
  const [position, setPosition] = useState(null);
  
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      if (onLocationSelect) {
        onLocationSelect(e.latlng);
      }
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function LocationPickerMap({ onLocationSelect }) {
    // Fix for marker icon not showing
    useEffect(() => {
        // This effectively fixes the missing icon issue in Leaflet + standard bundlers
        // by deleting the default icon options which point to non-existent URLs
        // and replacing them.
        /* eslint-disable global-require */
        /* eslint-disable no-underscore-dangle */
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
    }, []);

  return (
    <MapContainer center={CENTER} zoom={ZOOM} style={{ height: '300px', width: '100%', borderRadius: '0.5rem', marginTop: '0.5rem' }}>
        <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker onLocationSelect={onLocationSelect} />
    </MapContainer>
  );
}
