import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to include the JWT token in headers
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Add a response interceptor to handle expired/invalid tokens
API.interceptors.response.use(
    (response) => response,
    (error) => {
        const msg = error.response?.data?.message || '';
        if ((error.response?.status === 401 || error.response?.status === 404) && (msg.includes('token') || msg === 'User not found')) {
            // Token is invalid or expired — clear it and force re-login
            console.warn('Invalid token detected, clearing session...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (email, password, name) => API.post('/auth/register', { email, password, name }),
    login: (email, password) => API.post('/auth/login', { email, password }),
    getProfile: () => API.get('/auth/profile'),
    updateProfile: (profileData) => API.put('/auth/profile', profileData),
    requestPasswordReset: (email) => API.post('/auth/forgot-password', { email }),
    verifyPasswordReset: (email, otp, newPassword) => API.post('/auth/reset-password', { email, otp, newPassword }),
    // Legacy OTP methods (kept for backward compatibility)
    requestOTP: (phone) => API.post('/auth/request-otp', { phone }),
    verifyOTP: (phone, code) => API.post('/auth/verify-otp', { phone, code })
};

// Farm API
export const farmAPI = {
    createFarm: (farmData) => API.post('/farms', farmData),
    getFarms: () => API.get('/farms'),
    getFarmById: (id) => API.get(`/farms/${id}`),
    updateFarm: (id, farmData) => API.put(`/farms/${id}`, farmData),
    deleteFarm: (id) => API.delete(`/farms/${id}`)
};

// Weather API
export const weatherAPI = {
    getWeather: (lat, lon) => API.get('/weather', { params: { lat, lon } }),
    getWeatherByFarm: (farmId) => API.get(`/weather/farm/${farmId}`)
};

// AI Copilot API
export const aiAPI = {
    getAdvisory: (farm_id, query, image_analysis) => API.post('/ai/advisory', { farm_id, query, image_analysis }),
    getAdvisoryHistory: (farmId) => API.get(`/ai/advisory/farm/${farmId}`),
    chat: (query, farmData) => API.post('/ai/chat', { query, farmData })
};

// Image API
export const imageAPI = {
    uploadImage: (formData) => API.post('/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    analyzeImage: (imageId) => API.post(`/images/analyze/${imageId}`),
    getImagesByFarm: (farmId) => API.get(`/images/farm/${farmId}`)
};

// Government Schemes API
export const schemeAPI = {
    getSchemes: (state) => API.get('/schemes', { params: state ? { state } : {} }),
    getSchemeById: (id) => API.get(`/schemes/${id}`),
    seedSchemes: () => API.post('/schemes/seed')
};

// Notification API
export const notificationAPI = {
    getNotifications: () => API.get('/notifications'),
    markAsRead: (id) => API.put(`/notifications/${id}/read`),
    markAllAsRead: () => API.put('/notifications/read-all'),
    createAlert: (alertData) => API.post('/notifications/alert', alertData)
};

// Crop API (legacy)
export const cropAPI = {
    scanCrop: (imageData) => API.post('/crop/scan', { image: imageData })
};

// Location API
export const locationAPI = {
    getSatelliteImage: (lat, lon) => API.get('/location/satellite', { params: { lat, lon } })
};

export default API;
