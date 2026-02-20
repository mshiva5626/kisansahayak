const { getIsConnected } = require('../config/db');

// Create a new farm
exports.createFarm = async (req, res) => {
    try {
        const farmData = {
            userId: req.user._id,
            farm_name: req.body.farm_name || req.body.name,
            state: req.body.state || '',
            area: req.body.area || '',
            terrain_type: (req.body.terrain_type || req.body.terrain || '').toLowerCase(),
            water_source: (req.body.water_source || req.body.waterSource || '').toLowerCase(),
            crop_type: req.body.crop_type || req.body.crop || '',
            sowing_date: req.body.sowing_date || req.body.sowingDate || null,
            latitude: req.body.latitude || (req.body.location && req.body.location.lat) || null,
            longitude: req.body.longitude || (req.body.location && req.body.location.lon) || null
        };

        let farm;
        if (getIsConnected()) {
            const Farm = require('../models/Farm');
            farm = await Farm.create(farmData);
        } else {
            const { FarmStore } = require('../memoryStore');
            farm = await FarmStore.create(farmData);
        }

        res.status(201).json({ farm });
    } catch (error) {
        console.error('Create farm error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get all farms for a user
exports.getFarms = async (req, res) => {
    try {
        let farms;
        if (getIsConnected()) {
            const Farm = require('../models/Farm');
            farms = await Farm.find({ userId: req.user._id }).sort({ createdAt: -1 });
        } else {
            const { FarmStore } = require('../memoryStore');
            farms = await FarmStore.find({ userId: req.user._id }, { createdAt: -1 });
        }
        res.status(200).json({ farms });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single farm by ID
exports.getFarmById = async (req, res) => {
    try {
        let farm;
        if (getIsConnected()) {
            const Farm = require('../models/Farm');
            farm = await Farm.findOne({ _id: req.params.id, userId: req.user._id });
        } else {
            const { FarmStore } = require('../memoryStore');
            farm = await FarmStore.findOne({ _id: req.params.id, userId: req.user._id });
        }
        if (!farm) return res.status(404).json({ message: 'Farm not found' });
        res.status(200).json({ farm });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a farm
exports.updateFarm = async (req, res) => {
    try {
        let farm;
        if (getIsConnected()) {
            const Farm = require('../models/Farm');
            farm = await Farm.findOne({ _id: req.params.id, userId: req.user._id });
        } else {
            const { FarmStore } = require('../memoryStore');
            farm = await FarmStore.findOne({ _id: req.params.id, userId: req.user._id });
        }
        if (!farm) return res.status(404).json({ message: 'Farm not found' });

        const fields = ['farm_name', 'state', 'area', 'terrain_type', 'water_source', 'crop_type', 'sowing_date', 'latitude', 'longitude', 'status'];
        fields.forEach(field => {
            if (req.body[field] !== undefined) farm[field] = req.body[field];
        });

        if (getIsConnected()) {
            await farm.save();
        } else {
            const { FarmStore } = require('../memoryStore');
            await FarmStore.save(farm);
        }
        res.status(200).json({ farm });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a farm
exports.deleteFarm = async (req, res) => {
    try {
        let farm;
        if (getIsConnected()) {
            const Farm = require('../models/Farm');
            farm = await Farm.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        } else {
            const { FarmStore } = require('../memoryStore');
            farm = await FarmStore.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        }
        if (!farm) return res.status(404).json({ message: 'Farm not found' });
        res.status(200).json({ message: 'Farm deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
