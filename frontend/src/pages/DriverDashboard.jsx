import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css'; 

export default function DriverDashboard() {
    const { token, user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            axios.get('http://localhost:8000/driver/orders')
                .then(res => setOrders(res.data))
                .catch(err => console.error("Failed to fetch driver orders", err))
                .finally(() => setLoading(false));
        }
    }, [token]);

    const completedOrders = orders.filter(o => o.status === 'SHIPPED').length;
    const assignedOrders = orders.filter(o => o.status === 'ASSIGNED').length;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Driver Dashboard</h1>
                    <p className="page-subtitle">Welcome back, {user?.name || 'Driver'}</p>
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
                            <th className="table-th">Pickup</th>
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
                                    {o.latitude.toFixed(4)}, {o.longitude.toFixed(4)}
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
        </div>
    );
}
