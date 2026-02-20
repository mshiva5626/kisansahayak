const { getIsConnected } = require('../config/db');
const schemeSeedData = require('../config/schemeSeedData');

// Mongoose model
let Scheme;
try { Scheme = require('../models/Scheme'); } catch (e) { }

// Memory store
const { SchemeStore } = require('../memoryStore');

// Ensure seed data is loaded into memory store
SchemeStore.load(schemeSeedData);

// Get schemes, filtered by state
exports.getSchemes = async (req, res) => {
    try {
        const { state } = req.query;

        let schemes;

        if (getIsConnected()) {
            let query = {};
            if (state) {
                query = {
                    $or: [
                        { scheme_type: 'central' },
                        { state: { $regex: new RegExp(state, 'i') } }
                    ]
                };
            }
            schemes = await Scheme.find(query).sort({ scheme_type: 1, name: 1 });
        } else {
            // Use in-memory store
            schemes = await SchemeStore.find(state ? { state } : {});
        }

        res.status(200).json({ schemes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single scheme by ID
exports.getSchemeById = async (req, res) => {
    try {
        let scheme;
        if (getIsConnected()) {
            scheme = await Scheme.findById(req.params.id);
        } else {
            scheme = await SchemeStore.findById(req.params.id);
        }

        if (!scheme) return res.status(404).json({ message: 'Scheme not found' });
        res.status(200).json({ scheme });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Seed initial schemes data
exports.seedSchemes = async (req, res) => {
    try {
        if (getIsConnected()) {
            const existingCount = await Scheme.countDocuments();
            if (existingCount > 0) {
                return res.status(200).json({ message: `Schemes already seeded (${existingCount} found)` });
            }
            await Scheme.insertMany(schemeSeedData);
            return res.status(201).json({ message: `${schemeSeedData.length} schemes seeded successfully` });
        } else {
            // Memory store auto-loads seed data
            const count = await SchemeStore.count();
            return res.status(200).json({ message: `${count} schemes available (in-memory mode)` });
        }
    } catch (error) {
        console.error('Seed schemes error:', error.message);
        res.status(500).json({ message: error.message });
    }
};
