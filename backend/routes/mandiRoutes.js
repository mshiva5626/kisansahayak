const express = require('express');
const router = express.Router();
const { getMandiPrices, getTrendingPrices, getSources } = require('../controllers/mandiController');
const { protect } = require('../middleware/authMiddleware');

// Get Mandi Prices (Protected)
// Supports ?state=...&district=...&crop=...&search=...&farm_id=...
router.get('/', protect, getMandiPrices);
router.get('/trending', protect, getTrendingPrices);
router.get('/sources', protect, getSources);

module.exports = router;
