import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css'; 

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

    const completedOrders = orders.filter(o => o.status === 'SHIPPED').length;
    const assignedOrders = orders.filter(o => o.status === 'ASSIGNED').length;

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ maxWidth: '60%' }}>
                    <h1 className="page-title">Driver Dashboard</h1>
                    <p className="page-subtitle" style={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                        display: 'block'
                    }}>
                        Welcome back, {user?.name || 'Driver'} ({user?.email || (user?.employee_id ? `${user.employee_id}@logisoft.driver` : '')})
                    </p>
                </div>
                <div>
                     <button 
                        className="btn btn-secondary" 
                        onClick={() => setIsPasswordModalOpen(true)}
                        style={{ fontSize: '0.875rem' }}
                    >
                        Change Password
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
               <div className="card stat-card">
                   <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Assigned Orders</div>
                   <div className="stat-value">{assignedOrders}</div>
               </div>
               <div className="card stat-card">
                   <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Completed (Shipped)</div>
                   <div className="stat-value">{completedOrders}</div>
               </div>
               <div className="card stat-card">
                   <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total History</div>
                   <div className="stat-value">{orders.length}</div>
               </div>
            </div>

            {/* Orders Table */}
            <div className="card table-wrapper" style={{ marginTop: '1.5rem' }}>
                <h3 style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: '600' }}>My Assignments</h3>
                <table className="data-table">
                    <thead className="table-head">
                        <tr>
                            <th className="table-th">Order ID</th>
                            <th className="table-th">Item</th>
                            <th className="table-th">Details</th>
                            <th className="table-th">Pickup Details</th>
                            <th className="table-th">Drop Details</th>
                            <th className="table-th">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(o => (
                            <tr key={o.id} className="table-td">
                                <td style={{ padding: '1rem', fontWeight: '500' }}>#{o.id}</td>
                                <td style={{ padding: '1rem' }}>{o.item_name}</td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    {o.weight_kg}kg • {o.volume_m3 < 0.001 ? o.volume_m3.toFixed(6) : o.volume_m3.toFixed(3)}m³
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                    <div><strong>Co-ords:</strong> {(o.pickup_latitude || o.latitude).toFixed(4)}, {(o.pickup_longitude || o.longitude).toFixed(4)}</div>
                                    {o.pickup_address && <div style={{fontSize: '0.8rem', marginTop: '0.25rem', color: '#64748b'}}>{o.pickup_address}</div>}
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                    {o.drop_latitude ? (
                                        <>
                                            <div><strong>Co-ords:</strong> {o.drop_latitude.toFixed(4)}, {o.drop_longitude.toFixed(4)}</div>
                                            {o.drop_address && <div style={{fontSize: '0.8rem', marginTop: '0.25rem', color: '#64748b'}}>{o.drop_address}</div>}
                                        </>
                                    ) : <span style={{color:'#94a3b8'}}>-</span>}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span className={`badge ${
                                        o.status === 'SHIPPED' ? 'badge-success' : 'badge-warning'}`}>
                                        {o.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {orders.length === 0 && (
                            <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No assigned orders.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Password Change Modal */}
            {isPasswordModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Change Password</h3>
                            <button onClick={() => setIsPasswordModalOpen(false)} className="modal-close-btn">&times;</button>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            {passwordMessage.text && (
                                <div className={`alert ${passwordMessage.type === 'error' ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '0.375rem', fontSize: '0.875rem', backgroundColor: passwordMessage.type === 'error' ? '#fee2e2' : '#dcfce7', color: passwordMessage.type === 'error' ? '#dc2626' : '#16a34a' }}>
                                    {passwordMessage.text}
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">Current Password</label>
                                <input 
                                    type="password" 
                                    className="form-input"
                                    value={passwordForm.oldPassword}
                                    onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <input 
                                    type="password" 
                                    className="form-input"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm New Password</label>
                                <input 
                                    type="password" 
                                    className="form-input"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button onClick={() => setIsPasswordModalOpen(false)} className="btn btn-secondary">Cancel</button>
                                <button onClick={handlePasswordChange} className="btn btn-primary">Update Password</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
