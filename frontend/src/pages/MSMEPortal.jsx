import { useState, useEffect } from 'react';
import axios from 'axios';
import LocationPickerMap from '../components/LocationPickerMap';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import './MSMEPortal.css';

export default function MSMEPortal() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            const res = await axios.get('http://localhost:8000/orders');
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

    const pendingCount = orders.filter(o => o.status === 'PENDING').length;

    return (
        <div>
            {/* Header */}
            <div className="portal-header">
                <div>
                    <h1 className="portal-title">Order Management</h1>
                    <p className="portal-subtitle">Manage active shipments and book new logistics orders.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    New Shipment
                </button>
            </div>

            {/* Stats Row */}
            <div className="stats-row">
                <div className="card stat-card-flex">
                    <div>
                        <p className="stat-label">Total Orders</p>
                        <div className="stat-number-wrapper">
                            <h2 className="stat-number">{orders.length}</h2>
                        </div>
                    </div>
                    <div className="stat-icon stat-icon-blue">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                    </div>
                </div>

                <div className="card stat-card-flex">
                    <div>
                        <p className="stat-label">Pending Assignment</p>
                        <div className="stat-number-wrapper">
                            <h2 className="stat-number">{pendingCount}</h2>
                            <span className="stat-number-suffix">Orders</span>
                        </div>
                    </div>
                    <div className="stat-icon stat-icon-amber">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div>
                </div>
            </div>

            {/* Shipment List */}
            <h3 className="shipments-title">My Shipments</h3>
            <ShipmentTable orders={orders} />

            {/* New Shipment Modal */}
            {isModalOpen && (
                <NewShipmentModal
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchOrders();
                    }}
                />
            )}
        </div>
    );
}

