const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadImage, analyzeImage, getImagesByFarm } = require('../controllers/imageController');
const { protect } = require('../middleware/authMiddleware');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Upload an image
router.post('/upload', protect, upload.single('image'), uploadImage);

// Analyze an uploaded image with AI
router.post('/analyze/:id', protect, analyzeImage);

// Get all images for a farm
router.get('/farm/:farmId', protect, getImagesByFarm);

module.exports = router;
