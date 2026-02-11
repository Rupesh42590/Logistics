import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import AddAddressModal from '../components/AddAddressModal';
import { Table, Button, Tag, Space, Popconfirm, Typography, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined, EnvironmentOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import './MSMEPortal.css'; // Reuse styles

const { Text } = Typography;

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

    const labelColors = {
        'Company':   { color: '#4f46e5', bg: '#eef2ff' },
        'Warehouse': { color: '#0891b2', bg: '#ecfeff' },
        'Home':      { color: '#16a34a', bg: '#f0fdf4' },
        'Office':    { color: '#ca8a04', bg: '#fefce8' },
        'Other':     { color: '#64748b', bg: '#f8fafc' },
    };

    const getLabelStyle = (label) => {
        const match = labelColors[label] || labelColors['Other'];
        return match;
    };

    const columns = [
        {
            title: '#',
            key: 'index',
            width: 50,
            render: (_, __, index) => (
                <Text style={{ color: '#94a3b8', fontWeight: 600, fontSize: 13 }}>{index + 1}</Text>
            ),
        },
        {
            title: 'Label',
            dataIndex: 'label',
            key: 'label',
            width: 120,
            render: (label) => {
                const style = getLabelStyle(label);
                return (
                    <Tag
                        style={{
                            background: style.bg,
                            color: style.color,
                            border: `1px solid ${style.color}22`,
                            borderRadius: 6,
                            fontWeight: 600,
                            fontSize: 12,
                            padding: '2px 10px',
                        }}
                    >
                        {label}
                    </Tag>
                );
            },
        },
        {
            title: 'Recipient',
            dataIndex: 'recipient_name',
            key: 'recipient_name',
            width: 180,
            render: (name) => (
                <Space size={8}>
                    <UserOutlined style={{ color: '#94a3b8', fontSize: 14 }} />
                    <Text strong style={{ fontSize: 14 }}>{name}</Text>
                </Space>
            ),
        },
        {
            title: 'Mobile',
            dataIndex: 'mobile_number',
            key: 'mobile_number',
            width: 160,
            render: (phone) => (
                <Space size={8}>
                    <PhoneOutlined style={{ color: '#94a3b8', fontSize: 13 }} />
                    <Text style={{ color: '#64748b', fontSize: 14, fontFamily: 'monospace' }}>{phone}</Text>
                </Space>
            ),
        },
        {
            title: 'Full Address',
            key: 'address',
            ellipsis: true,
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <EnvironmentOutlined style={{ color: '#4f46e5', fontSize: 14, marginTop: 3, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-main)', lineHeight: 1.4 }}>
                            {record.address_line1}
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
                            {record.city}, {record.state} — {record.pincode}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 80,
            align: 'center',
            render: (_, record) => (
                <Popconfirm
                    title="Delete this address?"
                    description="This action cannot be undone."
                    onConfirm={() => handleDelete(record.id)}
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                >
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        style={{ borderRadius: 6 }}
                    />
                </Popconfirm>
            ),
        },
    ];

    return (
        <div>
            {/* ── Header ── */}
            <div className="msme-page-header">
                <div>
                    <h1 className="msme-page-title">Address Book</h1>
                    <p className="msme-page-subtitle">Manage your saved pickup and delivery locations.</p>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    className="msme-primary-btn"
                    onClick={() => setIsAddModalOpen(true)}
                >
                    Add New Address
                </Button>
            </div>

            {/* ── Table Card ── */}
            <div className="msme-table-card">
                <Table
                    columns={columns}
                    dataSource={addresses}
                    rowKey="id"
                    loading={loading}
                    pagination={addresses.length > 8 ? { pageSize: 8, showSizeChanger: false } : false}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    <span style={{ color: '#94a3b8' }}>
                                        No saved addresses yet. Click <strong>"Add New Address"</strong> to get started.
                                    </span>
                                }
                            />
                        ),
                    }}
                />
            </div>

            {/* ── Add Address Modal ── */}
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