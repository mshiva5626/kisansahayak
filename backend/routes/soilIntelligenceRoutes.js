const express = require('express');
const router = express.Router();
const controller = require('../controllers/soilIntelligenceController');
const jwt = require('jsonwebtoken');
const { getSupabase } = require('../config/db');

// Optional auth helper: attaches user if token present, but doesn't block if absent
const optionalAuth = async (req, res, next) => {
    try {
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            const token = req.headers.authorization.split(' ')[1];
            if (token === 'demo-token') {
                req.user = { id: 'demo-user-123', _id: 'demo-user-123', name: 'Demo Farmer' };
                return next();
            }
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kisan_farm_copilot_jwt_secret_2026');
                req.user = decoded;
            } catch (e) {
                req.user = { id: 'anonymous', _id: 'anonymous' };
            }
        } else {
            req.user = { id: 'anonymous', _id: 'anonymous' };
        }
    } catch (err) {
        req.user = { id: 'anonymous', _id: 'anonymous' };
    }
    next();
};

// Unified Soil Intelligence Endpoints
router.post('/analyze-photo', optionalAuth, controller.analyzePhoto);
router.post('/estimate-npk', optionalAuth, controller.estimateNPKFromSensor);
router.post('/recommend-fertilizer', optionalAuth, controller.recommendFertilizerAction);
router.post('/generate-report', optionalAuth, controller.generateReport);
router.get('/history/:farmId', optionalAuth, controller.getHistory);

// ESP32 Direct Ingestion & Telemetry
router.post('/sensor-data', controller.ingestSensorData);
router.get('/sensor-history/:farmId', optionalAuth, controller.getSensorHistory);

module.exports = router;
