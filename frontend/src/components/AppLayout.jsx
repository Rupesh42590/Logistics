import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AppLayout.css';

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const isActive = (path) => location.pathname === path;

  // Determine Sidebar Links based on Role
  const links = user?.role === 'SUPER_ADMIN'
    ? [
      { label: 'Fleet Monitor', path: '/admin' },
      { label: 'Zone Manager', path: '/admin/zones' },
      { label: 'Settings', path: '/admin/settings' },
    ]
    : user?.role === 'DRIVER'
      ? [
        { label: 'Dashboard', path: '/driver' },
      ]
      : [
        { label: 'Dashboard', path: '/msme' },
        { label: 'Listed Companies', path: '/msme/addresses' },
        { label: 'Settings', path: '/msme/settings' },
      ];

  // Or we can fully move tabs to routes later. For this step, let's just make the sidebar look good.

  return (
    <div className="app-layout">
      {/* Sidebar - Hide if Driver */}
      {user?.role !== 'DRIVER' && (
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo-container">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 10l7-7 7 7V21h-14z" />
                <path d="M5 10v11" />
                <path d="M19 10v11" />
              </svg>
            </div>
            {!isCollapsed && (
                <div className="logo-text">
                <h1>LogiSoft</h1>
                <span>
                    {user?.role === 'SUPER_ADMIN' ? 'Enterprise Suite' : 'MSME Portal'}
                </span>
                </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {!isCollapsed && (
              <div className="nav-label">
                MAIN MENU
              </div>
          )}
          <ul className="nav-list">
            {links.map((link) => (
              <li key={link.path}>
                <Link to={link.path} className={`nav-link ${isActive(link.path) ? 'active' : ''}`} title={isCollapsed ? link.label : ''}>
                  {link.label === 'Dashboard' && <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>}
                  {link.label === 'Listed Companies' && <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>}
                  {link.label === 'Shipments' && <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>}
                  {link.label === 'Settings' && <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>}
                  {link.label === 'Fleet Monitor' && <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>}
                  {link.label === 'Zone Manager' && <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>}

                  {!isCollapsed && link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Profile Snippet */}
        <div className={`profile-section ${isCollapsed ? 'collapsed' : ''}`}>
          {isProfileOpen && (
            <div className="profile-menu-popup">
              <div className="profile-info">
                <div className="profile-name">{user?.company?.name || 'Company Name'}</div>
                <div className="profile-email">{user?.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="logout-btn"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Log Out
              </button>
            </div>
          )}

          <div
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="profile-trigger"
            title={isCollapsed ? user?.name : ''}
          >
            <div className="profile-avatar">
              <span>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            {!isCollapsed && (
                <>
                <div className="profile-details">
                <div className="profile-details-name">
                    {user?.company?.name || user?.email?.split('@')[0]}
                </div>
                <div className="profile-details-role">
                    {user?.role === 'SUPER_ADMIN' ? 'Administrator' : 'Logistics Manager'}
                </div>
                </div>
                <div className="profile-chevron">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6" /></svg>
                </div>
                </>
            )}
          </div>
        </div>
      </aside>
      )}

      {/* Main Content Area */}
      <main className={`main-content ${isCollapsed ? 'collapsed' : ''}`} style={user?.role === 'DRIVER' ? { marginLeft: 0, padding: 0 } : {}}>
        {children}
      </main>
    </div>
  );
}