const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const amiService = require('../services/amiService');

// Get summary statistics
router.get('/summary', protect, (req, res) => {
    try {
        const summary = amiService.getSummary();
        res.status(200).json({ summary });
    } catch (error) {
        console.error('Error fetching AMI summary:', error.message);
        res.status(500).json({ message: 'Failed to fetch AMI summary data.' });
    }
});

// Get mapped states and districts
router.get('/states-districts', protect, (req, res) => {
    try {
        const data = amiService.getStatesAndDistricts();
        res.status(200).json({ statesAndDistricts: data });
    } catch (error) {
        console.error('Error fetching AMI states and districts:', error.message);
        res.status(500).json({ message: 'Failed to fetch states and districts data.' });
    }
});

// Get filtered projects list
router.get('/projects', protect, (req, res) => {
    try {
        const filters = {
            state: req.query.state,
            district: req.query.district,
            beneficiaryType: req.query.beneficiaryType,
            projectType: req.query.projectType,
            status: req.query.status,
            search: req.query.search,
            limit: req.query.limit,
            sortBy: req.query.sortBy
        };
        const projects = amiService.getProjects(filters);
        res.status(200).json({ projects });
    } catch (error) {
        console.error('Error fetching AMI projects:', error.message);
        res.status(500).json({ message: 'Failed to search AMI projects.' });
    }
});

module.exports = router;
