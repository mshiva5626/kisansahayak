const express = require('express');
const router = express.Router();
const { getWeather } = require('../services/weatherService');
const { getIsConnected } = require('../config/db');
const { protect } = require('../middleware/authMiddleware');

// Mongoose model
let Farm;
try { Farm = require('../models/Farm'); } catch (e) { }

// Memory store
const { FarmStore } = require('../memoryStore');

// Helper
async function getFarm(farmId, userId) {
    if (getIsConnected()) {
        return Farm.findOne({ _id: farmId, userId });
    }
    return FarmStore.findOne({ _id: farmId, userId });
}

// Get weather by lat/lon query params
router.get('/', protect, async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ message: 'Latitude and Longitude are required' });
    }

    try {
        const weatherData = await getWeather(lat, lon);
        res.status(200).json(weatherData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get weather for a specific farm (by farm ID)
router.get('/farm/:farmId', protect, async (req, res) => {
    try {
        const farm = await getFarm(req.params.farmId, req.user._id);
        if (!farm) {
            return res.status(404).json({ message: 'Farm not found' });
        }

        if (!farm.latitude || !farm.longitude) {
            return res.status(400).json({ message: 'Farm does not have coordinates set' });
        }

        const weatherData = await getWeather(farm.latitude, farm.longitude);
        res.status(200).json({ farm_name: farm.farm_name, ...weatherData });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
