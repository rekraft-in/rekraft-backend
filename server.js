const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const { protect } = require('./middleware/auth');
const cors = require('cors');

// Import routes
const cartRoutes = require('./routes/cart');
const sellRoutes = require('./routes/sell');
const contactRoutes = require('./routes/contact');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const authRoutes = require('./routes/auth');
const addressRoutes = require('./routes/addresses');

const app = express();

// CORS configuration - ADD YOUR FRONTEND URLS HERE
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://rekraft.in',
  'https://www.rekraft.in',
  'https://rekraft-frontend.vercel.app',
  'https://rekraft-frontend-37tdkmv55-rekraft-ins-projects.vercel.app',
  'https://rekraft-frontend-git-main-rekraft-ins-projects.vercel.app'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      console.error('❌ MONGO_URI is not defined!');
      console.log('💡 Check Render Environment Variables');
      process.exit(1);
    }
    
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected Successfully!');
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    process.exit(1);
  }
};

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback-secret-key', { expiresIn: '30d' });
};

// -------- ROUTES --------
app.use('/api/cart', cartRoutes);
app.use('/api/sell', sellRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user/addresses', addressRoutes);

// -------- HEALTH CHECK --------
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Rekraft Backend is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// -------- ROOT ROUTE --------
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Rekraft Backend Server is running!',
    apiUrl: 'https://rekraft-backend.onrender.com',
    endpoints: {
      health: 'GET /api/health',
      products: 'GET /api/products',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      user: 'GET /api/auth/me (protected)',
      cart: 'GET /api/cart',
      orders: 'GET /api/orders',
      addresses: 'GET /api/user/addresses'
    },
    version: '1.0.0'
  });
});

// -------- PRODUCTS API --------
function getDefaultSpecs(category) {
  const specs = {
    apple: ["13.3\" Retina Display", "Apple M1/M2 Chip", "8GB RAM", "256GB SSD", "18hr Battery Life"],
    dell: ["13.4\" FHD+ Display", "Intel i5 Processor", "8GB RAM", "512GB SSD", "Intel Iris Xe Graphics"],
    hp: ["14\" FHD Display", "Intel i5 Processor", "8GB RAM", "256GB SSD", "Windows 11 Pro"],
    lenovo: ["14\" WUXGA Display", "Intel i5 Processor", "16GB RAM", "512GB SSD", "Backlit Keyboard"],
    asus: ["14\" OLED Display", "Intel i7 Processor", "16GB RAM", "512GB SSD", "NumberPad"],
    acer: ["14\" FHD IPS Display", "AMD Ryzen 5", "8GB RAM", "512GB SSD", "AMD Radeon Graphics"],
    msi: ["15.6\" FHD Display", "Intel i5 Processor", "8GB RAM", "512GB SSD", "NVIDIA Graphics"]
  };
  return specs[category] || specs.dell;
}

app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    
    const transformed = products.map(product => ({
      id: product._id,
      name: product.name,
      price: `₹${product.price.toLocaleString()}`,
      originalPrice: `₹${Math.round(product.price * 1.3).toLocaleString()}`,
      image: product.image,
      condition: product.condition,
      category: product.category,
      brand: product.brand,
      description: product.description,
      warranty: "1 Year Warranty",
      specs: getDefaultSpecs(product.category),
      rating: 4.5,
      reviews: Math.floor(Math.random() * 100) + 50,
      inStock: true
    }));

    console.log(`📦 Sent ${transformed.length} products`);
    res.json(transformed);
  } catch (error) {
    console.error('❌ Products error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error fetching products' 
    });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }

    const transformed = {
      id: product._id,
      name: product.name,
      price: `₹${product.price.toLocaleString()}`,
      originalPrice: `₹${Math.round(product.price * 1.3).toLocaleString()}`,
      image: product.image,
      condition: product.condition,
      category: product.category,
      brand: product.brand,
      description: product.description,
      warranty: "1 Year Warranty",
      specs: getDefaultSpecs(product.category),
      rating: 4.5,
      reviews: Math.floor(Math.random() * 100) + 50,
      inStock: true
    };

    res.json(transformed);
  } catch (error) {
    console.error('❌ Product detail error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error fetching product' 
    });
  }
});

// -------- AUTH API --------
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ 
        success: false,
        error: 'All fields required' 
      });
    }
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        error: 'User already exists' 
      });
    }
    
    const user = await User.create({ name, email, password, phone });
    
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        token: generateToken(user._id)
      },
      message: 'Registration successful!'
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error during registration' 
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password required' 
      });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }
    
    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }
    
    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        addresses: user.addresses || [],
        token: generateToken(user._id)
      },
      message: 'Login successful!'
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error during login' 
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
    console.error('❌ Error in /api/auth/me:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching user data'
    });
  }
});

// -------- 404 HANDLER --------
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    url: req.originalUrl
  });
});

// -------- ERROR HANDLER --------
app.use((err, req, res, next) => {
  console.error('🚨 Server error:', err);
  res.status(500).json({ 
    success: false,
    error: 'Internal Server Error' 
  });
});

// -------- START SERVER --------
const startServer = async () => {
  try {
    // Connect to database first
    await connectDB();
    
    const PORT = process.env.PORT || 10000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 API URL: https://rekraft-backend.onrender.com`);
      console.log(`✅ Health Check: https://rekraft-backend.onrender.com/api/health`);
      console.log(`📦 Products: https://rekraft-backend.onrender.com/api/products`);
      console.log(`✅ MongoDB: Connected`);
      console.log(`✅ CORS enabled for: ${allowedOrigins.join(', ')}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();