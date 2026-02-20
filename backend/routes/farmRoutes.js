const express = require('express');
const router = express.Router();
const { createFarm, getFarms, getFarmById, updateFarm, deleteFarm } = require('../controllers/farmController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createFarm);
router.get('/', protect, getFarms);
router.get('/:id', protect, getFarmById);
router.put('/:id', protect, updateFarm);
router.delete('/:id', protect, deleteFarm);

module.exports = router;
