import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AppLayout.css';

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const isActive = (path) => location.pathname === path;

  // Determine Sidebar Links based on Role
  const links = user?.role === 'SUPER_ADMIN' 
    ? [
        { label: 'Fleet Monitor', path: '/admin' },
        { label: 'Zone Manager', path: '/admin/zones' }, // We might need to handle sub-routing or keep query params
        { label: 'Settings', path: '/admin/settings' },
      ]
    : [
        { label: 'Dashboard', path: '/msme' },
        { label: 'Shipments', path: '/msme/shipments' },
        { label: 'Settings', path: '/msme/settings' },
      ];
  
  // Or we can fully move tabs to routes later. For this step, let's just make the sidebar look good.
  

  const profileRef = useRef(null);

  useEffect(() => {
      function handleClickOutside(event) {
          if (profileRef.current && !profileRef.current.contains(event.target)) {
              setIsProfileOpen(false);
          }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
          document.removeEventListener("mousedown", handleClickOutside);
      };
  }, [profileRef]);

  const handleNavClick = () => {
      // Close sidebar on mobile when a link is clicked
      setIsSidebarOpen(false);
  };

  return (
    <div className="app-layout">
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Mobile Toggle Trigger */}
      <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        {isSidebarOpen ? (
             <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
        ) : (
             <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        )}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
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
            <div className="logo-text">
                <h1>LogiSoft</h1>
                <span>
                  {user?.role === 'SUPER_ADMIN' ? 'Enterprise Suite' : 'MSME Portal'}
                </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
            <div className="nav-label">
                MAIN MENU
            </div>
            <ul className="nav-list">
                <li>
                    <Link 
                        to={user?.role === 'SUPER_ADMIN' ? '/admin' : '/msme'} 
                        className={`nav-link ${isActive(user?.role === 'SUPER_ADMIN' ? '/admin' : '/msme') ? 'active' : ''}`}
                        onClick={handleNavClick}
                    >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                        Dashboard
                    </Link>
                </li>
                {/* Mock Links for visuals */}
                {/* Shipments link removed as per request */}
                 <li>
                     <Link 
                        to={user?.role === 'SUPER_ADMIN' ? '/admin/settings' : '/msme/settings'} 
                        className={`nav-link nav-link-muted ${isActive(user?.role === 'SUPER_ADMIN' ? '/admin/settings' : '/msme/settings') ? 'active' : ''}`}
                        onClick={handleNavClick}
                     >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        Settings
                     </Link>
                </li>
            </ul>
        </nav>

        {/* User Profile Snippet */}
        <div className="profile-section" ref={profileRef}>
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
            >
                <div className="profile-avatar">
                    <span>
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                </div>
                <div className="profile-details">
                    <div className="profile-details-name">
                        {user?.company?.name || user?.email?.split('@')[0]}
                    </div>
                    <div className="profile-details-role">
                        {user?.role === 'SUPER_ADMIN' ? 'Administrator' : 'Logistics Manager'}
                    </div>
                </div>
                <div className="profile-chevron">
                     <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6"/></svg>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
