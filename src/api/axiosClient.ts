import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

export const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL, // استبدله بـ API الخاص بك
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor لإضافة Token التوثيق
axiosClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

axiosClient.interceptors.response.use((response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            const logout = useAuthStore.getState().logout;
            logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);