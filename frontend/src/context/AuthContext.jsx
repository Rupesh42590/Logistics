import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Configure axios defaults
  useEffect(() => {
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        axios.get('http://localhost:8000/users/me')
            .then(res => {
                setUser(res.data);
                localStorage.setItem('role', res.data.role);
            })
            .catch(err => {
                console.error("Failed to fetch user", err);
                localStorage.removeItem('token');
                setToken(null);
            })
            .finally(() => setLoading(false));
    } else {
        delete axios.defaults.headers.common['Authorization'];
        setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    try {
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);
        
        const res = await axios.post('http://localhost:8000/token', params);
        const { access_token } = res.data;
        
        localStorage.setItem('token', access_token);
        // We need to decode token or fetch user to get role. 
        // For simplicity, let's assume we decode or backend returns it.
        // But backend only returns token. Let's fetch /users/me
        setToken(access_token);
        
        // Fetch user role immediately
        const userRes = await axios.get('http://localhost:8000/users/me', {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        
        const userData = userRes.data;
        localStorage.setItem('role', userData.role);
        setUser(userData);
        return userData.role; // Return role for redirect logic
    } catch (err) {
        console.error("Login failed", err);
        throw err;
    }
  };

  const signupMSME = async (companyData, userData) => {
    try {
        const payload = {
            user_details: {
                email: userData.email,
                password: userData.password,
                role: "MSME"
            },
            company_details: {
                name: companyData.companyName,
                gst_number: companyData.gstNumber,
                address: companyData.address
            }
        };
        await axios.post('http://localhost:8000/signup/msme', payload);
        return true;
    } catch (err) {
        console.error("Signup failed", err);
        throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signupMSME, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
