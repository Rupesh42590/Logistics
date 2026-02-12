import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './DriverDashboard.css'; 

export default function DriverDashboard() {
    const { token, user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            axios.get('http://127.0.0.1:8000/driver/orders')
                .then(res => setOrders(res.data))
                .catch(err => console.error("Failed to fetch driver orders", err))
                .finally(() => setLoading(false));
        }
    }, [token]);

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

    const handleStartShipment = async (orderId) => {
        if (!confirm("Are you sure you want to start this trip?")) return;
        try {
            await axios.post(`http://127.0.0.1:8000/orders/${orderId}/start-shipment`);
            // Refresh orders
            const res = await axios.get('http://127.0.0.1:8000/driver/orders');
            setOrders(res.data);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || "Failed to start shipment");
        }
    };

    const handleConfirmDelivery = async (orderId) => {
        if (!confirm("Confirm delivery?")) return;
        try {
            await axios.post(`http://127.0.0.1:8000/orders/${orderId}/confirm-delivery`);
            // Refresh orders
            const res = await axios.get('http://127.0.0.1:8000/driver/orders');
            setOrders(res.data);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || "Failed to confirm delivery");
        }
    };

    const completedOrders = orders.filter(o => o.status === 'SHIPPED').length;
    const assignedOrders = orders.filter(o => o.status === 'ASSIGNED').length;

    return (
        <div className="driver-dashboard-container">
            <div className="driver-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 className="driver-title">Driver Dashboard</h1>
                        <p className="driver-subtitle">
                           Welcome back, <span style={{fontWeight: 600, color: '#0f172a'}}>{user?.name || 'Driver'}</span>
                           <br/>
                           <span style={{fontSize: '0.85rem'}}>{user?.email || (user?.employee_id ? `ID: ${user.employee_id}` : '')}</span>
                        </p>
                    </div>
                    <button 
                        className="btn btn-secondary" 
                        onClick={() => setIsPasswordModalOpen(true)}
                        style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    >
                        Change Password
                    </button>
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
                <h3 className="orders-section-title">My Assignments</h3>
                
                {orders.length === 0 ? (
                    <div className="empty-state">
                        <p>No assigned orders found.</p>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map(o => (
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

            {/* Password Change Modal - Keeping basic styles but wrapping in div for isolation if needed */}
            {isPasswordModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px', backgroundColor: 'white', padding: '2rem', borderRadius: '1rem' }}>
                        <div className="modal-header" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem'}}>
                            <h3 className="modal-title" style={{fontSize: '1.25rem', fontWeight: 600}}>Change Password</h3>
                            <button onClick={() => setIsPasswordModalOpen(false)} className="modal-close-btn" style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer'}}>&times;</button>
                        </div>
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
        </div>
    );
}
