const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const soilController = require('../controllers/soilController');

// Route to analyze soil
router.post('/analyze', protect, soilController.analyzeSoil);

module.exports = router;
