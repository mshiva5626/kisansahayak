const express = require('express');
const router = express.Router();
const { getAddressFromCoords, getSatelliteImage } = require('../services/locationService');
const { protect } = require('../middleware/authMiddleware');

router.get('/reverse', protect, async (req, res) => {
    const { lat, lon } = req.query;
    try {
        const address = await getAddressFromCoords(lat, lon);
        res.status(200).json({ address });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/satellite', protect, async (req, res) => {
    const { lat, lon } = req.query;
    const imageUrl = getSatelliteImage(lat, lon);
    res.status(200).json({ url: imageUrl });
});

module.exports = router;
