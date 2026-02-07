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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {addresses.map(addr => (
                        <div key={addr.id} className="card" style={{ position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <span className={`badge badge-neutral`}>{addr.label}</span>
                                <button
                                    onClick={() => handleDelete(addr.id)}
                                    className="btn-icon"
                                    style={{ color: '#ef4444', padding: '4px' }}
                                    title="Delete"
                                >
                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>

                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem' }}>{addr.recipient_name}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>{addr.mobile_number}</p>

                            <div style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                                <div>{addr.address_line1}</div>
                                <div>{addr.city}, {addr.state} - {addr.pincode}</div>
                            </div>
                        </div>
                    ))}
                    {addresses.length === 0 && (
                        <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            No saved addresses found. Save one when creating a new shipment or click "Add New Address".
                        </div>
                    )}
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