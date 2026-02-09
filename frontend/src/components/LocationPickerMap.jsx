import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, GeoJSON } from 'react-leaflet';
import { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import L from 'leaflet';

// Common India Lat/Long
const CENTER = [28.6139, 77.2090];
const ZOOM = 11;

function LocationMarker({ onLocationSelect, position, setPosition }) {
  const markerRef = useRef(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          setPosition(newPos);
          if (onLocationSelect) {
            onLocationSelect(newPos);
          }
        }
      },
      click(e) {
        // Optional: Center map on click
        // map.flyTo(e.latlng, map.getZoom());
      }
    }),
    [onLocationSelect, setPosition],
  );

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      if (onLocationSelect) {
        onLocationSelect(e.latlng);
      }
    },
  });

  return position === null ? null : (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
}

// Component to update map center programmatically
function MapUpdater({ center, bounds }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    } else if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [center, bounds, map]);
  return null;
}

export default function LocationPickerMap({ onLocationSelect, style, pincode, selectedLocation, suggestions = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [pincodeQuery, setPincodeQuery] = useState('');
  const [mapCenter, setMapCenter] = useState(null);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Boundary Data
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [areaDetails, setAreaDetails] = useState(null);
  const [pincodePlaces, setPincodePlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Fix for marker icon not showing
  useEffect(() => {
    /* eslint-disable global-require */
    /* eslint-disable no-underscore-dangle */
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  // Sync prop selectedLocation to internal state
  useEffect(() => {
    if (selectedLocation) {
      setMapCenter([selectedLocation.lat, selectedLocation.lng]);
      setMarkerPosition(selectedLocation);
    }
  }, [selectedLocation]);

  // Suggestion Bounds Logic
  const suggestionBounds = useMemo(() => {
    if (!markerPosition && !mapCenter && suggestions.length > 0) {
      return suggestions.map(s => [s.lat, s.lng]);
    }
    return null;
  }, [suggestions, markerPosition, mapCenter]);

  // Sync prop pincode to internal state and trigger search
  useEffect(() => {
    if (pincode && pincode.length === 6 && pincode !== pincodeQuery) {
      setPincodeQuery(pincode);
      fetchPincodeData(pincode);
    }
  }, [pincode]);

  const handleLocationSelection = async (pos, explicitAddress = null) => {
    // Handle Leaflet LatLng object or plain object
    const lat = pos.lat;
    const lng = pos.lng;
    
    let address = explicitAddress;
    if (!address) {
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            if (res.data && res.data.display_name) {
                address = res.data.display_name;
            }
        } catch (e) {
            console.error("Geocoding error", e);
        }
    }
    
    // Update parent
    if (onLocationSelect) {
        onLocationSelect({ lat, lng, address }); 
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
        const lat = parseFloat(first.lat);
        const lon = parseFloat(first.lon);
        const newPos = { lat, lng: lon };
        const address = first.display_name;

        setMapCenter([lat, lon]);
        setMarkerPosition(newPos);
        
        handleLocationSelection(newPos, address);

      } else {
        alert("Location not found");
      }
    } catch (err) {
      console.error("Search failed", err);
      alert("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const fetchPincodeData = async (code) => {
    setIsSearching(true);
    setGeoJsonData(null);
    setAreaDetails(null);
    setPincodePlaces([]);
    setLoadingPlaces(true);

    try {
      // 1. Fetch Boundary & Centroid from Nominatim
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(code)}&country=india&polygon_geojson=1&format=json`);

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
        const overpassQuery = `[out:json];(node(around:5000,${lat},${lon})["place"~"village|suburb|neighbourhood|town"];);out;`;
        const placesRes = await axios.get(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`);

        if (placesRes.data && placesRes.data.elements) {
          const places = placesRes.data.elements
            .filter(el => el.tags.name)
            .map(el => ({
              name: el.tags.name,
              lat: el.lat,
              lon: el.lon
            }));

          const uniquePlaces = [...new Map(places.map(item => [item.name, item])).values()];
          setPincodePlaces(uniquePlaces);
        }

      } else {
        // If triggered by prop, we might not want to alert intensely, but for now it helps debug
        console.warn("Pincode not found or no boundary data available.");
      }
    } catch (err) {
      console.error("Pincode Search failed", err);
    } finally {
      setIsSearching(false);
      setLoadingPlaces(false);
    }
  };

  const handlePincodeSearch = async (e) => {
    if (e && e.key !== 'Enter' && e.type === 'keydown') return;
    if (!pincodeQuery.trim()) return;
    await fetchPincodeData(pincodeQuery);
  };

  const handlePlaceClick = (place) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    const newPos = { lat, lng: lon };

    setMapCenter([lat, lon]);
    setMarkerPosition(newPos);
    
    // Fetch address for place click as well, or use name? 
    // Usually better to get full address for consistency
    handleLocationSelection(newPos);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPos = { lat: latitude, lng: longitude };
        setMapCenter([latitude, longitude]);
        setMarkerPosition(newPos);
        setGettingLocation(false);
        
        handleLocationSelection(newPos);
      },
      (error) => {
        console.error("Geolocation error", error);
        alert("Unable to retrieve your location");
        setGettingLocation(false);
      }
    );
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
            style={{ paddingRight: '80px' }}
          />
          <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={handleLocateMe}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: gettingLocation ? 'var(--primary)' : 'var(--text-muted)' }}
              title="Use Current Location"
              disabled={gettingLocation}
            >
              {gettingLocation ? (
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">...</span>
                </div>
              ) : (
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-8h2v-2h-2v2zm0 4h2v-2h-2v2z" /><circle cx="12" cy="12" r="3"></circle><line x1="12" y1="2" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="22"></line><line x1="2" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="22" y2="12"></line></svg>
              )}
            </button>
            <button
              onClick={handleSearch}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
              title="Search Location"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
          </div>
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
          <LocationMarker onLocationSelect={handleLocationSelection} position={markerPosition} setPosition={setMarkerPosition} />
          <MapUpdater center={mapCenter} bounds={suggestionBounds} />

          {/* Render Suggestions as grey markers */}
          {!markerPosition && suggestions.map((s, idx) => (
            <Marker
              key={`suggest-${idx}`}
              position={[s.lat, s.lng]}
              icon={new L.Icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })}
              eventHandlers={{
                click: () => {
                  const pos = { lat: s.lat, lng: s.lng };
                  setMarkerPosition(pos);
                  setMapCenter([s.lat, s.lng]);
                  handleLocationSelection(pos, s.label);
                }
              }}
            >
              <Popup>
                <strong>Past Location:</strong><br />
                {s.label}
              </Popup>
            </Marker>
          ))}

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