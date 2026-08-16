const express = require('express');
const router = express.Router();
const { reverseGeocode } = require('../services/locationService');

/**
 * GET /api/location/reverse-geocode?lat=...&lon=...
 * Reverse geocodes coordinates to precise Indian State, District, SubDistrict, and Locality.
 */
router.get('/reverse-geocode', async (req, res) => {
    const { lat, lon, latitude, longitude } = req.query;
    const finalLat = lat || latitude;
    const finalLon = lon || longitude;

    if (!finalLat || !finalLon) {
        return res.status(400).json({ 
            success: false, 
            message: 'Latitude (lat) and Longitude (lon) are required query parameters.' 
        });
    }

    try {
        const locationData = await reverseGeocode(finalLat, finalLon);
        return res.status(200).json({
            success: true,
            location: locationData
        });
    } catch (error) {
        console.error('Location Reverse Geocode Route Error:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to reverse geocode location.'
        });
    }
});

module.exports = router;
