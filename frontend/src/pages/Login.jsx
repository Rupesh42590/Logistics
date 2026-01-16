import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import LocationPickerMap from '../components/LocationPickerMap';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signupMSME } = useAuth();
  
  // State for Tab Switching
  const [activeTab, setActiveTab] = useState(location.pathname === '/signup' ? 'signup' : 'login');

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup State
  const [signupStep, setSignupStep] = useState(1);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState(null);
  const [signupForm, setSignupForm] = useState({
    companyName: '',
    gstNumber: '',
    industry: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    latitude: null,
    longitude: null,
  });

  // --- Handlers ---

  const handleTabChange = (tab) => {
      setActiveTab(tab);
      // Optional: Update URL without navigation if desired, but user said "dont update whole page"
      // window.history.pushState(null, '', tab === 'login' ? '/login' : '/signup');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const role = await login(loginEmail, loginPassword);
      if (role === 'SUPER_ADMIN') {
          navigate('/admin');
      } else if (role === 'DRIVER') {
          navigate('/driver');
      } else {
          navigate('/msme');
      }
    } catch (err) {
	    // Differentiate errors
        console.error(err);
        if (err.response) {
            if (err.response.status === 401) {
                setLoginError('Invalid email or password');
            } else {
                 setLoginError(`Login failed: ${err.response.data.detail || 'Server Error'}`);
            }
        } else if (err.request) {
             setLoginError('Cannot connect to server. Ensure backend is running.');
        } else {
             setLoginError('An unexpected error occurred.');
        }
	    setLoginLoading(false);
	  }
  };

  const handleSignupNext = (e) => {
      e.preventDefault();
      if (signupStep === 1) {
          if (signupForm.password !== signupForm.confirmPassword) {
              setSignupError("Passwords do not match");
              return;
          }
      }
      setSignupError(null);
      setSignupStep(s => s + 1);
  };

  const handleSignupBack = () => setSignupStep(s => s - 1);

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupError(null);
    setSignupLoading(true);

    try {
      await signupMSME({
        email: signupForm.email,
        password: signupForm.password,
        company_name: signupForm.companyName,
        gst_number: signupForm.gstNumber,
        address: signupForm.address,
        latitude: signupForm.latitude,
        longitude: signupForm.longitude,
      });
      // On success, maybe switch to login or redirect?
      // navigate('/msme'); // Direct access
      
      // OR: Auto-login after signup?
      // For now, let's redirect to MSME portal similar to before
      navigate('/msme');

    } catch (err) {
      setSignupError(err.response?.data?.detail || 'Signup failed');
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <AuthLayout 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        title={activeTab === 'login' ? "Welcome back" : "Streamline your shipments"} 
        subtitle={activeTab === 'login' ? "Please enter your details to sign in." : "Create your partner account to get started."}
    >
        
        {/* === LOGIN FORM === */}
        {activeTab === 'login' && (
            <>
                {loginError && (
                    <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                    {loginError}
                    </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                            </div>
                            <input 
                                required 
                                type="email" 
                                className="form-input" 
                                placeholder="Enter your email" 
                                style={{ paddingLeft: '40px' }}
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            </div>
                            <input 
                                required 
                                type="password" 
                                className="form-input" 
                                placeholder="••••••••" 
                                style={{ paddingLeft: '40px' }}
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                            <input type="checkbox" style={{ accentColor: 'var(--primary)' }} /> Remember me
                        </label>
                        <a href="#" style={{ color: 'var(--primary)', fontWeight: '500' }}>Forgot password?</a>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loginLoading}
                        className="btn btn-primary" 
                        style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }}
                    >
                        {loginLoading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>
            </>
        )}

        {/* === SIGNUP FORM === */}
        {activeTab === 'signup' && (
            <>
                {/* Progress Steps */}
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary)' }}>
                        <span>Step {signupStep} of 2</span>
                        <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>
                            {signupStep === 1 ? 'Company & Account Details' : 'Address & Location'}
                        </span>
                    </div>
                    <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ 
                            height: '100%', 
                            background: 'var(--primary)', 
                            width: `${(signupStep / 2) * 100}%`,
                            transition: 'width 0.3s ease'
                        }}></div>
                    </div>
                </div>

                {signupError && (
                    <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                    {signupError}
                    </div>
                )}

                <form onSubmit={signupStep === 2 ? handleSignupSubmit : handleSignupNext}>
                    
                    {/* Step 1: Company & Account Info */}
                    {signupStep === 1 && (
                        <div className="space-y-4">
                            <div className="form-group">
                                <label className="form-label">Company Name</label>
                                <input 
                                    required 
                                    className="form-input" 
                                    placeholder="Acme Logistics Ltd."
                                    value={signupForm.companyName}
                                    onChange={(e) => setSignupForm({...signupForm, companyName: e.target.value})}
                                />
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">GST Number</label>
                                    <input 
                                        required 
                                        className="form-input" 
                                        placeholder="22AAAAA0000A1Z5"
                                        value={signupForm.gstNumber}
                                        onChange={(e) => setSignupForm({...signupForm, gstNumber: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Industry</label>
                                    <select 
                                        required
                                        className="form-input" 
                                        value={signupForm.industry}
                                        onChange={(e) => setSignupForm({...signupForm, industry: e.target.value})}
                                    >
                                        <option value="" disabled>Select Industry</option>
                                        <option value="manufacturing">Manufacturing</option>
                                        <option value="textiles">Textiles</option>
                                        <option value="electronics">Electronics</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Official Email</label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                    </div>
                                    <input 
                                        required 
                                        type="email" 
                                        className="form-input" 
                                        placeholder="jane@company.com" 
                                        style={{ paddingLeft: '40px' }}
                                        value={signupForm.email}
                                        onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                        </div>
                                        <input 
                                            required 
                                            type="password" 
                                            className="form-input" 
                                            placeholder="Min 8 characters" 
                                            style={{ paddingLeft: '40px' }}
                                            value={signupForm.password}
                                            onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label className="form-label">Confirm Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                        </div>
                                        <input 
                                            required 
                                            type="password" 
                                            className="form-input" 
                                            placeholder="Confirm Password" 
                                            style={{ paddingLeft: '40px' }}
                                            value={signupForm.confirmPassword}
                                            onChange={(e) => setSignupForm({...signupForm, confirmPassword: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Address & Location */}
                    {signupStep === 2 && (
                        <div className="space-y-4">
                            <div className="form-group">
                                <label className="form-label">Registered Address</label>
                                <textarea 
                                    required 
                                    className="form-input" 
                                    rows="2" 
                                    placeholder="Plot No, Street, Area, City, State, Zip"
                                    value={signupForm.address}
                                    onChange={(e) => setSignupForm({...signupForm, address: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Pin Location on Map</label>
                                <div style={{ height: '300px', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                    <LocationPickerMap onLocationSelect={(loc) => setSignupForm({...signupForm, latitude: loc.lat, longitude: loc.lng})} />
                                </div>
                                {signupForm.latitude && (
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                        Location Captured: {signupForm.latitude.toFixed(4)}, {signupForm.longitude.toFixed(4)}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div style={{ marginTop: '2rem' }}>
                        <button 
                            type="submit" 
                            disabled={signupLoading}
                            className="btn btn-primary" 
                            style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }}
                        >
                            {signupLoading ? 'Creating Account...' : signupStep === 2 ? 'Create Account' : 'Continue to Next Step'} &rarr;
                        </button>
                        
                        {signupStep > 1 && (
                            <button 
                                type="button"
                                onClick={handleSignupBack}
                                className="btn"
                                style={{ width: '100%', marginTop: '0.5rem', color: 'var(--text-muted)' }}
                            >
                                Back to previous step
                            </button>
                        )}
                    </div>
                </form>
            </>
        )}

    </AuthLayout>
  );
}
