const express = require('express');
const router = express.Router();
const { getSchemes, getSchemeById, seedSchemes, chatSchemes, realtimeSchemes } = require('../controllers/schemesController');
const { protect } = require('../middleware/authMiddleware');

// Get all schemes (optionally filtered by state)
router.get('/', protect, getSchemes);

// Get real-time AI generated schemes (Must be defined BEFORE /:id to prevent routing clash)
router.get('/realtime', protect, realtimeSchemes);

// Get a single scheme by ID
router.get('/:id', protect, getSchemeById);

// Seed initial scheme data
router.post('/seed', seedSchemes);

// AI Chat for Schemes
router.post('/chat', protect, chatSchemes);

module.exports = router;
