import axios from 'axios';
import { API_BASE_URL } from '../constants.jsx';

const httpClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Helper functions for auth token management
export const setAuthToken = (userId) => {
    if (userId) {
        localStorage.setItem('userId', userId);
        httpClient.defaults.headers.common['x-user-id'] = userId;
    } else {
        localStorage.removeItem('userId');
        delete httpClient.defaults.headers.common['x-user-id'];
    }
};

export const getAuthToken = () => {
    return localStorage.getItem('userId');
};

// Load auth token on module initialization
const savedUserId = getAuthToken();
if (savedUserId) {
    httpClient.defaults.headers.common['x-user-id'] = savedUserId;
}

// Request interceptor to add auth header
httpClient.interceptors.request.use(
    (config) => {
        const userId = getAuthToken();
        if (userId) {
            config.headers['x-user-id'] = userId;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
httpClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const data = error?.response?.data;

        let normalizedMessage = '';
        if (typeof data === 'string') {
            normalizedMessage = data;
        } else if (data && typeof data === 'object') {
            normalizedMessage =
                data.msg ||
                data.message ||
                data.error ||
                (Array.isArray(data.errors) ? data.errors[0]?.msg : '');
        }

        if (!normalizedMessage && error?.response?.status) {
            normalizedMessage = `Request failed (${error.response.status})`;
        }

        if (normalizedMessage) {
            error.message = normalizedMessage;
            error.userMessage = normalizedMessage;
        }

        return Promise.reject(error);
    }
);

export default httpClient;
