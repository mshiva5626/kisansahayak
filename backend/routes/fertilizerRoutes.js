const express = require('express');
const router = express.Router();
const fertilizerController = require('../controllers/fertilizerController');

// POST route for chat completions
router.post('/ask', fertilizerController.askMarketplace);

module.exports = router;
