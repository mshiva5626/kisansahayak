const express = require('express');
const router = express.Router();
const { 
    getAdvisory, 
    getAdvisoryHistory, 
    chat, 
    getSessions, 
    getSessionById, 
    deleteSession 
} = require('../controllers/advisoryController');
const { protect } = require('../middleware/authMiddleware');

// Full AI copilot advisory
router.post('/advisory', protect, getAdvisory);

// Advisory history for a farm
router.get('/advisory/farm/:farmId', protect, getAdvisoryHistory);

// Multi-turn chat with attachments & session memory
router.post('/chat', protect, chat);

// Chat sessions memory
router.get('/sessions', protect, getSessions);
router.get('/sessions/:sessionId', protect, getSessionById);
router.delete('/sessions/:sessionId', protect, deleteSession);

module.exports = router;
