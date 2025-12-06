const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cors = require('cors');

const User = require('./models/User');
const Order = require('./models/Order');
const Product = require('./models/Product');
const { protect } = require('./middleware/auth');

// Import routes
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const sellRoutes = require('./routes/sell');
const contactRoutes = require('./routes/contact');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const authRoutes = require('./routes/auth');
const addressRoutes = require('./routes/addresses');

const app = express();

// ------------------- CORS -------------------
// SIMPLIFY CORS FOR NOW - fix later
app.use(cors({
  origin: '*', // Allow all for debugging
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware - IMPROVED
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('📦 Request body:', req.body);
  next();
});

// ------------------- DB CONNECT -------------------
const connectDB = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    if (!process.env.MONGO_URI) {
      console.error('❌ No MONGO_URI found!');
      process.exit(1);
    }
    
    // Add MongoDB connection options
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
    });
    
    console.log('✅ MongoDB Connected!');
    console.log('📊 Database Name:', mongoose.connection.name);
    console.log('🔗 Connection State:', mongoose.connection.readyState);
    
  } catch (error) {
    console.error('❌ MongoDB Error:', error.message);
    console.error('💡 Check your MONGO_URI:', process.env.MONGO_URI ? 'Set (hidden)' : 'Not set');
    process.exit(1);
  }
};

// Generate Token
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'fallback-secret-key', {
    expiresIn: '30d'
  });

// ------------------- TEST ENDPOINTS FIRST -------------------
// Add these BEFORE your regular routes to debug

// Simple test endpoint - ALWAYS responds
app.get('/api/test', (req, res) => {
  console.log('✅ Test endpoint hit');
  res.json({ 
    message: 'Test endpoint works!', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Simple products test endpoint
app.get('/api/products/test', async (req, res) => {
  try {
    console.log('📦 /api/products/test endpoint hit');
    
    // Return dummy data without DB query
    const dummyProducts = [
      {
        _id: 'test-1',
        name: 'MacBook Air M1 (Test)',
        price: 64999,
        image: 'https://m.media-amazon.com/images/I/71TPda7cwUL._SL1500_.jpg',
        condition: 'Excellent',
        category: 'apple',
        brand: 'Apple',
        description: 'Test product - Apple MacBook Air with M1 chip'
      },
      {
        _id: 'test-2',
        name: 'Dell XPS 13 (Test)',
        price: 54999,
        image: 'https://m.media-amazon.com/images/I/71h6PpG9uQS._SL1500_.jpg',
        condition: 'Good',
        category: 'windows',
        brand: 'Dell',
        description: 'Test product - Dell XPS 13 Ultrabook'
      }
    ];
    
    console.log(`📦 Returning ${dummyProducts.length} test products`);
    res.json(dummyProducts);
    
  } catch (error) {
    console.error('❌ Test products error:', error);
    res.status(500).json({ 
      error: 'Test endpoint error', 
      message: error.message 
    });
  }
});

// ------------------- HEALTH CHECK -------------------
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check hit');
  res.json({
    status: 'OK',
    server: 'Rekraft Backend Running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// ------------------- ROOT ROUTE -------------------
app.get('/', (req, res) => {
  console.log('🏠 Root route hit');
  res.json({
    message: '🚀 Rekraft Backend Server is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/',
      '/api/health',
      '/api/test',
      '/api/products/test',
      '/api/products',
      '/api/auth/register',
      '/api/auth/login'
    ]
  });
});

// ------------------- MAIN ROUTES -------------------
// Add timeout middleware for product routes
app.use('/api/products', (req, res, next) => {
  // Set timeout for product requests (30 seconds)
  res.setTimeout(30000, () => {
    console.error('⏰ Product request timeout after 30s');
    if (!res.headersSent) {
      res.status(504).json({ 
        error: 'Request timeout', 
        message: 'Product query took too long' 
      });
    }
  });
  next();
}, productRoutes);

// Other routes
app.use('/api/cart', cartRoutes);
app.use('/api/sell', sellRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user/addresses', addressRoutes);

// ------------------- AUTH ROUTES (Keep existing) -------------------
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('📝 Registration attempt:', req.body.email);
    
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password || !phone) {
      console.log('❌ Missing fields in registration');
      return res.status(400).json({ 
        success: false, 
        error: 'All fields required' 
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ 
        success: false, 
        error: 'User already exists' 
      });
    }

    const user = await User.create({ name, email, password, phone });
    console.log('✅ User created:', user.email);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error('❌ Register Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error',
      message: error.message 
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body.email);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password required' 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    const match = await user.matchPassword(password);
    if (!match) {
      console.log('❌ Password mismatch for:', email);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    console.log('✅ Login successful:', email);
    
    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        addresses: user.addresses || [],
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error('❌ Login Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error',
      message: error.message 
    });
  }
});

app.get('/api/auth/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        addresses: user.addresses || []
      }
    });
  } catch (error) {
    console.error('❌ Auth Me Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error',
      message: error.message 
    });
  }
});

// ------------------- 404 HANDLER -------------------
app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.originalUrl);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    url: req.originalUrl,
    availableEndpoints: [
      '/',
      '/api/health',
      '/api/test',
      '/api/products/test',
      '/api/products',
      '/api/auth/register',
      '/api/auth/login'
    ]
  });
});

// ------------------- ERROR HANDLER -------------------
app.use((err, req, res, next) => {
  console.error('🚨 SERVER ERROR:', err);
  console.error('🚨 Error stack:', err.stack);
  
  res.status(500).json({ 
    success: false, 
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// ------------------- START SERVER -------------------
const startServer = async () => {
  try {
    console.log('🚀 Starting Rekraft backend server...');
    console.log('📁 Current directory:', __dirname);
    console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
    
    await connectDB();

    const PORT = process.env.PORT || 10000;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌍 External URL: https://rekraft-backend.onrender.com`);
      console.log(`🔗 Local URL: http://localhost:${PORT}`);
      console.log(`📊 Health check: https://rekraft-backend.onrender.com/api/health`);
      console.log(`📦 Products test: https://rekraft-backend.onrender.com/api/products/test`);
      console.log(`🎯 Products main: https://rekraft-backend.onrender.com/api/products`);
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
      }
    });

  } catch (error) {
    console.error('❌ Server Start Failed:', error);
    console.error('💡 Troubleshooting tips:');
    console.error('1. Check MONGO_URI in Render environment variables');
    console.error('2. Check if MongoDB Atlas IP whitelist includes Render IP');
    console.error('3. Check if port 10000 is available');
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  console.error('💀 Process will exit...');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();

module.exports = app;