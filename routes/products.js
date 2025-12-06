// routes/products.js - UPDATED & FIXED VERSION
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Timeout handler middleware
const withTimeout = (handler, timeout = 30000) => {
  return async (req, res, next) => {
    let timeoutId;
    
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);
    });

    try {
      // Race between handler and timeout
      await Promise.race([handler(req, res, next), timeoutPromise]);
    } catch (error) {
      if (error.message.includes('timeout')) {
        console.error('⏰ Request timeout for:', req.method, req.url);
        if (!res.headersSent) {
          return res.status(504).json({ 
            error: 'Request timeout', 
            message: 'Database query took too long. Please try again.' 
          });
        }
      } else {
        next(error);
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };
};

// Helper function to get test products (no database required)
const getTestProducts = () => {
  return [
    {
      _id: 'test-macbook-1',
      name: 'MacBook Air M1 (8GB/256GB)',
      price: 64999,
      originalPrice: 79999,
      image: 'https://m.media-amazon.com/images/I/71TPda7cwUL._SL1500_.jpg',
      condition: 'Excellent',
      category: 'apple',
      brand: 'Apple',
      description: 'Apple MacBook Air with M1 chip, 8GB RAM, 256GB SSD. Certified refurbished with 1-year warranty.',
      specs: ['M1 Chip (8-core CPU)', '8GB Unified Memory', '256GB SSD', '13.3-inch Retina Display', 'macOS Monterey', 'Up to 18 hours battery'],
      warranty: '1 Year Rekraft Warranty',
      stock: 5,
      rating: 4.8,
      reviews: 42
    },
    {
      _id: 'test-dell-2',
      name: 'Dell XPS 13 (i5/8GB/512GB)',
      price: 54999,
      originalPrice: 69999,
      image: 'https://m.media-amazon.com/images/I/71h6PpG9uQS._SL1500_.jpg',
      condition: 'Good',
      category: 'windows',
      brand: 'Dell',
      description: 'Dell XPS 13 Ultrabook with Intel Core i5, 8GB RAM, 512GB SSD. Professionally refurbished.',
      specs: ['Intel Core i5-1135G7', '8GB LPDDR4x RAM', '512GB NVMe SSD', '13.4-inch FHD+ Display', 'Windows 11 Pro', 'Intel Iris Xe Graphics'],
      warranty: '6 Months Warranty',
      stock: 3,
      rating: 4.5,
      reviews: 28
    },
    {
      _id: 'test-lenovo-3',
      name: 'Lenovo ThinkPad X1 Carbon',
      price: 59999,
      originalPrice: 74999,
      image: 'https://m.media-amazon.com/images/I/61g+7-wgJCL._SL1500_.jpg',
      condition: 'Very Good',
      category: 'windows',
      brand: 'Lenovo',
      description: 'Lenovo ThinkPad X1 Carbon with Intel i7, 16GB RAM, 512GB SSD. Business-grade refurbished laptop.',
      specs: ['Intel Core i7-1165G7', '16GB RAM', '512GB SSD', '14-inch FHD Display', 'Windows 11 Pro', 'Backlit Keyboard'],
      warranty: '1 Year Warranty',
      stock: 2,
      rating: 4.7,
      reviews: 35
    },
    {
      _id: 'test-hp-4',
      name: 'HP Spectre x360',
      price: 52999,
      originalPrice: 67999,
      image: 'https://m.media-amazon.com/images/I/71H0V8B8mzL._SL1500_.jpg',
      condition: 'Excellent',
      category: 'windows',
      brand: 'HP',
      description: 'HP Spectre x360 2-in-1 convertible laptop with touch display and pen support.',
      specs: ['Intel Core i5-1135G7', '8GB RAM', '512GB SSD', '13.3-inch FHD Touch', 'Windows 11', '360° Hinge'],
      warranty: '1 Year Warranty',
      stock: 4,
      rating: 4.6,
      reviews: 31
    }
  ];
};

