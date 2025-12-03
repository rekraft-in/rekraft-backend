const express = require('express');
const {
    createSellSubmission,
    getSellSubmissions,
    getSellSubmission,
    updateSellSubmission
} = require('../controllers/sellController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All sell routes require authentication
router.post('/', protect, createSellSubmission);
router.get('/', protect, getSellSubmissions);
router.get('/:id', protect, getSellSubmission);
router.put('/:id', protect, updateSellSubmission);

module.exports = router;