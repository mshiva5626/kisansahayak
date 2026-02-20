const { getIsConnected } = require('../config/db');
const { analyzeImageWithAI } = require('../services/imageAnalysisService');
const path = require('path');

// Mongoose models
let Image, Farm;
try { Image = require('../models/Image'); } catch (e) { }
try { Farm = require('../models/Farm'); } catch (e) { }

// Memory stores
const { FarmStore, ImageStore } = require('../memoryStore');

// Helper
async function getFarm(farmId, userId) {
    if (getIsConnected()) {
        return Farm.findOne({ _id: farmId, userId });
    }
    return FarmStore.findOne({ _id: farmId, userId });
}

// Upload an image for a farm
exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        const { farm_id, image_type } = req.body;

        if (!farm_id) {
            return res.status(400).json({ message: 'farm_id is required' });
        }

        const farm = await getFarm(farm_id, req.user._id);
        if (!farm) {
            return res.status(404).json({ message: 'Farm not found' });
        }

        const image_url = `/uploads/${req.file.filename}`;

        let image;
        if (getIsConnected()) {
            image = await Image.create({
                farm_id,
                image_url,
                image_type: image_type || 'field'
            });
        } else {
            image = await ImageStore.create({
                farm_id,
                image_url,
                image_type: image_type || 'field'
            });
        }

        res.status(201).json({ image });
    } catch (error) {
        console.error('Upload image error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Analyze an uploaded image with AI
exports.analyzeImage = async (req, res) => {
    try {
        let image;
        if (getIsConnected()) {
            image = await Image.findById(req.params.id);
        } else {
            image = await ImageStore.findById(req.params.id);
        }

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        const farm = await getFarm(image.farm_id, req.user._id);
        if (!farm) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const imagePath = path.join(__dirname, '..', image.image_url);

        const analysisResult = await analyzeImageWithAI(imagePath, image.image_type, farm);

        // Save analysis result
        image.analysis_result = analysisResult.analysis;
        image.confidence_score = analysisResult.confidence_score;

        if (getIsConnected()) {
            await image.save();
        } else {
            await ImageStore.save(image);
        }

        res.status(200).json({
            image_id: image._id,
            image_type: image.image_type,
            analysis_result: analysisResult.analysis,
            confidence_score: analysisResult.confidence_score,
            indicators: analysisResult.indicators
        });
    } catch (error) {
        console.error('Analyze image error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get all images for a farm
exports.getImagesByFarm = async (req, res) => {
    try {
        const farm = await getFarm(req.params.farmId, req.user._id);
        if (!farm) {
            return res.status(404).json({ message: 'Farm not found' });
        }

        let images;
        if (getIsConnected()) {
            images = await Image.find({ farm_id: req.params.farmId }).sort({ createdAt: -1 });
        } else {
            images = await ImageStore.find({ farm_id: req.params.farmId });
        }

        res.status(200).json({ images });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
