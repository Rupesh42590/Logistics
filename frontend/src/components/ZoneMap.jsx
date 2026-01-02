import { MapContainer, TileLayer, FeatureGroup, Polygon, Popup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Fix for default marker icons (if needed, but we are doing polygons)
// ...

// Common India Lat/Long (Delhi)
const CENTER = [28.6139, 77.2090];
const ZOOM = 11;

export default function ZoneMap({ onCreated, zones = [] }) {
  const mapRef = useRef();

  const handleCreated = (e) => {
    const layer = e.layer;
    if (onCreated) {
        // Get GeoJSON from the layer
        const geoJson = layer.toGeoJSON();
        // Remove layer from map immediately so we don't have duplicate (one drawn, one from state re-render)
        // actually let's keep it until state updates? 
        // Better to remove it if parent is going to re-render it via `zones` prop.
        // e.layer.remove(); // Optional: depending on flow.
        onCreated(geoJson);
    }
  };

  return (
    <MapContainer center={CENTER} zoom={ZOOM} style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }} ref={mapRef}>
        <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Draw Controls */}
        <FeatureGroup>
            <EditControl
                position="topright"
                onCreated={handleCreated}
                draw={{
                    rectangle: false,
                    circle: false,
                    circlemarker: false,
                    marker: false,
                    polyline: false,
                    polygon: {
                        allowIntersection: false,
                        showArea: true
                    }
                }}
            />
        </FeatureGroup>

        {/* Existing Zones */}
        {zones.map((zone) => (
             <Polygon key={zone.id} positions={zone.coordinates} pathOptions={{ color: 'blue' }}>
                 <Popup>
                     <strong>{zone.name}</strong>
                 </Popup>
             </Polygon>
        ))}
    </MapContainer>
  );
}
