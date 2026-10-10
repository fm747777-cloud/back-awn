import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

/**
 * TEMPORARY OFFLINE / DEMO MODE TOGGLE
 * Set to false to disable all runtime API/backend requests and run using local demo/mock data.
 * Set to true to re-enable real backend/API communication.
 */
export const IS_BACKEND_ENABLED = true;

export const axiosClient = axios.create({
    baseURL: import.meta.env?.VITE_BASE_URL || import.meta.env?.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Guard interceptor: stops ALL runtime API/backend requests when disabled
axiosClient.interceptors.request.use((config) => {
    if (!IS_BACKEND_ENABLED) {
        return Promise.reject(
            new axios.Cancel('Backend API integration is temporarily disabled. Running in offline demo/mock mode.')
        );
    }
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

axiosClient.interceptors.response.use((response) => response,
    (error) => {
        if (axios.isCancel(error)) {
            return Promise.reject(error);
        }
        if (error.response?.status === 401 || error.response?.status === 403) {
            const logout = useAuthStore.getState().logout;
            logout();
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);
