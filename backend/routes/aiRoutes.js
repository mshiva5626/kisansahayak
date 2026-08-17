const express = require('express');
const router = express.Router();
const { 
    getAdvisory, 
    getAdvisoryHistory, 
    chat, 
    getSessions, 
    getSessionById, 
    deleteSession,
    getFieldSurvey,
    getDailyTasks,
    submitSurveyAndGetTasks,
    updateTaskStatus
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

// Daily Operations & Field Checks + Adaptive Diagnostic Surveys
router.get('/daily-survey/:farmId', protect, getFieldSurvey);
router.post('/daily-survey/:farmId/submit', protect, submitSurveyAndGetTasks);
router.get('/daily-tasks/:farmId', protect, getDailyTasks);
router.put('/daily-tasks/:farmId/task/:taskId', protect, updateTaskStatus);

module.exports = router;

