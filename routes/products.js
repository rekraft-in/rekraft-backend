// routes/products.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// In your backend routes/products.js
router.get('/', async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, suggest } = req.query;
    
    console.log('🔍 Search query received:', { search, category, minPrice, maxPrice, suggest });
    
    // Build filter object
    let filter = {};
    
    // Enhanced Search filter
    if (search && search.trim() !== '') {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      
      filter.$or = [
        { name: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
        { description: searchRegex },
        { 'specs': searchRegex }
      ];
    }
    
    // Category filter
    if (category && category !== 'all') {
      filter.category = { $regex: category, $options: 'i' };
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }
    
    console.log('🎯 MongoDB filter:', JSON.stringify(filter));
    
    const products = await Product.find(filter).limit(suggest ? 8 : 100);
    
    console.log('📦 Products found:', products.length);
    
    // For suggestions, return limited data
    if (suggest) {
      const suggestions = products.map(product => ({
        id: product._id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        price: product.price,
        image: product.image,
        condition: product.condition
      }));
      return res.json(suggestions);
    }
    
    res.json(products);
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

module.exports = router;