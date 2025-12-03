const express = require('express');
const { protect } = require('../middleware/auth');
const { createRazorpayOrder, verifyPayment } = require('../controllers/paymentController');
const router = express.Router();

router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify-payment', protect, verifyPayment);

module.exports = router;