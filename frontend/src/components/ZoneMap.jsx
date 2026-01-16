import { MapContainer, TileLayer, FeatureGroup, Polygon, Popup, useMap, GeoJSON } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { useModal } from '../context/ModalContext';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Fix for default marker icons
import L from 'leaflet';
// Note: We might not need markers, but good to have if we add them later or search adds one.

// Common India Lat/Long (Delhi)
const CENTER = [20.5937, 78.9629]; // Center of India
const ZOOM = 5;

function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 12);
        }
    }, [center, map]);
    return null;
}

export default function ZoneMap({ onCreated, zones = [] }) {
  const mapRef = useRef();
  const [searchQuery, setSearchQuery] = useState('');
  const [pincodeQuery, setPincodeQuery] = useState('');
  const [mapCenter, setMapCenter] = useState(null);
  const [foundBoundary, setFoundBoundary] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const { showAlert, showConfirm } = useModal();

  const handleCreated = (e) => {
    const layer = e.layer;
    if (onCreated) {
        const geoJson = layer.toGeoJSON();
        // layer.remove(); // Keep it on map or remove? AdminDashboard re-renders with new zone list, so maybe better to let that handle it.
        // But local drawing layer persists until remove.
        // We'll leave it to user to clear or let the refresh handle it (though refresh might duplicate if we don't clear).
        // For now, simpler is valid.
        onCreated(geoJson);
        // Clear the drawn shape to avoid confusion with the newly added "official" zone polygon
        e.layer.remove(); 
    }
  };

  const handleSearch = async (e) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;
      setIsSearching(true);
      try {
          const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
          if (res.data && res.data.length > 0) {
              const first = res.data[0];
              setMapCenter([parseFloat(first.lat), parseFloat(first.lon)]);
          } else {
              showAlert("Not Found", "Location not found");
          }
      } catch (err) {
          console.error(err);
      } finally {
          setIsSearching(false);
      }
  };

  const handlePincodeSearch = async (e) => {
      if (e && e.key !== 'Enter' && e.type === 'keydown') return;
      if (!pincodeQuery.trim()) return;

      setIsSearching(true);
      setFoundBoundary(null);

      try {
          const res = await axios.get(`https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(pincodeQuery)}&country=india&polygon_geojson=1&format=json`);
          if (res.data && res.data.length > 0) {
              const first = res.data[0];
              setMapCenter([parseFloat(first.lat), parseFloat(first.lon)]);
              
              if (first.geojson && (first.geojson.type === 'Polygon' || first.geojson.type === 'MultiPolygon')) {
                  setFoundBoundary(first.geojson);
              } else {
                  showAlert("Not Found", "Location found, but no boundary polygon available.");
              }
          } else {
              showAlert("Not Found", "Pincode not found");
          }
      } catch (err) {
          console.error(err);
          showAlert("Error", "Search failed");
      } finally {
          setIsSearching(false);
      }
  };

  const createZoneFromBoundary = () => {
      if (foundBoundary && onCreated) {
          // Pass a callback to clear the state only after successful creation
          onCreated({ type: 'Feature', geometry: foundBoundary, properties: {} }, () => {
              setFoundBoundary(null); 
              setPincodeQuery('');
          });
      }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Search Bar */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                <input 
                    className="form-input" 
                    placeholder="Search Location..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch(e)}
                />
                <button className="btn" onClick={handleSearch} disabled={isSearching}>Search</button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                <input 
                    className="form-input" 
                    placeholder="Search Pincode (Get Boundary)" 
                    value={pincodeQuery}
                    onChange={e => setPincodeQuery(e.target.value)}
                    onKeyDown={handlePincodeSearch}
                />
                <button className="btn" onClick={handlePincodeSearch} disabled={isSearching}>Find Boundary</button>
            </div>
        </div>

        {foundBoundary && (
            <div className="alert alert-success" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem' }}>
                <span>Boundary found! Create zone from this?</span>
                <button className="btn btn-primary" onClick={createZoneFromBoundary}>Create Zone</button>
            </div>
        )}

        <MapContainer center={CENTER} zoom={ZOOM} style={{ flex: 1, width: '100%', borderRadius: '0.5rem' }} ref={mapRef}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={mapCenter} />
            
            {/* Draw Controls */}
            <FeatureGroup>
                <EditControl
                    position="topright"
                    onCreated={handleCreated}
                    draw={{
                        rectangle: {
                            showArea: true,
                            shapeOptions: {
                                color: '#3b82f6'
                            }
                        },
                        circle: false,
                        circlemarker: false,
                        marker: false,
                        polyline: false,
                        polygon: false
                    }}
                />
            </FeatureGroup>

            {/* Existing Zones */}
            {zones.map((zone) => (
                <Polygon key={zone.id} positions={zone.coordinates} pathOptions={{ color: 'blue', fillOpacity: 0.1 }}>
                    <Popup>
                        <strong>{zone.name}</strong>
                    </Popup>
                </Polygon>
            ))}

            {/* Found Boundary Preview */}
            {foundBoundary && (
                <GeoJSON 
                    data={foundBoundary} 
                    style={{ color: '#ea580c', dashArray: '5, 10', weight: 2, fillOpacity: 0.2 }} 
                    onEachFeature={(feature, layer) => {
                        layer.on({
                            click: () => {
                                showConfirm(
                                    "Create Zone", 
                                    "Do you want to use this boundary to create a new zone?",
                                    createZoneFromBoundary
                                );
                            }
                        });
                    }}
                />
            )}
        </MapContainer>
    </div>
  );
}
