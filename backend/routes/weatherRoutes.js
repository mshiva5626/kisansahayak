const express = require('express');
const router = express.Router();
const { getWeather } = require('../services/weatherService');
const { getSupabase } = require('../config/db');
const { protect } = require('../middleware/authMiddleware');

// Helper
async function getFarm(farmId, userId) {
    const supabase = getSupabase();
    const { data } = await supabase
        .from('farms')
        .select('*')
        .eq('id', farmId)
        .eq('user_id', userId)
        .maybeSingle();

    if (data) data._id = data.id;
    return data;
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

        const lat = farm.latitude || farm.location?.lat;
        const lon = farm.longitude || farm.location?.lon;

        if (!lat || !lon) {
            return res.status(400).json({ message: 'Farm does not have coordinates set' });
        }

        const weatherData = await getWeather(lat, lon);
        res.status(200).json({ farm_name: farm.farm_name, ...weatherData });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
