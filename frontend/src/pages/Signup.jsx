import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LocationPickerMap from '../components/LocationPickerMap';
import AuthLayout from '../components/AuthLayout';

export default function Signup() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { signupMSME } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
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

  const handleNext = (e) => {
      e.preventDefault();
      if (step === 1) {
          if (formData.password !== formData.confirmPassword) {
              setError("Passwords do not match");
              return;
          }
      }
      setError(null);
      setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signupMSME({
        email: formData.email,
        password: formData.password,
        company_name: formData.companyName,
        gst_number: formData.gstNumber,
        address: formData.address, // We might want to append lat/lng here if needed
        latitude: formData.latitude,
        longitude: formData.longitude,
      });
      navigate('/msme');
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout type="signup" title="Streamline your shipments" subtitle="Create your partner account to get started.">
      
      {/* Progress Steps */}
      <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', marginBottom: '2rem' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary)' }}>
            <span>Step {step} of 2</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>
                {step === 1 ? 'Company & Account Details' : 'Address & Location'}
            </span>
         </div>
         <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ 
                height: '100%', 
                background: 'var(--primary)', 
                width: `${(step / 2) * 100}%`,
                transition: 'width 0.3s ease'
            }}></div>
         </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={step === 2 ? handleSubmit : handleNext}>
        
        {/* Step 1: Company & Account Info */}
        {step === 1 && (
            <div className="space-y-4">
                <div className="form-group">
                    <label className="form-label">Company Name</label>
                    <input 
                        required 
                        className="form-input" 
                        placeholder="Acme Logistics Ltd."
                        value={formData.companyName}
                        onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">GST Number</label>
                        <input 
                            required 
                            className="form-input" 
                            placeholder="22AAAAA0000A1Z5"
                            value={formData.gstNumber}
                            onChange={(e) => setFormData({...formData, gstNumber: e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Industry</label>
                        <select 
                            required
                            className="form-input" 
                            value={formData.industry}
                            onChange={(e) => setFormData({...formData, industry: e.target.value})}
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
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
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
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                            />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Step 2: Address & Location */}
        {step === 2 && (
            <div className="space-y-4">
                <div className="form-group">
                    <label className="form-label">Registered Address</label>
                    <textarea 
                        required 
                        className="form-input" 
                        rows="2" 
                        placeholder="Plot No, Street, Area, City, State, Zip"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Pin Location on Map</label>
                    <div style={{ height: '300px', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <LocationPickerMap onLocationSelect={(loc) => setFormData({...formData, latitude: loc.lat, longitude: loc.lng})} />
                    </div>
                    {formData.latitude && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            Location Captured: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Footer Actions */}
        <div style={{ marginTop: '2rem' }}>
            <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }}
            >
                {loading ? 'Creating Account...' : step === 2 ? 'Create Account' : 'Continue to Next Step'} &rarr;
            </button>
            
            {step > 1 && (
                 <button 
                    type="button"
                    onClick={handleBack}
                    className="btn"
                    style={{ width: '100%', marginTop: '0.5rem', color: 'var(--text-muted)' }}
                >
                    Back to previous step
                </button>
            )}
        </div>
        


      </form>
    </AuthLayout>
  );
}
