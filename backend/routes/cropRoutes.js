const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const { analyzeImageWithAI } = require('../services/imageAnalysisService');
const fs = require('fs');
const path = require('path');

router.post('/scan', protect, async (req, res) => {
    try {
        const { image, crop } = req.body;
        if (!image) {
            return res.status(400).json({ message: 'No image data provided' });
        }

        // Ensure uploads directory exists
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const fileName = `legacy-scan-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
        const filePath = path.join(uploadsDir, fileName);

        let imageBuffer;
        if (image.startsWith('data:image')) {
            const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
            imageBuffer = Buffer.from(base64Data, 'base64');
        } else if (image.startsWith('http')) {
            return res.status(400).json({ message: 'URL images are not supported in scan route' });
        } else {
            imageBuffer = Buffer.from(image, 'base64');
        }

        fs.writeFileSync(filePath, imageBuffer);

        const dummyFarm = {
            crop_type: crop || 'General',
            terrain_type: 'Plain',
            state: req.user?.state || '',
            location: {
                state: req.user?.state || 'Unknown',
                district: req.user?.district || 'Unknown'
            }
        };

        const analysisResult = await analyzeImageWithAI(filePath, 'leaf', dummyFarm, req.user);

        // Delete the temp file asynchronously
        fs.unlink(filePath, (err) => {
            if (err) console.warn('Failed to delete temp legacy scan file:', err.message);
        });

        res.status(200).json({
            crop: dummyFarm.crop_type,
            analysis: analysisResult.analysis.disease_name,
            confidence: analysisResult.confidence_score,
            recommendation: analysisResult.analysis.overall_assessment,
            analysis_result: analysisResult.analysis,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Legacy scan route error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
