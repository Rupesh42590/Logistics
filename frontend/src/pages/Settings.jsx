import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return <div className="p-4">Loading user profile...</div>;

  return (
    <div className="settings-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <header className="settings-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Settings & Profile</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </header>

      <div className="card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          User Profile
        </h2>

        <div className="settings-grid" style={{ display: 'grid', gap: '1.5rem' }}>
          {/* User Details */}
          <div className="settings-row" style={{ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Email Address</span>
            <span style={{ fontWeight: '600' }}>{user.email}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center' }}>
             <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Role</span>
             <span className={`badge ${user.role === 'SUPER_ADMIN' ? 'badge-primary' : 'badge-neutral'}`} style={{ width: 'fit-content' }}>
                {user.role}
             </span>
          </div>

          {/* Company Details (MSME Only) */}
          {user.company && (
            <>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginTop: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Company Details
                </h3>
                
                 <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Company Name</span>
                    <span style={{ fontWeight: '600' }}>{user.company.name}</span>
                </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>GST Number</span>
                    <span>{user.company.gst_number}</span>
                </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Address</span>
                    <span>{user.company.address}</span>
                </div>
            </>
          )}


          <div className="settings-section" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
             <ChangePasswordForm />
          </div>

          <div className="settings-section" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
            <button 
                onClick={handleLogout}
                className="btn btn-danger-outline"
                style={{ width: '100%' }}
            >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordForm() {
    const { token } = useAuth();
    const { showAlert } = useModal();
    const [passwords, setPasswords] = React.useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [loading, setLoading] = React.useState(false);

    const handleChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (passwords.new_password !== passwords.confirm_password) {
            showAlert("Error", "New passwords do not match.");
            return;
        }

        if (passwords.new_password.length < 6) {
             showAlert("Error", "Password must be at least 6 characters long.");
             return;
        }

        setLoading(true);
        try {
            await axios.post('http://127.0.0.1:8000/auth/change-password', {
                old_password: passwords.old_password,
                new_password: passwords.new_password
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showAlert("Success", "Password changed successfully!");
            setPasswords({ old_password: '', new_password: '', confirm_password: '' });
        } catch (err) {
            console.error("Change password failed", err);
            showAlert("Error", err.response?.data?.detail || "Failed to change password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              Change Password
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem', maxWidth: '500px' }}>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-main)' }}>Old Password</label>
                    <input 
                        type="password"
                        name="old_password"
                        value={passwords.old_password}
                        onChange={handleChange}
                        className="form-input"
                        required
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border)' }}
                    />
                </div>
                
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-main)' }}>New Password</label>
                    <input 
                        type="password"
                        name="new_password"
                        value={passwords.new_password}
                        onChange={handleChange}
                        className="form-input"
                        required
                        minLength={6}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border)' }}
                    />
                </div>

                <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-main)' }}>Confirm New Password</label>
                    <input 
                        type="password"
                        name="confirm_password"
                        value={passwords.confirm_password}
                        onChange={handleChange}
                        className="form-input"
                        required
                        minLength={6}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border)' }}
                    />
                </div>

                <div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ padding: '0.75rem 1.5rem', fontWeight: '600' }}
                    >
                        {loading ? 'Updating Password...' : 'Update Password'}
                    </button>
                </div>
            </form>
        </div>
    );
}

