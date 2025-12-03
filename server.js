const express = require('express');
require('dotenv').config();
const connectDB = require('./config/database');
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
// ADD THIS LINE - Import address routes
const addressRoutes = require('./routes/addresses');

const app = express();

// Connect DB
connectDB();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// -------- ROUTES --------
app.use('/api/cart', cartRoutes);
app.use('/api/sell', sellRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/auth', authRoutes);
// ADD THIS LINE - Register address routes
app.use('/api/user/addresses', addressRoutes);

// -------- HEALTH CHECK ENDPOINT --------
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString(),
    database: 'Connected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// -------- DEFAULT SPECS --------
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

// -------- ROOT ROUTE --------
app.get('/', (req, res) => {
  res.json({
    message: 'Rekraft Backend Server is running!',
    endpoints: {
      health: 'GET /api/health',
      products: 'GET /api/products',
      authRegister: 'POST /api/auth/register',
      authLogin: 'POST /api/auth/login',
      cart: 'GET /api/cart (protected)',
      orders: 'GET /api/orders (protected)',
      contact: 'POST /api/contact/send',
      sell: 'POST /api/sell',
      // ADD THIS LINE - Show address endpoints
      addresses: 'GET/POST/PUT/DELETE /api/user/addresses (protected)'
    },
    version: '1.0.0'
  });
});

// -------- PRODUCTS API --------
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

    console.log('📦 Products fetched:', transformed.length);
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
      error: 'Server error fetching product details' 
    });
  }
});

// -------- AUTH API --------

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    console.log('🔄 Registration attempt:', { name, email, phone });

    // Validation
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ 
        success: false,
        error: 'All fields are required: name, email, password, phone' 
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        error: 'User already exists with this email' 
      });
    }

    const user = await User.create({ name, email, password, phone });

    console.log('✅ User registered:', user.email);

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
    
    // MongoDB duplicate error
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        error: 'User already exists with this email' 
      });
    }
    
    // Validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ 
        success: false,
        error: messages.join(', ') 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Server error during registration' 
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔄 Login attempt:', email);

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    // Use matchPassword method
    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    console.log('✅ User logged in:', user.email);

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

// Get current user (Protected)
app.get('/api/auth/me', protect, async (req, res) => {
  try {
    // Get the complete user with addresses
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
    requestedUrl: req.originalUrl 
  });
});

// -------- GLOBAL ERROR HANDLER --------
app.use((err, req, res, next) => {
  console.error('🚨 Server error:', err);
  res.status(500).json({ 
    success: false,
    error: 'Internal Server Error' 
  });
});

// -------- START SERVER --------
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`✅ CORS enabled for: http://localhost:5173`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
  console.log(`✅ Contact endpoint: POST http://localhost:${PORT}/api/contact/send`);
  console.log(`✅ Sell endpoint: POST http://localhost:${PORT}/api/sell`);
  console.log(`✅ Address endpoint: POST http://localhost:${PORT}/api/user/addresses`);
  console.log(`✅ Available endpoints:`);
  console.log(`   http://localhost:${PORT}/api/products`);
  console.log(`   http://localhost:${PORT}/api/auth/register`);
  console.log(`   http://localhost:${PORT}/api/auth/login`);
  console.log(`   http://localhost:${PORT}/api/cart`);
  console.log(`   http://localhost:${PORT}/api/orders`);
  console.log(`   http://localhost:${PORT}/api/contact`);
  console.log(`   http://localhost:${PORT}/api/user/addresses`);
});