// GET all products - with timeout and fallback
router.get('/', withTimeout(async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, suggest, test } = req.query;
    
    console.log('🔍 Products API called:', { 
      search: search ? 'Yes' : 'No',
      category,
      minPrice,
      maxPrice,
      suggest: suggest ? 'Yes' : 'No',
      test: test ? 'Yes' : 'No',
      timestamp: new Date().toISOString()
    });
    
    // If test parameter is provided, return test data immediately
    if (test === 'true') {
      console.log('📦 Returning test products (bypassing database)');
      const testProducts = getTestProducts();
      return res.json(suggest ? testProducts.slice(0, 8) : testProducts);
    }
    
    // Check if we have a working database connection
    const dbStatus = Product.db.readyState;
    console.log('📊 MongoDB connection state:', dbStatus);
    
    if (dbStatus !== 1) { // 1 = connected
      console.warn('⚠️ MongoDB not connected, returning test products');
      const testProducts = getTestProducts();
      return res.json(suggest ? testProducts.slice(0, 8) : testProducts);
    }
    
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
    
    console.log('🎯 MongoDB filter:', JSON.stringify(filter, null, 2));
    
    // Try to get product count first
    const productCount = await Product.countDocuments(filter).maxTimeMS(10000);
    console.log(`📊 Found ${productCount} products matching filter`);
    
    let products;
    if (productCount === 0 && (!search || search.trim() === '') && !category) {
      // If no products in database, return test products
      console.log('📭 No products in database, returning test products');
      products = getTestProducts();
    } else {
      // Get products with limit
      const limit = suggest ? 8 : 100;
      console.log(`📦 Fetching ${limit} products from database`);
      
      products = await Product.find(filter)
        .limit(limit)
        .maxTimeMS(15000) // 15 second timeout for query
        .lean();
      
      console.log(`✅ Retrieved ${products.length} products from database`);
      
      // If no products found but we have a filter, return empty
      if (products.length === 0) {
        console.log('📭 No products match the filter criteria');
      }
    }
    
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
    
    // Return full products
    res.json(products);
    
  } catch (error) {
    console.error('❌ Error in products API:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    // Return test products as fallback
    console.log('🔄 Falling back to test products due to error');
    const testProducts = getTestProducts();
    
    // Apply basic filtering to test products if needed
    const { search, category, suggest } = req.query;
    let filteredProducts = testProducts;
    
    if (search && search.trim() !== '') {
      const searchLower = search.toLowerCase().trim();
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.brand.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }
    
    if (category && category !== 'all') {
      filteredProducts = filteredProducts.filter(p => 
        p.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    if (suggest) {
      const suggestions = filteredProducts.slice(0, 8).map(product => ({
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
    
    res.json(filteredProducts);
  }
}, 25000)); // 25 second timeout for entire request

// GET single product
router.get('/:id', withTimeout(async (req, res) => {
  try {
    const productId = req.params.id;
    console.log(`📦 Fetching product with ID: ${productId}`);
    
    // Check if it's a test ID
    if (productId.startsWith('test-')) {
      const testProducts = getTestProducts();
      const testProduct = testProducts.find(p => p._id === productId);
      
      if (testProduct) {
        console.log(`✅ Found test product: ${testProduct.name}`);
        return res.json(testProduct);
      }
    }
    
    // Try to get from database
    const product = await Product.findById(productId).maxTimeMS(10000);
    
    if (!product) {
      // Try test products as fallback
      const testProducts = getTestProducts();
      const testProduct = testProducts.find(p => p._id === productId);
      
      if (testProduct) {
        console.log(`✅ Found product in test data: ${testProduct.name}`);
        return res.json(testProduct);
      }
      
      return res.status(404).json({ 
        error: 'Product not found',
        message: `No product found with ID: ${productId}` 
      });
    }
    
    console.log(`✅ Found database product: ${product.name}`);
    res.json(product);
    
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    
    // Try test products as fallback
    const testProducts = getTestProducts();
    const testProduct = testProducts.find(p => p._id === req.params.id);
    
    if (testProduct) {
      console.log(`🔄 Falling back to test product: ${testProduct.name}`);
      return res.json(testProduct);
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch product',
      message: error.message 
    });
  }
}, 15000));

// Health check for products route
router.get('/health/check', (req, res) => {
  console.log('🏥 Products route health check');
  
  const dbStatus = Product.db.readyState;
  const status = dbStatus === 1 ? 'healthy' : 'unhealthy';
  
  res.json({
    status,
    database: dbStatus === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    endpoints: {
      getAll: '/api/products',
      getOne: '/api/products/:id',
      testData: '/api/products?test=true'
    }
  });
});

module.exports = router;