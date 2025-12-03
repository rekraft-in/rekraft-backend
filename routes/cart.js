const express = require('express');
const {
    addToCart,
    getCart,
    updateCartItem,
    removeFromCart,
    clearCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
    .get(protect, getCart);

router.route('/add')
    .post(protect, addToCart);

router.route('/item/:itemId')
    .put(protect, updateCartItem)
    .delete(protect, removeFromCart);

router.route('/clear')
    .delete(protect, clearCart);

module.exports = router;