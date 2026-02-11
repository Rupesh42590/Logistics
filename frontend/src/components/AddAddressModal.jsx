import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import LocationPickerMap from './LocationPickerMap';
import {
  Modal, Form, Input, Button, Typography, Space, Divider, Tag, Row, Col
} from 'antd';
import {
  EnvironmentOutlined, UserOutlined, PhoneOutlined,
  SaveOutlined, AimOutlined
} from '@ant-design/icons';
import '../pages/MSMEPortal.css';

const { Text, Title } = Typography;

export default function AddAddressModal({ onClose, onSuccess }) {
    const label = 'Company';
    const [form] = Form.useForm();

    const [addressLine1, setAddressLine1] = useState('');
    const [pincode, setPincode] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [cityOptions, setCityOptions] = useState([]);
    const [mapLocation, setMapLocation] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);

    const handlePincodeChange = async (val) => {
        setPincode(val);
        form.setFieldsValue({ pincode: val });
        if (val.length === 6) {
            try {
                const res = await axios.get(`https://api.postalpincode.in/pincode/${val}`);
                if (res.data && res.data[0].Status === "Success") {
                    const postOffices = res.data[0].PostOffice;
                    setCityOptions(postOffices);
                    if (postOffices.length > 0) {
                        setCity(postOffices[0].Name);
                        setState(postOffices[0].State);
                        form.setFieldsValue({
                            city: postOffices[0].Name,
                            state: postOffices[0].State,
                        });
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
        try {
            const { lat, lng } = latlng;
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            if (res.data && res.data.address) {
                const addr = res.data.address;
                const newPincode = addr.postcode || '';
                const newCity = addr.city || addr.town || addr.village || addr.suburb || addr.neighbourhood || '';
                const newState = addr.state || '';
                const newAddress = [
                    addr.house_number, addr.road, addr.suburb, addr.neighbourhood
                ].filter(Boolean).join(', ');

                if (newPincode) setPincode(newPincode);
                if (newCity) setCity(newCity);
                if (newState) setState(newState);
                setAddressLine1(newAddress);
                setCityOptions([]);

                form.setFieldsValue({
                    address: newAddress,
                    pincode: newPincode,
                    city: newCity,
                    state: newState,
                });
            }
        } catch (err) {
            console.error("Reverse geocoding failed", err);
        }
    };

    const handleSave = async () => {
        try {
            await form.validateFields();
        } catch {
            return;
        }

        const values = form.getFieldsValue();
        setLoading(true);
        try {
            const storedToken = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${storedToken}` } };

            await axios.post(`${API_BASE_URL}/addresses`, {
                label,
                recipient_name: values.recipientName,
                mobile_number: values.mobileNumber || '0000000000',
                address_line1: addressLine1 || values.address,
                pincode: pincode || values.pincode,
                city: city || values.city,
                state: state || values.state,
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
        <div className="drawer-overlay" style={{ zIndex: 1100 }}>
            <div
                className="drawer-content"
                style={{
                    maxWidth: 1100,
                    width: '92vw',
                    height: '88vh',
                    margin: 'auto',
                    borderRadius: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '20px 28px',
                        borderBottom: '1px solid #f1f5f9',
                    }}
                >
                    <Space align="center" size={12}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <EnvironmentOutlined style={{ color: '#fff', fontSize: 18 }} />
                        </div>
                        <div>
                            <Title level={4} style={{ margin: 0, fontSize: 18 }}>Add New Address</Title>
                            <Text type="secondary" style={{ fontSize: 13 }}>Pin a location on the map to auto-fill details</Text>
                        </div>
                    </Space>
                    <button onClick={onClose} className="drawer-close-btn">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* Left: Form */}
                    <div style={{
                        width: 380,
                        minWidth: 340,
                        padding: '28px 28px 20px',
                        borderRight: '1px solid #f1f5f9',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        <Form
                            form={form}
                            layout="vertical"
                            requiredMark={false}
                            style={{ flex: 1 }}
                        >
                            <Form.Item
                                label={<Text strong style={{ fontSize: 13 }}>Company / Recipient Name</Text>}
                                name="recipientName"
                                rules={[{ required: true, message: 'Please enter a name' }]}
                            >
                                <Input
                                    prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                                    placeholder="e.g. Acme Corp"
                                    size="large"
                                    style={{ borderRadius: 8 }}
                                />
                            </Form.Item>

                            <Form.Item
                                label={<Text strong style={{ fontSize: 13 }}>Phone Number</Text>}
                                name="mobileNumber"
                            >
                                <Input
                                    prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />}
                                    placeholder="e.g. 9876543210"
                                    size="large"
                                    style={{ borderRadius: 8 }}
                                    maxLength={10}
                                />
                            </Form.Item>

                            <Divider orientation="left" orientationMargin={0} style={{ margin: '4px 0 16px', fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>
                                LOCATION DETAILS
                            </Divider>

                            <Form.Item
                                label={<Text strong style={{ fontSize: 13 }}>Address</Text>}
                                name="address"
                            >
                                <Input.TextArea
                                    placeholder="Auto-filled from map pin..."
                                    rows={2}
                                    readOnly
                                    style={{
                                        borderRadius: 8,
                                        background: '#f8fafc',
                                        color: '#475569',
                                        resize: 'none',
                                    }}
                                />
                            </Form.Item>

                            <Row gutter={12}>
                                <Col span={10}>
                                    <Form.Item
                                        label={<Text strong style={{ fontSize: 13 }}>Pincode</Text>}
                                        name="pincode"
                                        rules={[{ required: true, message: 'Required' }]}
                                    >
                                        <Input
                                            placeholder="524004"
                                            size="large"
                                            maxLength={6}
                                            style={{ borderRadius: 8 }}
                                            onChange={e => handlePincodeChange(e.target.value)}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={14}>
                                    <Form.Item
                                        label={<Text strong style={{ fontSize: 13 }}>City</Text>}
                                        name="city"
                                        rules={[{ required: true, message: 'Required' }]}
                                    >
                                        <Input
                                            placeholder="City"
                                            size="large"
                                            style={{ borderRadius: 8 }}
                                            onChange={e => setCity(e.target.value)}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item
                                label={<Text strong style={{ fontSize: 13 }}>State</Text>}
                                name="state"
                            >
                                <Input
                                    placeholder="State"
                                    size="large"
                                    style={{ borderRadius: 8 }}
                                    onChange={e => setState(e.target.value)}
                                />
                            </Form.Item>

                            {mapLocation && (
                                <div style={{
                                    background: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    borderRadius: 8,
                                    padding: '10px 14px',
                                    marginBottom: 16,
                                }}>
                                    <Space>
                                        <AimOutlined style={{ color: '#16a34a' }} />
                                        <Text style={{ fontSize: 13, color: '#166534' }}>
                                            📍 {mapLocation.lat.toFixed(5)}, {mapLocation.lng.toFixed(5)}
                                        </Text>
                                    </Space>
                                </div>
                            )}
                        </Form>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 12, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                            <Button
                                onClick={onClose}
                                size="large"
                                style={{ flex: 1, borderRadius: 8, fontWeight: 600 }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                onClick={handleSave}
                                loading={loading}
                                icon={<SaveOutlined />}
                                size="large"
                                className="msme-primary-btn"
                                style={{ flex: 1 }}
                            >
                                Save Address
                            </Button>
                        </div>
                    </div>

                    {/* Right: Map */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '20px 24px',
                        background: '#fafbfc',
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 12,
                        }}>
                            <Text strong style={{ fontSize: 14, color: '#334155' }}>
                                <AimOutlined style={{ marginRight: 6, color: '#4f46e5' }} />
                                Pin Location on Map
                            </Text>
                            <Tag color="blue" style={{ fontSize: 11, borderRadius: 6 }}>
                                Click to select
                            </Tag>
                        </div>

                        <div style={{
                            flex: 1,
                            border: '1px solid #e2e8f0',
                            borderRadius: 12,
                            overflow: 'hidden',
                            minHeight: 300,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        }}>
                            <LocationPickerMap
                                onLocationSelect={handleMapLocationSelect}
                                style={{ width: '100%', height: '100%' }}
                                pincode={pincode}
                                selectedLocation={mapLocation}
                                suggestions={suggestions}
                            />
                        </div>

                        <Text type="secondary" style={{ marginTop: 10, fontSize: 12, display: 'block' }}>
                            Click anywhere on the map to auto-fill the address fields on the left.
                        </Text>
                    </div>
                </div>
            </div>
        </div>
    );
}