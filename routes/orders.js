const express = require('express');
const { protect } = require('../middleware/auth');
const { createOrder, getOrders, getOrderById, updateOrderStatus } = require('../controllers/orderController');
const router = express.Router();

router.route('/')
  .post(protect, createOrder)
  .get(protect, getOrders);

router.route('/:id')
  .get(protect, getOrderById)
  .put(protect, updateOrderStatus);

module.exports = router;