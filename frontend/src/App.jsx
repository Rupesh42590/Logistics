import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import MSMEPortal from './pages/MSMEPortal';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import './mobile-overrides.css';

import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';

function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Login />} />
            
            <Route path="/admin" element={
              <ProtectedRoute role="SUPER_ADMIN">
                <AppLayout>
                  <AdminDashboard />
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/settings" element={
              <ProtectedRoute role="SUPER_ADMIN">
                <AppLayout>
                  <Settings />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/msme" element={
              <ProtectedRoute role="MSME">
                <AppLayout>
                  <MSMEPortal />
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/msme/settings" element={
              <ProtectedRoute role="MSME">
                <AppLayout>
                  <Settings />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </ModalProvider>
    </AuthProvider>
  );
}

export default App;
