import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Card, Avatar, Tag, Descriptions, Divider,
  Form, Input, Button, Typography, Space, Row, Col
} from 'antd';
import {
  UserOutlined, MailOutlined, SafetyCertificateOutlined,
  BankOutlined, AuditOutlined, EnvironmentOutlined,
  LockOutlined, LogoutOutlined, KeyOutlined, IdcardOutlined
} from '@ant-design/icons';
import './MSMEPortal.css';

const { Title, Text } = Typography;

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return <div style={{ padding: 32 }}>Loading user profile...</div>;

  const roleColor = user.role === 'SUPER_ADMIN' ? 'purple' : user.role === 'DRIVER' ? 'green' : 'blue';
  const initials = (user.email || '').substring(0, 2).toUpperCase();

  return (
    <div>
      {/* ── Header ── */}
      <div className="msme-page-header">
        <div>
          <h1 className="msme-page-title">Settings & Profile</h1>
          <p className="msme-page-subtitle">Manage your account and preferences</p>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        {/* ── Left Column: Profile Card ── */}
        <Col xs={24} lg={8}>
          <Card
            style={{
              borderRadius: 12,
              border: '1px solid var(--border)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              textAlign: 'center',
            }}
            styles={{ body: { padding: '32px 24px' } }}
          >
            <Avatar
              size={80}
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                fontSize: 28,
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              {initials}
            </Avatar>

            <Title level={4} style={{ marginBottom: 4 }}>
              {user.company?.name || user.name || 'User'}
            </Title>

            <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 14 }}>
              {user.email}
            </Text>

            <Tag
              color={roleColor}
              style={{ fontSize: 12, fontWeight: 600, padding: '2px 12px', borderRadius: 6 }}
            >
              {user.role?.replace('_', ' ')}
            </Tag>

            <Divider style={{ margin: '24px 0 16px' }} />

            <Button
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              block
              size="large"
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              Sign Out
            </Button>
          </Card>
        </Col>

        {/* ── Right Column: Details + Password ── */}
        <Col xs={24} lg={16}>
          {/* Account Details Card */}
          <Card
            title={
              <Space>
                <IdcardOutlined style={{ color: '#4f46e5' }} />
                <span>Account Details</span>
              </Space>
            }
            style={{
              borderRadius: 12,
              border: '1px solid var(--border)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              marginBottom: 24,
            }}
            styles={{
              header: {
                borderBottom: '1px solid #f1f5f9',
                fontSize: 16,
                fontWeight: 600,
              },
            }}
          >
            <Descriptions
              column={1}
              colon={false}
              labelStyle={{
                fontWeight: 500,
                color: '#64748b',
                fontSize: 14,
                width: 160,
                paddingBottom: 16,
              }}
              contentStyle={{
                fontWeight: 600,
                color: 'var(--text-main)',
                fontSize: 14,
                paddingBottom: 16,
              }}
            >
              <Descriptions.Item
                label={<Space><MailOutlined style={{ color: '#94a3b8' }} /> Email Address</Space>}
              >
                {user.email}
              </Descriptions.Item>

              <Descriptions.Item
                label={<Space><SafetyCertificateOutlined style={{ color: '#94a3b8' }} /> Role</Space>}
              >
                <Tag
                  color={roleColor}
                  style={{ fontSize: 12, fontWeight: 600, padding: '1px 10px', borderRadius: 6 }}
                >
                  {user.role?.replace('_', ' ')}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {/* Company Section */}
            {user.company && (
              <>
                <Divider orientation="left" orientationMargin={0} style={{ margin: '8px 0 20px', fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>
                  COMPANY DETAILS
                </Divider>

                <Descriptions
                  column={1}
                  colon={false}
                  labelStyle={{
                    fontWeight: 500,
                    color: '#64748b',
                    fontSize: 14,
                    width: 160,
                    paddingBottom: 16,
                  }}
                  contentStyle={{
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    fontSize: 14,
                    paddingBottom: 16,
                  }}
                >
                  <Descriptions.Item
                    label={<Space><BankOutlined style={{ color: '#94a3b8' }} /> Company Name</Space>}
                  >
                    {user.company.name}
                  </Descriptions.Item>

                  <Descriptions.Item
                    label={<Space><AuditOutlined style={{ color: '#94a3b8' }} /> GST Number</Space>}
                  >
                    <Text code style={{ fontSize: 13, fontWeight: 600 }}>{user.company.gst_number}</Text>
                  </Descriptions.Item>

                  <Descriptions.Item
                    label={<Space><EnvironmentOutlined style={{ color: '#94a3b8' }} /> Address</Space>}
                  >
                    <Text style={{ fontWeight: 500, lineHeight: 1.6 }}>{user.company.address}</Text>
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}
          </Card>

          {/* Change Password Card */}
          <Card
            title={
              <Space>
                <LockOutlined style={{ color: '#4f46e5' }} />
                <span>Change Password</span>
              </Space>
            }
            style={{
              borderRadius: 12,
              border: '1px solid var(--border)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
            styles={{
              header: {
                borderBottom: '1px solid #f1f5f9',
                fontSize: 16,
                fontWeight: 600,
              },
            }}
          >
            <ChangePasswordForm />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

function ChangePasswordForm() {
  const { token } = useAuth();
  const { showAlert } = useModal();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (values) => {
    if (values.new_password !== values.confirm_password) {
      showAlert("Error", "New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await axios.post('http://127.0.0.1:8000/auth/change-password', {
        old_password: values.old_password,
        new_password: values.new_password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showAlert("Success", "Password changed successfully!");
      form.resetFields();
    } catch (err) {
      console.error("Change password failed", err);
      showAlert("Error", err.response?.data?.detail || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      style={{ maxWidth: 420 }}
      requiredMark={false}
    >
      <Form.Item
        label={<Text strong style={{ fontSize: 13 }}>Current Password</Text>}
        name="old_password"
        rules={[{ required: true, message: 'Please enter your current password' }]}
      >
        <Input.Password
          prefix={<KeyOutlined style={{ color: '#94a3b8' }} />}
          placeholder="Enter current password"
          size="large"
          style={{ borderRadius: 8 }}
        />
      </Form.Item>

      <Form.Item
        label={<Text strong style={{ fontSize: 13 }}>New Password</Text>}
        name="new_password"
        rules={[
          { required: true, message: 'Please enter a new password' },
          { min: 6, message: 'Password must be at least 6 characters' }
        ]}
      >
        <Input.Password
          prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
          placeholder="Enter new password"
          size="large"
          style={{ borderRadius: 8 }}
        />
      </Form.Item>

      <Form.Item
        label={<Text strong style={{ fontSize: 13 }}>Confirm New Password</Text>}
        name="confirm_password"
        dependencies={['new_password']}
        rules={[
          { required: true, message: 'Please confirm your new password' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('new_password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('Passwords do not match'));
            },
          }),
        ]}
      >
        <Input.Password
          prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
          placeholder="Confirm new password"
          size="large"
          style={{ borderRadius: 8 }}
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          className="msme-primary-btn"
          style={{ minWidth: 180 }}
        >
          Update Password
        </Button>
      </Form.Item>
    </Form>
  );
}
