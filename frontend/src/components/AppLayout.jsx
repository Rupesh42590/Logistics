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
        { label: 'Fleet Monitor', path: '/admin?tab=fleet', icon: 'grid' },
        { label: 'Orders', path: '/admin?tab=orders', icon: 'clipboard' }, 
        { label: 'Zone Manager', path: '/admin?tab=zones', icon: 'map' },
        { label: 'Drivers', path: '/admin?tab=drivers', icon: 'users' },
        { label: 'Settings', path: '/admin/settings', icon: 'settings' }, // Keep this separate page
      ]
    : user?.role === 'DRIVER'
    ? [
        { label: 'Dashboard', path: '/driver', icon: 'grid' },
      ]
    : [
        { label: 'Dashboard', path: '/msme', icon: 'grid' },
        { label: 'Shipments', path: '/msme/shipments', icon: 'clipboard' },
        { label: 'Settings', path: '/msme/settings', icon: 'settings' },
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
                  {user?.role === 'SUPER_ADMIN' ? 'Enterprise Suite' : user?.role === 'DRIVER' ? 'Driver Portal' : 'MSME Portal'}
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
                {links.map((link) => (
                    <li key={link.label}>
                        <Link 
                            to={link.path}
                            className={`nav-link ${isActive(link.path.split('?')[0]) && (link.path.includes('?') ? location.search === link.path.split('?')[1] || (link.path.includes('tab=fleet') && !location.search) : true) ? 'active' : ''}`}
                            onClick={handleNavClick}
                        >
                            {/* Icon Logic */}
                            {link.icon === 'grid' && (
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                            )}
                            {link.icon === 'clipboard' && (
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                            )}
                            {link.icon === 'map' && (
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
                            )}
                            {link.icon === 'users' && (
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            )}
                            {link.icon === 'settings' && (
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            )}
                            {!link.icon && (
                                 <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                            )}
                            {link.label}
                        </Link>
                    </li>
                ))}
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
                        {user?.role === 'DRIVER' ? (user?.name || user?.email?.split('@')[0]) : (user?.company?.name || user?.email?.split('@')[0])}
                    </div>
                    <div className="profile-details-role">
                        {user?.role === 'SUPER_ADMIN' ? 'Administrator' : user?.role === 'DRIVER' ? 'Fleet Driver' : 'Logistics Manager'}
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
