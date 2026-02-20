const express = require('express');
const router = express.Router();
const { getSchemes, getSchemeById, seedSchemes } = require('../controllers/schemesController');
const { protect } = require('../middleware/authMiddleware');

// Get all schemes (optionally filtered by state)
router.get('/', protect, getSchemes);

// Get a single scheme by ID
router.get('/:id', protect, getSchemeById);

// Seed initial scheme data
router.post('/seed', seedSchemes);

module.exports = router;
