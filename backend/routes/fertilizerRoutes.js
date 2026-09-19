const express = require('express');
const router = express.Router();
const fertilizerController = require('../controllers/fertilizerController');

// POST route for AI chat completions
router.post('/ask', fertilizerController.askMarketplace);

// GET route for ICAR & S.R. Reddy NPK estimation & prescription
router.get('/npk-estimate', fertilizerController.getNPKEstimate);

// POST route for placing fertilizer order
router.post('/orders', fertilizerController.createOrder);

module.exports = router;
