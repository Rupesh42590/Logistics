import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import LocationPickerMap from './LocationPickerMap';
import '../pages/MSMEPortal.css'; // Ensure we have the drawer styles

export default function AddAddressModal({ onClose, onSuccess }) {
    // Hidden default fields
    const label = 'Company';
    const mobileNumber = '0000000000';

    const [recipientName, setRecipientName] = useState(''); // "Company Name"
    const [addressLine1, setAddressLine1] = useState('');
    const [pincode, setPincode] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [cityOptions, setCityOptions] = useState([]);

    // Map State
    const [mapLocation, setMapLocation] = useState(null); // { lat, lng }
    const [suggestions, setSuggestions] = useState([]);

    const [loading, setLoading] = useState(false);

    // Initial map suggestion (optional, could use current location)
    useEffect(() => {
        // We could request current location here if needed
    }, []);

    const handlePincodeChange = async (e) => {
        const val = e.target.value;
        setPincode(val);
        if (val.length === 6) {
            try {
                const res = await axios.get(`https://api.postalpincode.in/pincode/${val}`);
                if (res.data && res.data[0].Status === "Success") {
                    const postOffices = res.data[0].PostOffice;
                    setCityOptions(postOffices);

                    if (postOffices.length > 0) {
                        setCity(postOffices[0].Name);
                        setState(postOffices[0].State);
                    }
                } else {
                    setCityOptions([]);
                }
            } catch (err) {
                console.error("Failed to fetch pincode details", err);
                setCityOptions([]);
            }
        } else {
            setCityOptions([]);
        }
    };

    const handleMapLocationSelect = async (latlng) => {
        setMapLocation(latlng);
        // Reverse Geocoding
        try {
            const { lat, lng } = latlng;
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            if (res.data && res.data.address) {
                const addr = res.data.address;

                // Map API fields to State
                const newPincode = addr.postcode || '';
                const newCity = addr.city || addr.town || addr.village || addr.suburb || addr.neighbourhood || '';
                const newState = addr.state || '';
                const newAddress = [
                    addr.house_number,
                    addr.road,
                    addr.suburb,
                    addr.neighbourhood
                ].filter(Boolean).join(', ');

                // Update State if fields are present
                if (newPincode) setPincode(newPincode);
                if (newCity) setCity(newCity);
                if (newState) setState(newState);
                if (newAddress && !addressLine1) setAddressLine1(newAddress); // Only fill if empty or overwrite? User said autofill. Let's overwrite or maybe usually overwrite is expected on map click.
                setAddressLine1(newAddress); // Let's overwrite to match "autofill from map" expectation

                // If pincode changed, maybe we should fetch City options again? 
                // Or just trust the reverse geocode. 
                // Since we setCity directly, options validation might be tricky if it's a dropdown.
                // But in the render:
                /* 
                   {cityOptions.length > 1 ? (select...) : (input...)}
                   If we setCity, and options are empty (because we didn't call pincode API), it renders Input. 
                   If we setPincode, properly we should trigger options fetch or just let it be an input.
                   Let's clear options so it renders as Input with the geocoded city.
                */
                setCityOptions([]);
            }
        } catch (err) {
            console.error("Reverse geocoding failed", err);
        }
    };

    const handleSave = async () => {
        const missingFields = [];
        if (!recipientName) missingFields.push("Company Name");
        if (!addressLine1) missingFields.push("Address");
        if (!pincode) missingFields.push("Pincode");
        if (!city) missingFields.push("City");
        // State is not necessary as per user request
        // if (!state) missingFields.push("State");

        if (missingFields.length > 0) {
            alert(`Please fill the following fields:\n- ${missingFields.join('\n- ')}`);
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Check if we need to pass token, usually axios interceptor handles it if configured, 
            // but previous code had manual header sometimes. 
            // AuthContext usually sets default header. Let's assume default header is set or use explicit if consistent.
            // Previous file didn't use explicit header in last edit, but did in first. 
            // Let's check apiConfig or AuthContext. 
            // Actually, best to just use axios directly if defaults are set, or grab token.
            // Safe bet: get token.
            const storedToken = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${storedToken}` } };

            await axios.post(`${API_BASE_URL}/addresses`, {
                label,
                recipient_name: recipientName, // Sending as recipient_name to backend
                mobile_number: mobileNumber,
                address_line1: addressLine1,
                pincode,
                city,
                state,
                latitude: mapLocation ? mapLocation.lat : 0,
                longitude: mapLocation ? mapLocation.lng : 0
            }, config);
            onSuccess();
        } catch (err) {
            console.error(err);
            alert("Failed to save address");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="drawer-overlay">
            <div className="drawer-content" style={{ maxWidth: '1200px', height: '90vh', margin: 'auto', borderRadius: '8px' }}>
                <div className="drawer-header">
                    <h2 className="drawer-title">Add New Address</h2>
                    <button onClick={onClose} className="drawer-close-btn">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="new-shipment-grid" style={{ gridTemplateColumns: '400px 1fr' }}>

                    {/* LEFT: Form */}
                    <div className="left-panel" style={{ paddingRight: '2rem', borderRight: '1px solid var(--border)' }}>
                        <div className="form-group">
                            <label className="form-label">Company / Recipient Name</label>
                            <input
                                className="form-input"
                                value={recipientName}
                                onChange={e => setRecipientName(e.target.value)}
                                placeholder="e.g. Acme Corp"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Phone Number (Optional)</label>
                             <input
                                className="form-input"
                                value={mobileNumber}
                                onChange={e => {
                                    const val = e.target.value;
                                    // simple numeric filter
                                    if (/^\d*$/.test(val)) setMobileNumber(val); // Actually the state default is '0000..' but let's allow user edit
                                }}
                                placeholder="Mobile Number"
                            />
                        </div>

                        {/* Address auto-filled from map, read-only or editable? User said 'only lang and loing', implying minimal text input. */}
                        <div className="form-group">
                            <label className="form-label">Selected Address</label>
                            <textarea
                                className="form-input"
                                value={addressLine1}
                                readOnly
                                rows={3}
                                placeholder="Use the map to select location..."
                                style={{ backgroundColor: '#f8fafc', color: '#64748b', resize: 'none' }}
                            />
                            {city && <div style={{fontSize: '0.8rem', marginTop: '4px', color: '#94a3b8'}}>{city}, {state} - {pincode}</div>}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', paddingTop: '2rem' }}>
                            <button onClick={onClose} className="btn" style={{ flex: 1, border: '1px solid var(--border)' }}>Cancel</button>
                            <button onClick={handleSave} disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                                {loading ? 'Saving...' : 'Save Address'}
                            </button>
                        </div>
                    </div>

                    {/* RIGHT: Map */}
                    <div className="right-panel" style={{ paddingLeft: '0', borderLeft: 'none' }}>
                        <label className="form-label" style={{ marginBottom: '0.5rem' }}>
                            Set Location on Map
                        </label>
                        <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', minHeight: '300px' }}>
                            <LocationPickerMap
                                onLocationSelect={handleMapLocationSelect}
                                style={{ width: '100%', height: '100%' }}
                                pincode={pincode}
                                selectedLocation={mapLocation}
                                suggestions={suggestions}
                            />
                        </div>
                        <p className="text-sm text-muted" style={{ marginTop: '0.5rem' }}>
                            Click on the map to pinpoint the exact location.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}