const express = require('express');
const router = express.Router();
const { getMandiPrices } = require('../controllers/mandiController');
const { protect } = require('../middleware/authMiddleware');

// Get Mandi Prices (Protected)
// Accepts ?farm_id=... parameter
router.get('/', protect, getMandiPrices);

module.exports = router;
