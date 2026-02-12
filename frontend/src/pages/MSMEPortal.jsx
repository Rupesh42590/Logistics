import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import LocationPickerMap from '../components/LocationPickerMap';
import AddAddressModal from '../components/AddAddressModal';
import { API_BASE_URL } from '../apiConfig';
import './MSMEPortal.css';

// Ant Design imports
import { Card, Input, Empty, Tag, Table, Button, Statistic, Row, Col, Drawer, Divider, Space, Typography } from 'antd';
import { EnvironmentOutlined, PhoneOutlined, UserOutlined, PlusOutlined, SearchOutlined, CompassOutlined, BoxPlotOutlined } from '@ant-design/icons';

export default function MSMEPortal() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewShipmentModal, setShowNewShipmentModal] = useState(false);


    const fetchOrders = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/orders`);
            setOrders(res.data);
        } catch (err) {
            console.error("Failed to fetch orders", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleCreate = () => {
        setShowNewShipmentModal(false);
        fetchOrders();
    };

    const [selectedOrderForRoute, setSelectedOrderForRoute] = useState(null);

    const handleViewRoute = (order) => {
        setSelectedOrderForRoute(order);
    };

    const closeRouteModal = () => {
        setSelectedOrderForRoute(null);
    };

    // Compute Map Suggestions for the New Shipment Modal
    const mapSuggestions = useMemo(() => {
        const suggestions = [];
        const seen = new Set();

        // 1. Add Saved Addresses
        (user?.savedAddresses || []).forEach(addr => {
            if (addr.latitude && addr.longitude) {
                const key = `${addr.latitude.toFixed(6)},${addr.longitude.toFixed(6)}`;
                if (!seen.has(key)) {
                    suggestions.push({
                        lat: addr.latitude,
                        lng: addr.longitude,
                        label: `Saved: ${addr.label || addr.address_line1}`
                    });
                    seen.add(key);
                }
            }
        });

        // 2. Add Recent Shipment Locations (last 5 unique)
        orders.slice(0, 10).forEach(order => {
            // Pickup
            const pKey = `${order.latitude.toFixed(6)},${order.longitude.toFixed(6)}`;
            if (!seen.has(pKey) && suggestions.length < 15) {
                suggestions.push({
                    lat: order.latitude,
                    lng: order.longitude,
                    label: order.pickup_address || "Past Pickup"
                });
                seen.add(pKey);
            }
            // Dropoff
            if (order.drop_latitude && order.drop_longitude) {
                const dKey = `${order.drop_latitude.toFixed(6)},${order.drop_longitude.toFixed(6)}`;
                if (!seen.has(dKey) && suggestions.length < 15) {
                    suggestions.push({
                        lat: order.drop_latitude,
                        lng: order.drop_longitude,
                        label: order.drop_address || "Past Dropoff"
                    });
                    seen.add(dKey);
                }
            }
        });

        return suggestions;
    }, [user, orders]);

    return (
        <div className="msme-container">
            {/* Header */}
            <div className="msme-page-header">
                <div>
                    <h1 className="msme-page-title">Order Management</h1>
                    <p className="msme-page-subtitle">Manage active shipments and book new logistics orders.</p>
                </div>
                <Button 
                    type="primary" 
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={() => setShowNewShipmentModal(true)}
                    className="msme-primary-btn"
                >
                    New Shipment
                </Button>
            </div>

            {/* Stat Cards */}
            <div className="msme-stats-row">
                <div className="msme-stat-card msme-stat-total">
                    <span className="msme-stat-label">Total Orders</span>
                    <div className="msme-stat-value">
                        <span className="msme-stat-number">{orders.length}</span>
                    </div>
                </div>
                <div className="msme-stat-card msme-stat-pending">
                    <span className="msme-stat-label">Pending Assignment</span>
                    <div className="msme-stat-value">
                        <span className="msme-stat-number">{orders.filter(o => o.status === 'PENDING').length}</span>
                        <span className="msme-stat-suffix">orders</span>
                    </div>
                </div>
                <div className="msme-stat-card msme-stat-assigned">
                    <span className="msme-stat-label">Assigned</span>
                    <div className="msme-stat-value">
                        <span className="msme-stat-number">{orders.filter(o => o.status === 'ASSIGNED').length}</span>
                        <span className="msme-stat-suffix">orders</span>
                    </div>
                </div>
                <div className="msme-stat-card msme-stat-shipped">
                    <span className="msme-stat-label">Shipped</span>
                    <div className="msme-stat-value">
                        <span className="msme-stat-number">{orders.filter(o => o.status === 'SHIPPED' || o.status === 'DELIVERED').length}</span>
                        <span className="msme-stat-suffix">orders</span>
                    </div>
                </div>
            </div>

            <h2 className="msme-section-title">My Shipments</h2>

            {/* Shipment Table */}
            <ShipmentTable orders={orders} onViewRoute={handleViewRoute} />

            {/* Modals */}
            {/* Modals */}
            {showNewShipmentModal && (
                <NewShipmentModal onClose={() => setShowNewShipmentModal(false)} onSuccess={handleCreate} suggestions={mapSuggestions} />
            )}

            {/* Route View Modal */}
            {selectedOrderForRoute && (
                <div className="modal-overlay" onClick={closeRouteModal} style={{ zIndex: 1100 }}>
                    <div className="modal-content" style={{ maxWidth: '800px', width: '90%', height: '600px', display: 'flex', flexDirection: 'column', padding: 0 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ background: '#e0f2fe', padding: '0.5rem', borderRadius: '0.5rem', color: '#0284c7' }}>
                                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>Shipment Route</h3>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Order #{selectedOrderForRoute.id}</p>
                                </div>
                            </div>
                            <button className="close-btn" onClick={closeRouteModal}>×</button>
                        </div>
                        <div className="modal-body" style={{ flex: 1, padding: 0, overflow: 'hidden', position: 'relative' }}>
                            <MapContainer
                                bounds={[
                                    [selectedOrderForRoute.latitude, selectedOrderForRoute.longitude],
                                    [selectedOrderForRoute.drop_latitude || selectedOrderForRoute.latitude, selectedOrderForRoute.drop_longitude || selectedOrderForRoute.longitude]
                                ]}
                                style={{ width: '100%', height: '100%' }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <Marker position={[selectedOrderForRoute.latitude, selectedOrderForRoute.longitude]}>
                                    <Popup><strong>Pickup:</strong> <br /> {selectedOrderForRoute.pickup_address || "Location A"}</Popup>
                                </Marker>
                                {selectedOrderForRoute.drop_latitude && (
                                    <>
                                        <Marker position={[selectedOrderForRoute.drop_latitude, selectedOrderForRoute.drop_longitude]}>
                                            <Popup><strong>Drop:</strong> <br /> {selectedOrderForRoute.drop_address || "Location B"}</Popup>
                                        </Marker>
                                        <Polyline
                                            positions={[
                                                [selectedOrderForRoute.latitude, selectedOrderForRoute.longitude],
                                                [selectedOrderForRoute.drop_latitude, selectedOrderForRoute.drop_longitude]
                                            ]}
                                            color="#6366f1"
                                            weight={4}
                                            dashArray="10, 10"
                                        />
                                    </>
                                )}
                            </MapContainer>
                            <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, background: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', maxWidth: '250px' }}>
                                <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#475569' }}>Route Summary</h4>
                                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1e293b' }}>
                                    {calculateDistance(
                                        selectedOrderForRoute.latitude, selectedOrderForRoute.longitude,
                                        selectedOrderForRoute.drop_latitude, selectedOrderForRoute.drop_longitude
                                    )}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                                    Estimated via Direct Path
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Haversine Distance Helper
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat2 || !lon2) return "N/A";
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d.toFixed(1) + " km";
}

// Refactored Shipment List - Card Layout
function ShipmentTable({ orders, onViewRoute }) {
    if (!orders || orders.length === 0) {
        return <Empty description="No orders found. Create your first shipment!" />;
    }

    return (
        <div className="msme-orders-container">
            {orders.map(order => (
                <div key={order.id} className="msme-order-card">
                    {/* Header: ID & Status */}
                    <div className="msme-card-header">
                        <div className="msme-card-id-group">
                            <span className="msme-card-id">#{order.id}</span>
                            <span className="msme-card-item">{order.item_name || 'N/A'}</span>
                        </div>
                        <StatusBadge status={order.status} />
                    </div>

                    {/* Body: Details & Locations */}
                    <div className="msme-card-body">
                        {/* Locations Column */}
                        <div className="msme-details-section">
                            {/* Pickup */}
                            <div className="msme-location-box">
                                <div className="msme-loc-header msme-loc-pickup">
                                    <EnvironmentOutlined /> Pickup
                                </div>
                                {order.pickup_latitude && (
                                    <span className="msme-coord-badge">
                                        {order.pickup_latitude.toFixed(4)}, {order.pickup_longitude.toFixed(4)}
                                    </span>
                                )}
                                <div className="msme-address-text">
                                    {order.pickup_address || order.pickup_location || "Location not detailed"}
                                </div>
                            </div>

                            {/* Drop */}
                            <div className="msme-location-box">
                                <div className="msme-loc-header msme-loc-drop">
                                    <EnvironmentOutlined /> Drop
                                </div>
                                {order.drop_latitude && (
                                    <span className="msme-coord-badge">
                                        {order.drop_latitude.toFixed(4)}, {order.drop_longitude.toFixed(4)}
                                    </span>
                                )}
                                <div className="msme-address-text">
                                    {order.drop_address || order.drop_location || "Location not detailed"}
                                </div>
                            </div>
                        </div>

                        {/* Meta & Actions Column */}
                        <div className="msme-meta-section">
                            <div className="msme-meta-group">
                                <span className="msme-meta-label">Dimensions</span>
                                <span className="msme-meta-value">
                                    {order.length_cm} × {order.width_cm} × {order.height_cm} cm
                                </span>
                            </div>

                            <div className="msme-meta-group">
                                <span className="msme-meta-label">Weight</span>
                                <span className="msme-meta-value">{order.weight_kg} kg</span>
                            </div>

                             <div className="msme-meta-group">
                                <span className="msme-meta-label">Volume</span>
                                <span className="msme-meta-value">{order.volume_m3?.toFixed(4)} m³</span>
                            </div>

                            <div className="msme-actions">
                                <Button
                                    icon={<CompassOutlined />}
                                    onClick={() => onViewRoute(order)}
                                    className="msme-action-btn"
                                >
                                    View Route
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function StatusBadge({ status }) {
    const classMap = {
        'SHIPPED': 'msme-status-shipped',
        'DELIVERED': 'msme-status-delivered',
        'ASSIGNED': 'msme-status-assigned',
        'IN_TRANSIT': 'msme-status-in_transit',
        'PENDING': 'msme-status-pending',
        'CANCELLED': 'msme-status-cancelled',
    };
    return <span className={`msme-status-badge ${classMap[status] || 'msme-status-pending'}`}>{status}</span>;
}

function NewShipmentModal({ onClose, onSuccess, suggestions = [] }) {
    const { token, user } = useAuth();
    const [pickupLocation, setPickupLocation] = useState(null);
    const [itemName, setItemName] = useState('');
    const [weight, setWeight] = useState('');
    const [dims, setDims] = useState({ l: '', w: '', h: '' });
    const [loading, setLoading] = useState(false);
    const [isLocating, setIsLocating] = useState(false);

    // Address Fields (Pickup Defaults)
    const [contactName, setContactName] = useState('My Company');
    const [mobileNumber, setMobileNumber] = useState('0000000000');
    const [addressLine1, setAddressLine1] = useState('Headquarters');
    const [pincode, setPincode] = useState('000000');
    const [city, setCity] = useState('Default City');
    const [state, setState] = useState('Default State');

    // Drop Address Fields
    const [dropLocation, setDropLocation] = useState(null);
    const [dropContactName, setDropContactName] = useState('');
    const [dropMobileNumber, setDropMobileNumber] = useState('');
    const [dropAddressLine1, setDropAddressLine1] = useState('');
    const [dropPincode, setDropPincode] = useState('');
    const [dropCity, setDropCity] = useState('');
    const [dropState, setDropState] = useState('');
    const [dropCityOptions, setDropCityOptions] = useState([]);

    const [activeLocationType, setActiveLocationType] = useState('drop'); 

    // Autofill Pickup from User Profile
    useEffect(() => {
        if (user && user.company) {
            setContactName(user.company.name || user.email || 'My Company');
            if (user.company.address) {
                setAddressLine1(user.company.address);
                setIsLocating(true);
                
                // Try Full Address
                const query = `${user.company.address}`;
                axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=1`)
                    .then(res => {
                        if (res.data?.[0]) {
                            const data = res.data[0];
                            setPickupLocation({ lat: parseFloat(data.lat), lng: parseFloat(data.lon) });
                            if (data.address) {
                                if (data.address.postcode) setPincode(data.address.postcode);
                                setCity(data.address.city || data.address.town || data.address.village || 'City');
                                setState(data.address.state || '');
                            }
                        } else {
                            // Fallback: Try Pincode or City if available in future user profile updates
                             console.warn("Could not geocode address string automatically.");
                             // We leave pickupLocation as null, forcing user to set it.
                        }
                    })
                    .catch(err => {
                        console.error("Geocoding error", err);
                    })
                    .finally(() => setIsLocating(false));
            }
        }
    }, [user]);

    // Saved Addresses
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [showSavedAddressList, setShowSavedAddressList] = useState(false);
    const [showAddAddressModal, setShowAddAddressModal] = useState(false);
    const [cityOptions, setCityOptions] = useState([]); // List of POs

    // Save New Address Logic
    const [volumeUnit, setVolumeUnit] = useState('m3');
    const [showUnitMenu, setShowUnitMenu] = useState(false);
    const [companySearch, setCompanySearch] = useState('');

    useEffect(() => {
        fetchSavedAddresses();
    }, []);

    const fetchSavedAddresses = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/addresses`);
            setSavedAddresses(res.data);
        } catch (err) {
            console.error("Failed to fetch saved addresses", err);
        }
    };

    const handlePincodeChange = async (e, type = 'pickup') => {
        const val = e.target.value;
        if (type === 'pickup') setPincode(val);
        else setDropPincode(val);

        if (val.length === 6) {
            try {
                const res = await axios.get(`https://api.postalpincode.in/pincode/${val}`);
                if (res.data && res.data[0].Status === "Success") {
                    const postOffices = res.data[0].PostOffice;
                    if (type === 'pickup') {
                        setCityOptions(postOffices);
                        if (postOffices.length > 0) {
                            setCity(postOffices[0].Name);
                            setState(postOffices[0].State);
                        }
                    } else {
                        setDropCityOptions(postOffices);
                        if (postOffices.length > 0) {
                            setDropCity(postOffices[0].Name);
                            setDropState(postOffices[0].State);
                        }
                    }
                } else {
                    if (type === 'pickup') setCityOptions([]);
                    else setDropCityOptions([]);
                }
            } catch (err) {
                console.error("Failed to fetch pincode details", err);
                if (type === 'pickup') setCityOptions([]);
                else setDropCityOptions([]);
            }
        } else {
            if (type === 'pickup') setCityOptions([]);
            else setDropCityOptions([]);
        }
    };

    const handleAddressSelect = (addr, type = 'pickup') => {
        if (type === 'pickup') {
            setContactName(addr.recipient_name);
            setMobileNumber(addr.mobile_number);
            setAddressLine1(addr.address_line1);
            setPincode(addr.pincode);
            setCity(addr.city);
            setState(addr.state);
            if (addr.latitude && addr.longitude) {
                setPickupLocation({ lat: addr.latitude, lng: addr.longitude });
            }
        } else {
            setDropContactName(addr.recipient_name);
            setDropMobileNumber(addr.mobile_number);
            setDropAddressLine1(addr.address_line1);
            setDropPincode(addr.pincode);
            setDropCity(addr.city);
            setDropState(addr.state);
            if (addr.latitude && addr.longitude) {
                setDropLocation({ lat: addr.latitude, lng: addr.longitude });
            }
        }
        setShowSavedAddressList(false);
    };

    const [addressLoading, setAddressLoading] = useState(false);

    const handleMapLocationSelect = async (loc, type = activeLocationType) => {
        setAddressLoading(true);
        if (type === 'pickup') {
            setPickupLocation(loc);
        } else {
            setDropLocation(loc);
        }

        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}`);
            if (res.data && res.data.address) {
                const addr = res.data.address;
                const newPincode = addr.postcode || '';
                const newCity = addr.city || addr.town || addr.village || addr.county || '';
                const newState = addr.state || '';
                const newAddressLine = res.data.display_name;

                if (type === 'pickup') {
                    setPincode(newPincode);
                    setCity(newCity);
                    setState(newState);
                    setAddressLine1(newAddressLine);
                } else {
                    setDropPincode(newPincode);
                    setDropCity(newCity);
                    setDropState(newState);
                    setDropAddressLine1(newAddressLine);
                }
            }
        } catch (err) {
            console.error("Reverse geocoding failed", err);
        } finally {
            setAddressLoading(false);
        }
    };

    const getVolumeDisplay = () => {
        if (!dims.l || !dims.w || !dims.h) return '0.000000';
        const v_cm3 = dims.l * dims.w * dims.h;

        if (volumeUnit === 'm3') return (v_cm3 / 1000000).toFixed(6);
        if (volumeUnit === 'cm3') return v_cm3.toFixed(2);
        if (volumeUnit === 'ft3') return (v_cm3 / 28316.85).toFixed(4);
        return '0.00';
    };

    const handleCreate = async () => {
        const missingFields = [];
        if (!itemName) missingFields.push("Item Description");
        if (!weight) missingFields.push("Weight");
        if (!dims.l || !dims.w || !dims.h) missingFields.push("Dimensions (L, W, H)");
        if (!dropLocation) missingFields.push("Drop Location (Map)");

        // Pickup Details
        if (!contactName) missingFields.push("Pickup Sender Name");
        if (!mobileNumber) missingFields.push("Pickup Mobile");
        if (!pincode) missingFields.push("Pickup Pincode");

        // Drop Details
        if (!dropContactName) missingFields.push("Drop Recipient Name");
        if (!dropMobileNumber) missingFields.push("Drop Mobile");
        if (!dropPincode) missingFields.push("Drop Pincode");

        if (missingFields.length > 0) {
            alert(`Please fill the following required fields:\n- ${missingFields.join('\n- ')}`);
            return;
        }

        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // 2. Create Order
            const payload = {
                item_name: itemName,
                length_cm: parseFloat(dims.l),
                width_cm: parseFloat(dims.w),
                height_cm: parseFloat(dims.h),
                weight_kg: parseFloat(weight),
                // Send new standardized fields
                pickup_latitude: pickupLocation ? pickupLocation.lat : 20.5937,
                pickup_longitude: pickupLocation ? pickupLocation.lng : 78.9629,
                pickup_address: addressLine1 || `${city}, ${state}`,
                
                drop_latitude: dropLocation ? dropLocation.lat : null,
                drop_longitude: dropLocation ? dropLocation.lng : null,
                drop_address: dropAddressLine1 || `${dropCity}, ${dropState}`,

                // Legacy support if needed
                latitude: pickupLocation ? pickupLocation.lat : 20.5937,
                longitude: pickupLocation ? pickupLocation.lng : 78.9629
            };
            await axios.post(`${API_BASE_URL}/orders`, payload, config);
            onSuccess();
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) {
                alert("Session expired. Please log out and log in again.");
                return;
            }
            let errorMsg = "Failed to create order";
            if (err.response?.data?.detail) {
                if (typeof err.response.data.detail === 'string') {
                    errorMsg = err.response.data.detail;
                } else if (Array.isArray(err.response.data.detail)) {
                    // Pydantic validation errors
                    errorMsg = err.response.data.detail.map(e => `${e.loc.join('.')}: ${e.msg}`).join('\n');
                } else {
                    errorMsg = JSON.stringify(err.response.data.detail);
                }
            } else if (err.message) {
                errorMsg = err.message;
            }
            alert(`Error:\n${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="drawer-overlay">
                <div className="drawer-content">
                    <div className="drawer-header">
                        <h2 className="drawer-title">New Shipment</h2>
                        <button onClick={onClose} className="drawer-close-btn">
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    <div className="new-shipment-grid">
                        {/* Left Panel: Listed Companies - Redesigned with Ant Design */}
                        <div className="left-panel flex flex-col h-full pr-4">
                            <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                                <Typography.Text strong style={{ fontSize: 15, color: '#334155' }}>Select Drop Account</Typography.Text>
                                <Button
                                    size="small"
                                    icon={<PlusOutlined />}
                                    onClick={() => setShowAddAddressModal(true)}
                                    style={{
                                        borderRadius: 20,
                                        border: '1.5px dashed #818cf8',
                                        color: '#4f46e5',
                                        fontWeight: 600,
                                        fontSize: 12,
                                        padding: '0 16px',
                                        height: 32,
                                        background: '#eef2ff',
                                    }}
                                >
                                    Add New
                                </Button>
                            </div>

                            <Input
                                placeholder="Search listed companies..."
                                prefix={<SearchOutlined className="text-slate-400" />}
                                allowClear
                                value={companySearch}
                                onChange={e => setCompanySearch(e.target.value)}
                                style={{ marginBottom: 16 }}
                                size="large"
                            />

                            <div className="flex-1 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {savedAddresses
                                    .filter(addr =>
                                        (addr.label || '').toLowerCase().includes(companySearch.toLowerCase()) ||
                                        (addr.recipient_name || '').toLowerCase().includes(companySearch.toLowerCase())
                                    )
                                    .map(addr => (
                                        <Card
                                            key={addr.id}
                                            size="small"
                                            hoverable
                                            onClick={() => handleAddressSelect(addr, activeLocationType)}
                                            className="cursor-pointer transition-all hover:border-indigo-500 hover:shadow-md"
                                            styles={{ body: { padding: '12px 16px' } }}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Tag color="blue" className="m-0">{addr.label || 'Company'}</Tag>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-700 font-medium mb-1">
                                                        <UserOutlined className="text-slate-400" />
                                                        {addr.recipient_name}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                                        <EnvironmentOutlined className="text-slate-400" />
                                                        {addr.city}, {addr.state}
                                                    </div>
                                                    {addr.mobile_number && (
                                                        <div className="flex items-center gap-2 text-slate-400 text-xs mt-1">
                                                            <PhoneOutlined />
                                                            {addr.mobile_number}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                {savedAddresses.filter(addr =>
                                    (addr.label || '').toLowerCase().includes(companySearch.toLowerCase()) ||
                                    (addr.recipient_name || '').toLowerCase().includes(companySearch.toLowerCase())
                                ).length === 0 && (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description={
                                            <span className="text-slate-500">
                                                No companies found.<br />Click "Add New" to add one.
                                            </span>
                                        }
                                        className="py-8"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Right Panel: Form Details */}
                        <form className="right-panel" onSubmit={e => e.preventDefault()}>
                            <div className="right-panel-scroll">

                                {/* Pickup details are auto-detected from user profile and hidden from UI */}

                                {/* Section: Drop Details (Always Visible) */}
                                <h4 className="section-title" style={{ marginTop: 8, marginBottom: 12 }}>Drop Details</h4>
                                {/* Show Selected Company Card or Placeholder */}
                                {dropAddressLine1 ? (
                                    <div style={{ 
                                        padding: '1rem', 
                                        borderRadius: '0.5rem', 
                                        border: '1px solid #e2e8f0', 
                                        background: '#f8fafc',
                                        marginBottom: '1rem'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: '600', color: '#334155' }}>To: {dropContactName}</span>
                                            <button 
                                                onClick={() => {
                                                    setDropContactName('');
                                                    setDropMobileNumber('');
                                                    setDropAddressLine1('');
                                                    setDropPincode('');
                                                    setDropCity('');
                                                    setDropState('');
                                                    setDropLocation(null);
                                                }}
                                                style={{ color: '#ef4444', fontSize: '0.8rem', background: 'none', border: 'none', cursor: 'pointer' }}
                                            >
                                                Change
                                            </button>
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '4px' }}>{dropAddressLine1}</div>
                                        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>{dropCity}, {dropState} - {dropPincode}</div>
                                        {dropMobileNumber && <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>Ph: {dropMobileNumber}</div>}
                                    </div>
                                ) : (
                                    <div style={{ 
                                        padding: '1.5rem', 
                                        textAlign: 'center', 
                                        border: '1px dashed #cbd5e1', 
                                        borderRadius: '0.5rem',
                                        background: '#f1f5f9',
                                        color: '#64748b',
                                        marginBottom: '1rem'
                                    }}>
                                        Please select a listed company from the left panel.
                                    </div>
                                )}


                                <hr className="divider" />

                                {/* Section: Shipment Details */}
                                <h4 className="section-title" style={{ marginTop: 8, marginBottom: 12 }}>Shipment Details</h4>
                                <div className="form-group">
                                    <label className="form-label">Item Description</label>
                                    <input className="form-input" placeholder="e.g. Electronics" value={itemName} onChange={e => setItemName(e.target.value)} />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Dimensions (cm) & Weight</label>
                                    <div className="dimensions-grid-mini">
                                        <div>
                                            <label className="text-xs text-muted mb-1 block">Length (cm)</label>
                                            <input type="number" className="form-input" placeholder="L" value={dims.l} onChange={e => setDims({ ...dims, l: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted mb-1 block">Width (cm)</label>
                                            <input type="number" className="form-input" placeholder="W" value={dims.w} onChange={e => setDims({ ...dims, w: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted mb-1 block">Height (cm)</label>
                                            <input type="number" className="form-input" placeholder="H" value={dims.h} onChange={e => setDims({ ...dims, h: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted mb-1 block">Weight (kg)</label>
                                            <input type="number" className="form-input" placeholder="Kg" value={weight} onChange={e => setWeight(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                                <div className="volume-display-mini" style={{background: '#f1f5f9', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', color: '#475569', fontWeight: '500'}}>
                                    Calculated Volume: {getVolumeDisplay()} {volumeUnit}
                                </div>

                            </div>

                            <div className="drawer-actions">
                                <button type="button" onClick={onClose} className="btn" style={{ flex: 1, border: '1px solid var(--border)' }}>Cancel</button>
                                <button
                                    type="button"
                                    onClick={handleCreate}
                                    disabled={loading}
                                    className="btn btn-primary"
                                    style={{ flex: 2 }}
                                >
                                    {loading ? 'Processing...' : 'Confirm Booking'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {showAddAddressModal && (
                <AddAddressModal
                    onClose={() => setShowAddAddressModal(false)}
                    onSuccess={() => {
                        setShowAddAddressModal(false);
                        fetchSavedAddresses();
                    }}
                />
            )}
        </>
    );
}