// Load environment variables FIRST, before any other imports
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const farmRoutes = require('./routes/farmRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const aiRoutes = require('./routes/aiRoutes');
const imageRoutes = require('./routes/imageRoutes');
const schemesRoutes = require('./routes/schemesRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const locationRoutes = require('./routes/locationRoutes');
const cropRoutes = require('./routes/cropRoutes');
const mandiRoutes = require('./routes/mandiRoutes');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Connect to DB
connectDB();

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors());

// Serve uploaded files as static
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/schemes', schemesRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/crop', cropRoutes);
app.use('/api/mandi-prices', mandiRoutes);

// Basic health check
app.get('/', (req, res) => {
    res.json({
        status: 'running',
        message: 'AI Copilot for Intelligent Farm Operations - Backend API',
        version: '2.0.0',
        endpoints: {
            auth: '/api/auth (register, login, profile)',
            farms: '/api/farms (CRUD)',
            weather: '/api/weather (current + forecast)',
            ai: '/api/ai (advisory, chat, history)',
            images: '/api/images (upload, analyze)',
            schemes: '/api/schemes (govt schemes)',
            notifications: '/api/notifications (alerts)',
            location: '/api/location (reverse geocode, satellite)',
            crop: '/api/crop (scan, diagnostics)'
        }
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.message);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🌾 AI Farm Copilot Backend running on port ${PORT}`);
    console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🏠 Health Check:  http://localhost:${PORT}/\n`);
});
