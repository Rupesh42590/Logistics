import { MapContainer, TileLayer, Marker, useMapEvents, useMap, GeoJSON } from 'react-leaflet';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useModal } from '../context/ModalContext';

// Common India Lat/Long
const CENTER = [28.6139, 77.2090];
const ZOOM = 11;

function LocationMarker({ onLocationSelect, position, setPosition }) {
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

// Component to update map center programmatically
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 13);
    }
  }, [center, map]);
  return null;
}

export default function LocationPickerMap({ onLocationSelect, style }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [pincodeQuery, setPincodeQuery] = useState('');
  const [mapCenter, setMapCenter] = useState(null);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const { showAlert } = useModal();

  // Boundary Data
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [areaDetails, setAreaDetails] = useState(null);
  const [pincodePlaces, setPincodePlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      if (res.data && res.data.length > 0) {
        const first = res.data[0];
        const lat = parseFloat(first.lat);
        const lon = parseFloat(first.lon);
        const newPos = { lat, lng: lon };

        setMapCenter([lat, lon]);
        setMarkerPosition(newPos);
        if (onLocationSelect) {
          onLocationSelect(newPos);
        }
      } else {
        showAlert("Not Found", "Location not found");
      }
    } catch (err) {
      console.error("Search failed", err);
      showAlert("Error", "Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handlePincodeSearch = async (e) => {
    if (e && e.key !== 'Enter' && e.type === 'keydown') return;
    if (!pincodeQuery.trim()) return;

    setIsSearching(true);
    setGeoJsonData(null);
    setAreaDetails(null);
    setPincodePlaces([]);
    setLoadingPlaces(true);

    try {
      // 1. Fetch Boundary & Centroid from Nominatim
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(pincodeQuery)}&country=india&polygon_geojson=1&format=json`);

      if (res.data && res.data.length > 0) {
        const first = res.data[0];
        const lat = parseFloat(first.lat);
        const lon = parseFloat(first.lon);

        setMapCenter([lat, lon]);

        // Set GeoJSON if available
        if (first.geojson && (first.geojson.type === 'Polygon' || first.geojson.type === 'MultiPolygon')) {
          setGeoJsonData(first.geojson);
        }

        // Set Display Name / Details
        setAreaDetails(first.display_name);

        // 2. Fetch Nearby Villages/Suburbs using Overpass API
        // Radius: 5000m (5km) around the centroid
        const overpassQuery = `[out:json];(node(around:5000,${lat},${lon})["place"~"village|suburb|neighbourhood|town"];);out;`;
        const placesRes = await axios.get(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`);

        if (placesRes.data && placesRes.data.elements) {
          // Filter and map interesting tags
          const places = placesRes.data.elements
            .filter(el => el.tags.name)
            .map(el => ({
              name: el.tags.name,
              lat: el.lat,
              lon: el.lon
            }));

          // Deduplicate by name to avoid clutter
          const uniquePlaces = [...new Map(places.map(item => [item.name, item])).values()];
          setPincodePlaces(uniquePlaces);
        }

      } else {
        showAlert("Not Found", "Pincode not found or no boundary data available.");
      }
    } catch (err) {
      console.error("Pincode Search failed", err);
      showAlert("Error", "Failed to fetch pincode data.");
    } finally {
      setIsSearching(false);
      setLoadingPlaces(false);
    }
  };

  const handlePlaceClick = (place) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    const newPos = { lat, lng: lon };

    setMapCenter([lat, lon]);
    setMarkerPosition(newPos);
    if (onLocationSelect) {
      onLocationSelect(newPos);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', ...style }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexDirection: 'column' }}>
        {/* General Location Search */}
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            placeholder="Search location (e.g. Hyderabad)"
            className="form-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
            style={{ paddingRight: '40px' }}
          />
          <button
            onClick={handleSearch}
            style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
            title="Search Location"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
        </div>

        {/* Pincode Search */}
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            placeholder="Search Pincode (e.g. 500032) for Boundary"
            className="form-input"
            value={pincodeQuery}
            onChange={(e) => setPincodeQuery(e.target.value)}
            onKeyDown={handlePincodeSearch}
            style={{ paddingRight: '40px', borderColor: geoJsonData ? 'var(--primary)' : 'var(--border)' }}
          />
          <button
            onClick={handlePincodeSearch}
            style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
            title="Search Pincode"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </button>
        </div>

        {/* Area Details Info */}
        {areaDetails && (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: '#f8fafc', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
            <strong>Region found:</strong> {areaDetails}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', flex: 1, minHeight: 0 }}>
        {/* Map Container - Flex 2 */}
        <MapContainer center={CENTER} zoom={ZOOM} style={{ flex: 2, height: '100%', borderRadius: '0.5rem' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker onLocationSelect={onLocationSelect} position={markerPosition} setPosition={setMarkerPosition} />
          <MapUpdater center={mapCenter} />

          {/* Render Boundary if available */}
          {geoJsonData && (
            <GeoJSON
              data={geoJsonData}
              key={JSON.stringify(geoJsonData)} // Critical to force re-render on data change
              style={{
                color: '#ea580c', // Orange/Red color like the screenshot
                weight: 2,
                dashArray: '10, 10', // Dotted/Dashed line
                fillOpacity: 0, // Transparent fill
                lineCap: 'round'
              }}
            />
          )}
        </MapContainer>

        {/* Village List Panel - Flex 1 */}
        {(pincodePlaces.length > 0 || loadingPlaces) && (
          <div style={{
            flex: 1,
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            background: '#fff',
            overflowY: 'auto',
            padding: '8px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--text-main)', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
              Nearby Areas
            </h4>
            {loadingPlaces ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>Loading places...</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {pincodePlaces.map((place, idx) => (
                  <li
                    key={idx}
                    onClick={() => handlePlaceClick(place)}
                    style={{
                      fontSize: '0.85rem',
                      padding: '6px 8px',
                      borderBottom: '1px solid #f8fafc',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      color: '#334155'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#f1f5f9'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  >
                    📍 {place.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}