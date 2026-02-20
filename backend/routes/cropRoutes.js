const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

router.post('/scan', protect, async (req, res) => {
    // Mock Crop Analysis Logic
    const crops = ['Wheat', 'Rice', 'Cotton', 'Sugarcane'];
    const randomCrop = crops[Math.floor(Math.random() * crops.length)];
    const issues = ['Healthy', 'Nitrogen Deficiency', 'Late Blight', 'Pest Infestation'];
    const randomIssue = issues[Math.floor(Math.random() * issues.length)];

    setTimeout(() => {
        res.status(200).json({
            crop: randomCrop,
            analysis: randomIssue,
            confidence: 0.92,
            recommendation: `Apply 20kg/acre of balanced fertilizer and monitor for early signs of ${randomIssue}.`,
            timestamp: new Date()
        });
    }, 2000); // Simulate processing time
});

module.exports = router;
