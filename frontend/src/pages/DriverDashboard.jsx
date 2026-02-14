import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { SearchOutlined } from '@ant-design/icons';
import './DriverDashboard.css'; 

export default function DriverDashboard() {
    const { token, user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('active'); // 'active' | 'history'

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    useEffect(() => {
        setStatusFilter('ALL');
    }, [viewMode]);

    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
    const [vehicleDetails, setVehicleDetails] = useState(null);

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

    // Generic Modal State
    const [notification, setNotification] = useState({ show: false, type: 'info', message: '' });
    const [confirmation, setConfirmation] = useState({ show: false, title: '', message: '', onConfirm: null });

    const closeNotification = () => setNotification({ ...notification, show: false });
    const closeConfirmation = () => setConfirmation({ ...confirmation, show: false });

    const { logout } = useAuth(); // Destructure logout from useAuth

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    const fetchVehicleDetails = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/driver/me/vehicle');
            setVehicleDetails(res.data);
            setIsVehicleModalOpen(true);
            setIsProfileMenuOpen(false);
        } catch (err) {
            console.error(err);
            setNotification({ show: true, type: 'error', message: err.response?.data?.detail || "Failed to fetch vehicle details" });
        }
    };

    // Close menu when clicking outside (simple implementation)
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isProfileMenuOpen && !event.target.closest('.profile-menu-container')) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isProfileMenuOpen]);

    const navigate = useNavigate();

    // ...

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        axios.get('http://127.0.0.1:8000/driver/orders')
            .then(res => setOrders(res.data))
            .catch(err => {
                console.error("Failed to fetch driver orders", err);
                if (err.response?.status === 401) {
                    logout();
                    navigate('/login');
                }
            })
            .finally(() => setLoading(false));
    }, [token, logout, navigate]);

    const handlePasswordChange = async () => {
        setPasswordMessage({ type: '', text: '' });
        
        if (!passwordForm.oldPassword || !passwordForm.newPassword) {
            setPasswordMessage({ type: 'error', text: 'Please fill in all fields' });
            return;
        }
        
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        try {
            await axios.post('http://127.0.0.1:8000/auth/change-password', {
                old_password: passwordForm.oldPassword,
                new_password: passwordForm.newPassword
            });
            setPasswordMessage({ type: 'success', text: 'Password updated successfully' });
            setTimeout(() => {
                setIsPasswordModalOpen(false);
                setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                setPasswordMessage({ type: '', text: '' });
            }, 1500);
        } catch (err) {
            setPasswordMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update password' });
        }
    };

    const handleStartShipment = (orderId) => {
        setConfirmation({
            show: true,
            title: 'Start Trip',
            message: 'Are you sure you want to start this trip?',
            onConfirm: async () => {
                try {
                    await axios.post(`http://127.0.0.1:8000/orders/${orderId}/start-shipment`);
                    // Refresh orders
                    const res = await axios.get('http://127.0.0.1:8000/driver/orders');
                    setOrders(res.data);
                    setNotification({ show: true, type: 'success', message: 'Trip started successfully' });
                } catch (err) {
                    console.error(err);
                    setNotification({ show: true, type: 'error', message: err.response?.data?.detail || "Failed to start shipment" });
                }
                closeConfirmation();
            }
        });
    };

    const handleConfirmDelivery = (orderId) => {
        setConfirmation({
            show: true,
            title: 'Confirm Delivery',
            message: 'Are you sure you want to mark this order as delivered?',
            onConfirm: async () => {
                try {
                    await axios.post(`http://127.0.0.1:8000/orders/${orderId}/confirm-delivery`);
                    // Refresh orders
                    const res = await axios.get('http://127.0.0.1:8000/driver/orders');
                    setOrders(res.data);
                    setNotification({ show: true, type: 'success', message: 'Delivery confirmed successfully' });
                } catch (err) {
                    console.error(err);
                    setNotification({ show: true, type: 'error', message: err.response?.data?.detail || "Failed to confirm delivery" });
                }
                closeConfirmation();
            }
        });
    };

    const displayedOrders = useMemo(() => {
        return orders.filter(order => {
            // View Mode Filter
            let matchesView = false;
            if (viewMode === 'active') {
                 matchesView = order.status !== 'DELIVERED' && order.status !== 'CANCELLED';
            } else {
                 matchesView = order.status === 'DELIVERED';
            }

            const matchesSearch = (
                (order.item_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (order.id || '').toString().includes(searchTerm) ||
                (order.pickup_address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (order.drop_address || '').toLowerCase().includes(searchTerm.toLowerCase())
            );

            const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;

            return matchesView && matchesSearch && matchesStatus;
        });
    }, [orders, viewMode, searchTerm, statusFilter]);

    const completedOrders = orders.filter(o => o.status === 'SHIPPED' || o.status === 'DELIVERED').length;
    const assignedOrders = orders.filter(o => o.status === 'ASSIGNED').length;




    // ... (existing useEffect and handlers)

    return (
        <div className="driver-dashboard-container">
            <div className="driver-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="driver-title">Driver Dashboard</h1>
                    </div>

                    {/* View Mode Toggle */}
                    <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <button
                            onClick={() => setViewMode('active')}
                            style={{
                                padding: '6px 16px',
                                borderRadius: '6px',
                                border: 'none',
                                background: viewMode === 'active' ? 'white' : 'transparent',
                                color: viewMode === 'active' ? '#2563eb' : '#64748b',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                boxShadow: viewMode === 'active' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setViewMode('history')}
                            style={{
                                padding: '6px 16px',
                                borderRadius: '6px',
                                border: 'none',
                                background: viewMode === 'history' ? 'white' : 'transparent',
                                color: viewMode === 'history' ? '#2563eb' : '#64748b',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                boxShadow: viewMode === 'history' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            History
                        </button>
                    </div>
                    
                    {/* Profile Menu */}
                    <div className="profile-menu-container" style={{ position: 'relative' }}>
                        <button 
                            className="profile-avatar-btn"
                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: '#2563eb',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.2rem',
                                fontWeight: 700,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        >
                            {user?.name?.charAt(0).toUpperCase() || 'D'}
                        </button>
                        
                        {isProfileMenuOpen && (
                            <div className="profile-dropdown" style={{
                                position: 'absolute',
                                top: '120%',
                                right: 0,
                                background: 'white',
                                borderRadius: '0.75rem',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                border: '1px solid #e2e8f0',
                                width: '200px',
                                zIndex: 50,
                                overflow: 'hidden'
                            }}>
                                <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{user?.name || 'Driver'}</div>
                                </div>
                                <div style={{ padding: '0.5rem' }}>
                                    <button 
                                        onClick={fetchVehicleDetails}
                                        className="dropdown-item"
                                        style={{ width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 012-2v0a2 2 0 012 2m9 0a2 2 0 012-2v0a2 2 0 012 2" /></svg>
                                        Vehicle Details
                                    </button>
                                    <button 
                                        onClick={() => { setIsPasswordModalOpen(true); setIsProfileMenuOpen(false); }}
                                        className="dropdown-item"
                                        style={{ width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                        Change Password
                                    </button>
                                    <div style={{ height: '1px', background: '#f1f5f9', margin: '0.5rem 0' }}></div>
                                    <button 
                                        onClick={handleLogout}
                                        className="dropdown-item"
                                        style={{ width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="driver-stats-grid">
               <div className="driver-stat-card">
                   <div className="driver-stat-label">Assigned Orders</div>
                   <div className="driver-stat-value">{assignedOrders}</div>
               </div>
               <div className="driver-stat-card">
                   <div className="driver-stat-label">Completed Orders</div>
                   <div className="driver-stat-value">{completedOrders}</div>
               </div>
               <div className="driver-stat-card">
                   <div className="driver-stat-label">Total History</div>
                   <div className="driver-stat-value">{orders.length}</div>
               </div>
            </div>

            {/* Orders List */}
            <div className="orders-section">
                
                
                {/* Filter Bar */}
                <div className="filter-bar">
                    <div className="search-input-wrapper">
                        <SearchOutlined className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search orders..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <div className="status-filters">
                        {(viewMode === 'active' 
                            ? ['ALL', 'ASSIGNED', 'SHIPPED'] 
                            : ['ALL']
                        ).map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`status-filter-btn ${statusFilter === status ? 'active' : ''}`}
                            >
                                {status === 'ALL' ? (viewMode === 'active' ? 'All Active' : 'All History') : status.charAt(0) + status.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>

            {/* Orders List */}
            <h2 className="section-title">{viewMode === 'active' ? 'Active Assignments' : 'Delivery History'}</h2>
            
            {displayedOrders.length === 0 ? (
                <div className="empty-state">
                    <p>{viewMode === 'active' ? 'No active assignments' : 'No delivery history found'}</p>
                </div>
            ) : (
                <div className="orders-list">
                    {displayedOrders.map(o => (
                        <div key={o.id} className="order-card">
                                <div className="order-header">
                                    <div className="item-info">
                                        <span className="order-id">#{o.id}</span>
                                        <div className="item-name">{o.item_name}</div>
                                        <div className="item-specs">
                                            {o.weight_kg}kg • {o.volume_m3 < 0.001 ? o.volume_m3.toFixed(6) : o.volume_m3.toFixed(3)}m³
                                        </div>
                                    </div>
                                    <span className={`order-status status-${o.status.toLowerCase()}`}>
                                        {o.status}
                                    </span>
                                </div>
                                
                                <div className="order-details-grid">
                                    {/* Pickup */}
                                    <div className="location-box">
                                        <div className="location-header" style={{ color: '#2563eb' }}>
                                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                            </svg>
                                            Pickup
                                        </div>
                                        <div className="coord-badge">
                                            {(o.pickup_latitude || o.latitude).toFixed(4)}, {(o.pickup_longitude || o.longitude).toFixed(4)}
                                        </div>
                                        {o.pickup_address ? (
                                             <div className="address-text">{o.pickup_address}</div>
                                        ) : (
                                            <div className="address-text" style={{color: '#94a3b8', fontStyle: 'italic'}}>No address provided</div>
                                        )}
                                    </div>

                                    {/* Drop */}
                                    <div className="location-box">
                                        <div className="location-header" style={{ color: '#16a34a' }}>
                                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                            </svg>
                                            Drop
                                        </div>
                                        {o.drop_latitude ? (
                                            <>
                                                <div className="coord-badge">
                                                    {o.drop_latitude.toFixed(4)}, {o.drop_longitude.toFixed(4)}
                                                </div>
                                                {o.drop_address ? (
                                                    <div className="address-text">{o.drop_address}</div>
                                                ) : (
                                                    <div className="address-text" style={{color: '#94a3b8', fontStyle: 'italic'}}>No address provided</div>
                                                )}
                                            </>
                                        ) : (
                                            <div style={{ color: '#94a3b8', fontSize: '0.9rem', padding: '0.5rem 0' }}>Not specified</div>
                                        )}
                                    </div>
                                </div>

                                
                                {/* Order Actions */}
                                {(o.status === 'ASSIGNED' || o.status === 'SHIPPED') && (
                                    <div className="order-actions" style={{marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end'}}>
                                        {o.status === 'ASSIGNED' && (
                                            <button 
                                                className="btn-action start-trip"
                                                onClick={() => handleStartShipment(o.id)}
                                                style={{
                                                    background: '#2563eb', 
                                                    color: 'white', 
                                                    padding: '0.5rem 1.5rem', 
                                                    borderRadius: '0.5rem',
                                                    fontWeight: 500,
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                                                }}
                                            >
                                                Start Trip
                                            </button>
                                        )}
                                        {o.status === 'SHIPPED' && (
                                            !o.driver_confirmed_delivery ? (
                                                <button 
                                                    className="btn-action mark-delivered"
                                                    onClick={() => handleConfirmDelivery(o.id)}
                                                    style={{
                                                        background: '#16a34a', 
                                                        color: 'white', 
                                                        padding: '0.5rem 1.5rem', 
                                                        borderRadius: '0.5rem',
                                                        fontWeight: 500,
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)'
                                                    }}
                                                >
                                                    Mark Delivered
                                                </button>
                                            ) : (
                                                <div style={{
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '0.5rem',
                                                    color: '#d97706',
                                                    background: '#fffbeb',
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '0.5rem',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500
                                                }}>
                                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Waiting for Customer Confirmation
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Password Change Modal */}
            {isPasswordModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px', backgroundColor: 'white', padding: '2rem', borderRadius: '1rem' }}>
                        <div className="modal-header" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem'}}>
                            <h3 className="modal-title" style={{fontSize: '1.25rem', fontWeight: 600}}>Change Password</h3>
                            <button onClick={() => setIsPasswordModalOpen(false)} className="modal-close-btn" style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer'}}>&times;</button>
                        </div>
                        {/* ... existing password form content ... */}
                        <div>
                            {passwordMessage.text && (
                                <div className={`alert ${passwordMessage.type === 'error' ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '0.375rem', fontSize: '0.875rem', backgroundColor: passwordMessage.type === 'error' ? '#fee2e2' : '#dcfce7', color: passwordMessage.type === 'error' ? '#dc2626' : '#16a34a' }}>
                                    {passwordMessage.text}
                                </div>
                            )}
                            <div className="form-group" style={{marginBottom: '1rem'}}>
                                <label className="form-label" style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500}}>Current Password</label>
                                <input 
                                    type="password" 
                                    className="form-input"
                                    style={{width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0'}}
                                    value={passwordForm.oldPassword}
                                    onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div className="form-group" style={{marginBottom: '1rem'}}>
                                <label className="form-label" style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500}}>New Password</label>
                                <input 
                                    type="password" 
                                    className="form-input"
                                    style={{width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0'}}
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div className="form-group" style={{marginBottom: '1.5rem'}}>
                                <label className="form-label" style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500}}>Confirm New Password</label>
                                <input 
                                    type="password" 
                                    className="form-input"
                                    style={{width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0'}}
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                                    placeholder="Confirm new password"
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button onClick={() => setIsPasswordModalOpen(false)} className="btn" style={{padding: '0.5rem 1rem', background: '#f1f5f9', border: 'none', borderRadius: '0.375rem', cursor: 'pointer'}}>Cancel</button>
                                <button onClick={handlePasswordChange} className="btn btn-primary" style={{padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer'}}>Update Password</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Vehicle Details Modal */}
            {isVehicleModalOpen && vehicleDetails && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px', backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', width: '90%' }}>
                        <div className="modal-header" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center'}}>
                            <h3 className="modal-title" style={{fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                <div style={{width: '40px', height: '40px', background: '#eff6ff', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb'}}>
                                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 012-2v0a2 2 0 012 2m9 0a2 2 0 012-2v0a2 2 0 012 2" /></svg>
                                </div>
                                Vehicle Details
                            </h3>
                            <button onClick={() => setIsVehicleModalOpen(false)} className="modal-close-btn" style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer'}}>&times;</button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div>
                                <div style={{fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem'}}>Vehicle Number</div>
                                <div style={{fontSize: '1.125rem', fontWeight: 600, color: '#1e293b'}}>{vehicleDetails.vehicle_number}</div>
                            </div>
                            <div>
                                <div style={{fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem'}}>Current Zone</div>
                                <div style={{fontSize: '1rem', color: '#334155'}}>{vehicleDetails.zone?.name || 'Unassigned'}</div>
                            </div>
                            
                            <div style={{gridColumn: '1 / -1', background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                                    <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#475569'}}>Capacity Utilization</span>
                                    <span style={{fontSize: '0.875rem', fontWeight: 600, color: vehicleDetails.utilization_percentage > 90 ? '#dc2626' : '#2563eb'}}>
                                        {vehicleDetails.utilization_percentage.toFixed(1)}%
                                    </span>
                                </div>
                                <div style={{height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden'}}>
                                    <div style={{
                                        width: `${Math.min(vehicleDetails.utilization_percentage, 100)}%`,
                                        height: '100%',
                                        background: vehicleDetails.utilization_percentage > 90 ? '#dc2626' : '#2563eb',
                                        transition: 'width 0.5s ease'
                                    }}></div>
                                </div>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.75rem', color: '#64748b'}}>
                                    <span>Current: {vehicleDetails.current_volume_m3.toFixed(3)} m³</span>
                                    <span>Max: {vehicleDetails.max_volume_m3} m³</span>
                                </div>
                            </div>

                            <div style={{gridColumn: '1 / -1', display: 'flex', gap: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem'}}>
                                <div>
                                    <div style={{fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem'}}>Max Weight</div>
                                    <div style={{fontSize: '0.95rem', color: '#334155'}}>{vehicleDetails.max_weight_kg} kg</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setIsVehicleModalOpen(false)} className="btn btn-primary" style={{padding: '0.625rem 1.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500}}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Modal */}
            {notification.show && (
                <div className="modal-overlay" style={{zIndex: 2000}}>
                    <div className="modal-content" style={{ maxWidth: '400px', backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', width: '90%', textAlign: 'center' }}>
                        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                            {notification.type === 'error' ? (
                                <div style={{ width: '50px', height: '50px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                                    <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                            ) : (
                                <div style={{ width: '50px', height: '50px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                                    <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                            )}
                        </div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>
                            {notification.type === 'error' ? 'Error' : 'Success'}
                        </h3>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{notification.message}</p>
                        <button 
                            onClick={closeNotification}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '0.75rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500 }}
                        >
                            Okay
                        </button>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmation.show && (
                <div className="modal-overlay" style={{zIndex: 2000}}>
                    <div className="modal-content" style={{ maxWidth: '400px', backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', width: '90%' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.75rem' }}>{confirmation.title}</h3>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>{confirmation.message}</p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button 
                                onClick={closeConfirmation}
                                className="btn" 
                                style={{ padding: '0.625rem 1.25rem', background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', color: '#475569', fontWeight: 500 }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmation.onConfirm}
                                className="btn btn-primary" 
                                style={{ padding: '0.625rem 1.25rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500 }}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
