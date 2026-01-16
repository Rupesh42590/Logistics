import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return <div className="p-4">Loading user profile...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Settings & Profile</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </header>

      <div className="card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          User Profile
        </h2>

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* User Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center' }}>
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

          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
            <button 
                onClick={handleLogout}
                className="btn-sm"
                style={{ 
                    background: '#fee2e2', 
                    color: 'var(--error)', 
                    border: '1px solid var(--error)',
                    padding: '0.75rem 1.5rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                }}
            >
                Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
