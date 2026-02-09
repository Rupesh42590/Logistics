import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import AddAddressModal from '../components/AddAddressModal';
import './MSMEPortal.css'; // Reuse styles

export default function SavedAddressesPage() {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/addresses`);
            setAddresses(res.data);
        } catch (err) {
            console.error("Failed to fetch addresses");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this address?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/addresses/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setAddresses(addresses.filter(a => a.id !== id));
        } catch (err) {
            console.error(err);
            alert("Failed to delete address: " + (err.response?.data?.detail || err.message));
        }
    };

    return (
        <div>
            <div className="portal-header">
                <div>
                    <h1 className="portal-title">Address Book</h1>
                    <p className="portal-subtitle">Manage your saved pickup and delivery locations.</p>
                </div>
                <button className="btn btn-outline" onClick={() => setIsAddModalOpen(true)}>
                    + Add New Address
                </button>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Label</th>
                                <th>Recipient Name</th>
                                <th>Mobile Number</th>
                                <th>Full Address</th>
                                <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {addresses.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        No saved addresses found. Save one when creating a new shipment or click "Add New Address".
                                    </td>
                                </tr>
                            ) : (
                                addresses.map(addr => (
                                    <tr key={addr.id}>
                                        <td>
                                            <span className="badge badge-neutral">{addr.label}</span>
                                        </td>
                                        <td style={{ fontWeight: '500' }}>
                                            {addr.recipient_name}
                                        </td>
                                        <td style={{ color: 'var(--text-muted)' }}>
                                            {addr.mobile_number}
                                        </td>
                                        <td style={{ maxWidth: '300px' }}>
                                            <div>{addr.address_line1}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {addr.city}, {addr.state} - {addr.pincode}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleDelete(addr.id)}
                                                className="btn-icon"
                                                style={{ color: '#ef4444' }}
                                                title="Delete Address"
                                            >
                                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {isAddModalOpen && (
                <AddAddressModal
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={() => {
                        setIsAddModalOpen(false);
                        fetchAddresses();
                    }}
                />
            )}
        </div>
    );
}