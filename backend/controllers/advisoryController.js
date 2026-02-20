const { getIsConnected } = require('../config/db');
const { getAIAdvisory } = require('../services/aiService');
const { getWeather } = require('../services/weatherService');

// Mongoose models (only used when MongoDB is connected)
let Advisory, Farm, User, Scheme;
try { Advisory = require('../models/Advisory'); } catch (e) { }
try { Farm = require('../models/Farm'); } catch (e) { }
try { User = require('../models/User'); } catch (e) { }
try { Scheme = require('../models/Scheme'); } catch (e) { }

// Memory stores
const { FarmStore, UserStore, AdvisoryStore, SchemeStore } = require('../memoryStore');
const schemeSeedData = require('../config/schemeSeedData');
SchemeStore.load(schemeSeedData);

// Helper: get schemes for state
async function getSchemesForState(state) {
    if (!state) return [];
    try {
        if (getIsConnected() && Scheme) {
            return await Scheme.find({
                $or: [
                    { scheme_type: 'central' },
                    { state: { $regex: new RegExp(state, 'i') } }
                ]
            }).limit(5);
        }
        // Memory store
        const schemes = await SchemeStore.find(state ? { state } : {});
        return schemes.slice(0, 5);
    } catch (e) {
        console.error('Error fetching schemes for AI config:', e);
        return [];
    }
}

// Helper: get farm by id + userId
async function getFarm(farmId, userId) {
    if (getIsConnected()) {
        return Farm.findOne({ _id: farmId, userId });
    }
    return FarmStore.findOne({ _id: farmId, userId });
}

// Helper: get user
async function getUser(userId) {
    if (getIsConnected()) {
        return User.findById(userId).select('-password');
    }
    const user = await UserStore.findById(userId);
    if (user) {
        const { password, ...rest } = user;
        return rest;
    }
    return null;
}

// Helper: save advisory
async function saveAdvisory(data) {
    if (getIsConnected()) {
        return Advisory.create(data);
    }
    return AdvisoryStore.create(data);
}

// Get a full AI advisory for a farm
exports.getAdvisory = async (req, res) => {
    try {
        const { farm_id, query, image_analysis } = req.body;

        if (!farm_id || !query) {
            return res.status(400).json({ message: 'farm_id and query are required' });
        }

        const farm = await getFarm(farm_id, req.user._id);
        if (!farm) {
            return res.status(404).json({ message: 'Farm not found' });
        }

        // Conditional Feature Logic (Rule 2)
        if (!farm.crop_type || !farm.latitude || !farm.longitude) {
            return res.status(200).json({
                response: 'Insufficient farm setup. Please complete farm configuration.',
                weather: null,
                created_at: new Date()
            });
        }

        const farmer = await getUser(req.user._id);

        // Fetch weather if coordinates available
        let weatherData = null;
        try {
            weatherData = await getWeather(farm.latitude, farm.longitude);
        } catch (err) {
            console.error('Weather fetch failed for advisory:', err.message);
            return res.status(200).json({
                response: 'Insufficient farm setup. Please complete farm configuration.',
                weather: null,
                created_at: new Date()
            });
        }

        // Fetch schemes for the AI context
        let schemesData = [];
        const stateForSchemes = farm.state || farmer?.state;
        if (stateForSchemes) {
            schemesData = await getSchemesForState(stateForSchemes);
        }

        const context = {
            farmer: {
                name: farmer?.name,
                state: farmer?.state,
                district: farmer?.district,
                farming_type: farmer?.farming_type,
                preferred_language: farmer?.preferred_language
            },
            farm: {
                farm_name: farm.farm_name,
                state: farm.state,
                area: farm.area,
                terrain_type: farm.terrain_type,
                water_source: farm.water_source,
                crop_type: farm.crop_type,
                sowing_date: farm.sowing_date,
                latitude: farm.latitude,
                longitude: farm.longitude
            },
            weather: weatherData,
            image_analysis: image_analysis || null,
            schemes: schemesData
        };

        const advisoryText = await getAIAdvisory(query, context);

        const advisory = await saveAdvisory({
            farm_id: farm._id,
            advisory_text: advisoryText,
            weather_snapshot: weatherData,
            query: query
        });

        res.status(200).json({
            advisory_id: advisory._id,
            response: advisoryText,
            weather: weatherData,
            created_at: advisory.createdAt
        });
    } catch (error) {
        console.error('Advisory error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get advisory history for a farm
exports.getAdvisoryHistory = async (req, res) => {
    try {
        const farm = await getFarm(req.params.farmId, req.user._id);
        if (!farm) {
            return res.status(404).json({ message: 'Farm not found' });
        }

        let advisories;
        if (getIsConnected()) {
            advisories = await Advisory.find({ farm_id: req.params.farmId })
                .sort({ createdAt: -1 })
                .limit(50);
        } else {
            advisories = await AdvisoryStore.find({ farm_id: req.params.farmId });
        }

        res.status(200).json({ advisories });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Simple chat endpoint (lighter than full advisory)
exports.chat = async (req, res) => {
    try {
        const { query, farmData } = req.body;
        if (!query) {
            return res.status(400).json({ message: 'Query is required' });
        }

        // Enforce Rule 2 Checks
        if (!farmData || !farmData.crop_type || !farmData.latitude || !farmData.longitude) {
            return res.status(200).json({ response: 'Insufficient farm setup. Please complete farm configuration.' });
        }

        const context = {
            farmer: { name: req.user.name || 'Farmer' },
            farm: farmData || {},
            weather: null,
            image_analysis: null
        };

        // Fetch real weather, fail if unreachable
        try {
            context.weather = await getWeather(farmData.latitude, farmData.longitude);
        } catch (err) {
            console.error('Weather fetch for chat failed:', err.message);
            return res.status(200).json({ response: 'Insufficient farm setup. Please complete farm configuration.' });
        }

        // If farmData has state/district, enrich farmer context
        if (farmData?.state) {
            context.farmer.state = farmData.state;
        }

        const stateForSchemes = context.farmer.state;
        if (stateForSchemes) {
            context.schemes = await getSchemesForState(stateForSchemes);
        }

        const response = await getAIAdvisory(query, context);
        res.status(200).json({ response });
    } catch (error) {
        console.error('Chat error:', error.message);
        res.status(500).json({ message: error.message });
    }
};
