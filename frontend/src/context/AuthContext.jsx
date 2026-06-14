import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem('nv_token');
        const savedUser = localStorage.getItem('nv_user');

        if (!savedToken || !savedUser) {
            setLoading(false);
            return;
        }

        // Show the stored session optimistically...
        setToken(savedToken);
        try {
            setUser(JSON.parse(savedUser));
        } catch {
            // Corrupted storage — clear it and force a fresh login.
            localStorage.removeItem('nv_token');
            localStorage.removeItem('nv_user');
            setToken(null);
            setUser(null);
            setLoading(false);
            return;
        }

        // ...then verify the token is still valid with the backend.
        // A 401 is handled globally by the api interceptor (clears + redirects);
        // transient/network errors are ignored so we don't log users out offline.
        api.get('/auth/me')
            .then((res) => {
                setUser(res.data);
                localStorage.setItem('nv_user', JSON.stringify(res.data));
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { access_token, user: userData } = res.data;
        localStorage.setItem('nv_token', access_token);
        localStorage.setItem('nv_user', JSON.stringify(userData));
        setToken(access_token);
        setUser(userData);
        return userData;
    };

    const signup = async (full_name, email, password) => {
        const res = await api.post('/auth/signup', { full_name, email, password });
        // Don't auto-login — user will be redirected to login tab
        return { success: true };
    };

    const logout = () => {
        localStorage.removeItem('nv_token');
        localStorage.removeItem('nv_user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
