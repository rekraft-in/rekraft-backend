const Razorpay = require('razorpay');
const Order = require('../models/Order');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', orderId } = req.body;

    const options = {
      amount: amount * 100, // amount in paise
      currency,
      receipt: `receipt_${orderId}`,
      payment_capture: 1
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Update order with Razorpay order ID
    await Order.findByIdAndUpdate(orderId, {
      razorpayOrderId: razorpayOrder.id
    });

    res.json({
      success: true,
      data: razorpayOrder
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Payment gateway error'
    });
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payments/verify-payment
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature === razorpay_signature) {
      // Payment successful
      const order = await Order.findByIdAndUpdate(
        orderId,
        {
          paymentStatus: 'completed',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          orderStatus: 'confirmed'
        },
        { new: true }
      );

      res.json({
        success: true,
        data: order,
        message: 'Payment verified successfully'
      });
    } else {
      // Payment failed
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: 'failed'
      });

      res.status(400).json({
        success: false,
        error: 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Payment verification error'
    });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPayment
};