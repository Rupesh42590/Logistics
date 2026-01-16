import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const API_URL = 'http://localhost:8000';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Configure axios defaults
  useEffect(() => {
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        axios.get(`${API_URL}/users/me`)
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
        
        const res = await axios.post(`${API_URL}/token`, params);
        const { access_token } = res.data;
        
        localStorage.setItem('token', access_token);
        setToken(access_token);
        
        const userRes = await axios.get(`${API_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        
        const userData = userRes.data;
        localStorage.setItem('role', userData.role);
        setUser(userData);
        return userData.role;
    } catch (err) {
        console.error("Login failed", err);
        throw err;
    }
  };

  const driverLogin = async (accessKey) => {
    try {
        const res = await axios.post(`${API_URL}/driver/login`, { access_key: accessKey });
        const { access_token } = res.data;
        
        localStorage.setItem('token', access_token);
        setToken(access_token);
        
        const userRes = await axios.get(`${API_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        
        const userData = userRes.data;
        localStorage.setItem('role', userData.role);
        setUser(userData);
        return userData.role;
    } catch (err) {
        console.error("Driver login failed", err);
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
        await axios.post(`${API_URL}/signup/msme`, payload);
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
    <AuthContext.Provider value={{ user, token, login, driverLogin, signupMSME, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
