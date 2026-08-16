// Load environment variables FIRST, before any other imports
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const { validateAIConfig } = require('./config/aiConfig');

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
const soilRoutes = require('./routes/soilRoutes');
const fertilizerRoutes = require('./routes/fertilizerRoutes');
const amiRoutes = require('./routes/amiRoutes');

// Validate Central AI Configuration at server startup
validateAIConfig();

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
app.use('/api/soil', soilRoutes);
app.use('/api/fertilizer', fertilizerRoutes);
app.use('/api/ami', amiRoutes);

// Basic health check
app.get('/', (req, res) => {
    res.json({
        status: 'running',
        message: 'Kisan Sahayak - Evidence-Grounded Agricultural AI Copilot Backend API',
        version: '3.0.0',
        model_architecture: {
            provider: process.env.MODEL_PROVIDER || 'openrouter',
            model: process.env.MODEL_NAME || 'nvidia/nemotron-3.5-lightning:free',
            rag_enabled: true,
            vision_model: process.env.VISION_MODEL_NAME || 'nvidia/nemotron-nano-12b-v2-vl:free'
        },
        endpoints: {
            auth: '/api/auth (register, login, profile)',
            farms: '/api/farms (CRUD)',
            weather: '/api/weather (current + forecast)',
            ai: '/api/ai (advisory, chat, history)',
            images: '/api/images (upload, analyze)',
            schemes: '/api/schemes (govt schemes, chat)',
            notifications: '/api/notifications (alerts)',
            location: '/api/location (reverse geocode, satellite)',
            crop: '/api/crop (scan, diagnostics)',
            mandi: '/api/mandi-prices (APMC prices)',
            soil: '/api/soil (soil analysis)',
            fertilizer: '/api/fertilizer (fertilizer advisory)',
            ami: '/api/ami (AIF infrastructure data)'
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
    console.log(`\n🌾 Kisan Sahayak Agricultural AI Copilot running on port ${PORT}`);
    console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🏠 Health Check:  http://localhost:${PORT}/\n`);
});
