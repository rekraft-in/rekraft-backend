const User = require('../models/User');
const Product = require('../models/Product');

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user._id;

    console.log('🛒 Add to cart request:', { productId, quantity, userId });

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    const user = await User.findById(userId);
    
    // Check if item exists
    const existingItemIndex = user.cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      user.cart.items[existingItemIndex].quantity += parseInt(quantity);
    } else {
      // Add new item to cart
      user.cart.items.push({
        productId,
        quantity: parseInt(quantity),
        price: product.price
      });
    }

    // Update cart total and save
    user.updateCartTotal();
    await user.save();
    
    // Populate product details
    await user.populate('cart.items.productId', 'name price image brand condition');

    console.log('✅ Cart updated successfully for user:', user.email);

    res.json({
      success: true,
      message: 'Item added to cart',
      cart: user.cart
    });
  } catch (error) {
    console.error('❌ Cart add error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error adding to cart', 
      error: error.message 
    });
  }
};

// In cartController.js - Ensure this is correct
exports.getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('cart.items.productId', 'name price image brand condition');
    
    console.log('🛒 Cart fetched for user:', user.email, 'Items:', user.cart.items.length);
    
    res.json({ 
      success: true,
      cart: {
        items: user.cart.items,
        totalPrice: user.cart.totalPrice,
        updatedAt: user.cart.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Cart fetch error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching cart', 
      error: error.message 
    });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    const cartItem = user.cart.items.id(itemId);
    
    if (!cartItem) {
      return res.status(404).json({ 
        success: false,
        message: 'Cart item not found' 
      });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      user.cart.items.pull({ _id: itemId });
    } else {
      // Update quantity
      cartItem.quantity = quantity;
    }

    user.updateCartTotal();
    await user.save();
    await user.populate('cart.items.productId', 'name price image brand condition');

    res.json({
      success: true,
      message: 'Cart updated successfully',
      cart: user.cart
    });
  } catch (error) {
    console.error('❌ Cart update error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating cart', 
      error: error.message 
    });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    user.cart.items.pull({ _id: itemId });
    
    user.updateCartTotal();
    await user.save();
    await user.populate('cart.items.productId', 'name price image brand condition');

    res.json({
      success: true,
      message: 'Item removed from cart',
      cart: user.cart
    });
  } catch (error) {
    console.error('❌ Cart remove error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error removing item', 
      error: error.message 
    });
  }
};

// Clear entire cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    user.cart.items = [];
    user.cart.totalPrice = 0;
    user.cart.updatedAt = new Date();
    
    await user.save();

    res.json({ 
      success: true,
      message: 'Cart cleared successfully', 
      cart: user.cart 
    });
  } catch (error) {
    console.error('❌ Cart clear error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error clearing cart', 
      error: error.message 
    });
  }
};