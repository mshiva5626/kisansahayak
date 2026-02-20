const express = require('express');
const router = express.Router();
const { getAdvisory, getAdvisoryHistory, chat } = require('../controllers/advisoryController');
const { protect } = require('../middleware/authMiddleware');

// Full AI copilot advisory
router.post('/advisory', protect, getAdvisory);

// Advisory history for a farm
router.get('/advisory/farm/:farmId', protect, getAdvisoryHistory);

// Simple chat (lightweight)
router.post('/chat', protect, chat);

module.exports = router;
