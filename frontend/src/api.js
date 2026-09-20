import axios from 'axios';

const getApiBaseUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl && envUrl.trim() !== '') {
        return envUrl.replace(/\/+$/, '');
    }
    // Local developer environment
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return 'http://127.0.0.1:5000/api';
    }
    // Production (Vercel / deployed domain proxied via vercel.json)
    return '/api';
};

const API_BASE_URL = getApiBaseUrl();

const API = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000, // 5-second fail-fast timeout so requests never freeze the UI indefinitely
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'Bypass-Tunnel-Reminder': 'true'
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
        // Only trigger session clear for explicit 401 auth failures, never on network error or timeouts
        if (error.response?.status === 401 && (msg.includes('token') || msg === 'User not found' || msg.includes('expired'))) {
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
    register: (payloadOrEmail, password, name) => {
        if (typeof payloadOrEmail === 'object' && payloadOrEmail !== null) {
            return API.post('/auth/register', payloadOrEmail);
        }
        return API.post('/auth/register', { email: payloadOrEmail, password, name });
    },
    login: (email, password) => API.post('/auth/login', { email, password }),
    getProfile: () => API.get('/auth/profile'),
    updateProfile: (profileData) => API.put('/auth/profile', profileData),
    getGoogleAuthUrl: (redirectTo) => API.get('/auth/google-url', { params: { redirectTo } }),
    syncGoogleUser: (accessToken, user) => API.post('/auth/google-sync', { accessToken, user }),
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

// AI Copilot API (with extended timeout for LLM inference)
export const aiAPI = {
    getAdvisory: (farm_id, query, image_analysis, attachments, language, personalization_mode) => 
        API.post('/ai/advisory', { farm_id, query, image_analysis, attachments, language, personalization_mode }, { timeout: 60000 }),
    getAdvisoryHistory: (farmId) => API.get(`/ai/advisory/farm/${farmId}`),
    chat: (messages, farm_id, language, personalization_mode, attachments, session_id) => 
        API.post('/ai/chat', { messages, farm_id, language, personalization_mode, attachments, session_id }, { timeout: 60000 }),
    getSessions: () => API.get('/ai/sessions'),
    getSessionById: (sessionId) => API.get(`/ai/sessions/${sessionId}`),
    deleteSession: (sessionId) => API.delete(`/ai/sessions/${sessionId}`),
    // AI Daily Tasks & Field Survey
    getDailySurvey: (farmId, lang) => API.get(`/ai/daily-survey/${farmId || 'default'}`, { params: { lang }, timeout: 30000 }),
    submitDailySurvey: (farmId, responses, language) => API.post(`/ai/daily-survey/${farmId || 'default'}/submit`, { responses, language }, { timeout: 60000 }),
    getDailyTasks: (farmId, lang) => API.get(`/ai/daily-tasks/${farmId || 'default'}`, { params: { lang } }),
    updateTaskStatus: (farmId, taskId, status) => API.put(`/ai/daily-tasks/${farmId || 'default'}/task/${taskId}`, status)
};

// Image API
export const imageAPI = {
    uploadImage: (formData) => API.post('/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000
    }),
    analyzeImage: (imageId) => API.post(`/images/analyze/${imageId}`, {}, { timeout: 60000 }),
    getImagesByFarm: (farmId) => API.get(`/images/farm/${farmId}`)
};

// Government Schemes API
export const schemeAPI = {
    getSchemes: (state) => API.get('/schemes', { params: state ? { state } : {} }),
    getRealtimeSchemes: (state) => API.get('/schemes/realtime', { params: state ? { state } : {} }),
    getSchemeById: (id) => API.get(`/schemes/${id}`),
    seedSchemes: () => API.post('/schemes/seed'),
    chatSchemes: (messages, schemesContext) => API.post('/schemes/chat', { messages, schemesContext }, { timeout: 60000 })
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
    scanCrop: (imageData) => API.post('/crop/scan', { image: imageData }, { timeout: 60000 })
};

// Location API
export const locationAPI = {
    getSatelliteImage: (lat, lon) => API.get('/location/satellite', { params: { lat, lon } }),
    reverseGeocode: (lat, lon) => API.get('/location/reverse-geocode', { params: { lat, lon } })
};

// Mandi Prices API (Grounded in Official Govt Agmarknet & e-NAM)
export const mandiAPI = {
    getPrices: (farmId, state, district, crop, search) => API.get('/mandi-prices', { 
        params: { farm_id: farmId || undefined, state, district, crop, search } 
    }),
    getTrending: () => API.get('/mandi-prices/trending'),
    getSources: () => API.get('/mandi-prices/sources')
};

// Soil API
export const soilAPI = {
    analyzeSoil: (farmId, imageBase64) => API.post('/soil/analyze', { farmId, image: imageBase64 }, { timeout: 60000 })
};

// Unified Soil Intelligence API (Scan + IoT + Fertilizer Recommendation Engine)
export const soilIntelligenceAPI = {
    analyzePhoto: (farmId, imageBase64) => API.post('/soil-intelligence/analyze-photo', { farmId, image: imageBase64 }, { timeout: 60000 }),
    estimateNPK: (sensorData) => API.post('/soil-intelligence/estimate-npk', sensorData),
    recommendFertilizer: (data) => API.post('/soil-intelligence/recommend-fertilizer', data),
    generateReport: (farmId, soilScanResults, iotData) => API.post('/soil-intelligence/generate-report', { farmId, soilScanResults, iotData }),
    getHistory: (farmId) => API.get(`/soil-intelligence/history/${farmId}`),
    pushSensorReading: (data) => API.post('/soil-intelligence/sensor-data', data),
    getSensorHistory: (farmId) => API.get(`/soil-intelligence/sensor-history/${farmId}`)
};

// AMI AIF API
export const amiAPI = {
    getSummary: () => API.get('/ami/summary'),
    getStatesAndDistricts: () => API.get('/ami/states-districts'),
    getProjects: (params) => API.get('/ami/projects', { params })
};

export default API;