function ShipmentTable({ orders }) {
    if (orders.length === 0) {
        return <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No orders found. Create your first shipment!</div>;
    }

    return (
        <div className="card shipment-table-wrapper">
            <table className="shipment-data-table">
                <thead className="shipment-table-head">
                    <tr>
                        <th className="shipment-th">Order ID</th>
                        <th className="shipment-th">Item Name</th>
                        <th className="shipment-th">Dimensions</th>
                        <th className="shipment-th">Volume</th>
                        <th className="shipment-th">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((o) => (
                        <tr key={o.id} className="shipment-tr">
                            <td className="shipment-id-td">#{o.id}</td>
                            <td className="shipment-td-bold">{o.item_name || 'General Cargo'}</td>
                            <td className="shipment-td-muted">{o.length_cm}x{o.width_cm}x{o.height_cm} cm • {o.weight_kg} kg</td>
                            <td className="shipment-td-muted">
                                {o.volume_m3 < 0.0001 && o.volume_m3 > 0
                                    ? o.volume_m3.toFixed(6)
                                    : o.volume_m3.toFixed(4)} m³
                            </td>
                            <td className="shipment-td">
                                <span className={`badge ${o.status === 'SHIPPED' ? 'badge-success' :
                                    o.status === 'ASSIGNED' ? 'badge-warning' : 'badge-neutral'
                                    }`}>
                                    {o.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function NewShipmentModal({ onClose, onSuccess }) {
    const { showAlert } = useModal();
    const [pickupLocation, setPickupLocation] = useState(null);
    const [itemName, setItemName] = useState('');
    const [weight, setWeight] = useState('');
    const [dims, setDims] = useState({ l: '', w: '', h: '' });
    const [loading, setLoading] = useState(false);

    const [volumeUnit, setVolumeUnit] = useState('m3'); // m3, cm3, ft3
    const [showUnitMenu, setShowUnitMenu] = useState(false);

    const getVolumeDisplay = () => {
        if (!dims.l || !dims.w || !dims.h) return '0.00';
        const v_cm3 = dims.l * dims.w * dims.h;

        if (volumeUnit === 'm3') {
             const v_m3 = v_cm3 / 1000000;
             return v_m3 < 0.0001 && v_m3 > 0 ? v_m3.toFixed(6) : v_m3.toFixed(4);
        }
        if (volumeUnit === 'cm3') return v_cm3.toFixed(2);
        if (volumeUnit === 'ft3') return (v_cm3 / 28316.85).toFixed(4);
        return '0.00';
    };

    const handleCreate = async () => {
        // Validation: At least one letter, only letters/numbers/spaces
        const nameRegex = /^[a-zA-Z0-9\s]+$/;
        const hasLetter = /[a-zA-Z]/;

        if (!itemName || !weight || !dims.l || !dims.w || !dims.h || !pickupLocation) {
            showAlert("Missing Information", "Please fill all fields and select a location.");
            return;
        }

        if (!nameRegex.test(itemName) || !hasLetter.test(itemName)) {
            showAlert("Invalid Item Name", "Item Name must contain letters and numbers only (no special characters), and must include at least one letter.");
            return;
        }

        setLoading(true);
        try {
            await axios.post('http://localhost:8000/orders', {
                item_name: itemName,
                length_cm: parseFloat(dims.l),
                width_cm: parseFloat(dims.w),
                height_cm: parseFloat(dims.h),
                weight_kg: parseFloat(weight),
                latitude: pickupLocation.lat,
                longitude: pickupLocation.lng
            });
            onSuccess();
        } catch (err) {
            console.error(err);
            showAlert("Error", "Failed to create order");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="drawer-overlay">
            <div className="drawer-content">
                <div className="drawer-header">
                    <h2 className="drawer-title">New Shipment</h2>
                    <button onClick={onClose} className="drawer-close-btn">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="new-shipment-grid">
                    {/* Left Panel: Map & Discovery */}
                    <div className="left-panel">
                        <label className="form-label" style={{ marginBottom: '0.5rem' }}>Pickup Location & Discovery</label>
                        <LocationPickerMap
                            onLocationSelect={setPickupLocation}
                            style={{ flex: 1, minHeight: '400px' }}
                        />
                        {pickupLocation && (
                            <div className="location-selected-text" style={{ marginTop: '1rem' }}>
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                Location Selected: {pickupLocation.lat.toFixed(4)}, {pickupLocation.lng.toFixed(4)}
                            </div>
                        )}
                        {!pickupLocation && (
                            <div className="location-selected-text" style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
                                No location selected. Search or click map.
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Shipment Details */}
                    <form className="right-panel" onSubmit={e => e.preventDefault()}>

                        <div className="form-group">
                            <label className="form-label">Item Name / Description</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                                </div>
                                <input
                                    className="form-input"
                                    placeholder="e.g. Electronic Components"
                                    style={{ paddingLeft: '36px' }}
                                    value={itemName}
                                    onChange={e => setItemName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Dimensions (cm)</label>
                            <div className="dimensions-grid">
                                <div>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="L"
                                        style={{ textAlign: 'center' }}
                                        value={dims.l}
                                        onChange={e => setDims({ ...dims, l: e.target.value })}
                                    />
                                    <span className="dim-label">Length</span>
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="W"
                                        style={{ textAlign: 'center' }}
                                        value={dims.w}
                                        onChange={e => setDims({ ...dims, w: e.target.value })}
                                    />
                                    <span className="dim-label">Width</span>
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="H"
                                        style={{ textAlign: 'center' }}
                                        value={dims.h}
                                        onChange={e => setDims({ ...dims, h: e.target.value })}
                                    />
                                    <span className="dim-label">Height</span>
                                </div>
                            </div>
                        </div>

                        {/* Calculated Volume Highlight */}
                        <div className="volume-highlight">
                            <div className="volume-icon">
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div className="volume-text-label">Calculated Volume</div>
                                <div className="volume-value">
                                    {getVolumeDisplay()}
                                    <span style={{ fontSize: '0.8em', marginLeft: '4px', opacity: 0.7 }}>
                                        {volumeUnit === 'm3' ? 'm³' : volumeUnit === 'cm3' ? 'cm³' : 'ft³'}
                                    </span>
                                </div>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowUnitMenu(!showUnitMenu)}
                                    className="btn"
                                    style={{ padding: '4px 8px', fontSize: '0.8rem', background: 'var(--bg)', border: '1px solid var(--border)' }}
                                >
                                    Change Unit ▼
                                </button>
                                {showUnitMenu && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        background: 'white',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '0.375rem',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        zIndex: 10,
                                        marginTop: '4px',
                                        minWidth: '80px',
                                        color: 'var(--text-main)'
                                    }}>
                                        {['m3', 'cm3', 'ft3'].map(unit => (
                                            <div
                                                key={unit}
                                                onClick={() => { setVolumeUnit(unit); setShowUnitMenu(false); }}
                                                style={{
                                                    padding: '8px 12px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem',
                                                    background: volumeUnit === unit ? '#f1f5f9' : 'transparent',
                                                    borderBottom: '1px solid #f1f5f9'
                                                }}
                                            >
                                                {unit === 'm3' ? 'm³' : unit === 'cm3' ? 'cm³' : 'ft³'}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Total Weight (kg)</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><path d="M3 3l18 18"></path></svg>
                                </div>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="0.0"
                                    style={{ paddingLeft: '36px' }}
                                    value={weight}
                                    onChange={e => setWeight(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Spacer to push buttons down if needed */}
                        <div style={{ flex: 1 }}></div>

                        <div className="drawer-actions" style={{ marginTop: 'auto' }}>
                            <button type="button" onClick={onClose} className="btn" style={{ flex: 1, border: '1px solid var(--border)' }}>Cancel</button>
                            <button
                                type="button"
                                onClick={handleCreate}
                                disabled={loading}
                                className="btn btn-primary"
                                style={{ flex: 2 }}
                            >
                                {loading ? 'Creating...' : 'Confirm Booking'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}