import axios from 'axios';

// Derive the API path from Vite's base URL so the app works both at the root
// origin ('/api') and under a sub-path like '/nyayavaad/' ('/nyayavaad/api').
const BASE = import.meta.env.BASE_URL || '/';
const API_BASE = BASE.replace(/\/+$/, '') + '/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Auto-attach JWT token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('nv_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('nv_token');
            localStorage.removeItem('nv_user');
            window.location.href = BASE + 'login';
        }
        return Promise.reject(error);
    }
);

export default api;
