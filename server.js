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
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://rekraft.in',
  'https://www.rekraft.in',
  'https://rekraft-frontend.vercel.app',
  'https://rekraft-frontend-git-main-rekraft-ins-projects.vercel.app',
  'https://rekraft-frontend-37tdkmv55-rekraft-ins-projects.vercel.app'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
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
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected!');
  } catch (error) {
    console.error('❌ MongoDB Error:', error.message);
    process.exit(1);
  }
};

// Generate Token
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'fallback-secret-key', {
    expiresIn: '30d'
  });

// ------------------- ROUTES -------------------
app.use('/api/products', productRoutes);  // 👉 Your dynamic product API
app.use('/api/cart', cartRoutes);
app.use('/api/sell', sellRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user/addresses', addressRoutes);

// ------------------- HEALTH CHECK -------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    server: 'Rekraft Backend Running',
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ------------------- ROOT ROUTE -------------------
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Rekraft Backend Server is running!',
    version: '1.0.0'
  });
});

// ------------------- AUTH -------------------
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password || !phone)
      return res
        .status(400)
        .json({ success: false, error: 'All fields required' });

    const userExists = await User.findOne({ email });
    if (userExists)
      return res
        .status(400)
        .json({ success: false, error: 'User already exists' });

    const user = await User.create({ name, email, password, phone });

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
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, error: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: 'Invalid credentials' });

    const match = await user.matchPassword(password);
    if (!match)
      return res
        .status(401)
        .json({ success: false, error: 'Invalid credentials' });

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
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.get('/api/auth/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user)
      return res.status(404).json({ success: false, error: 'User not found' });

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
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ------------------- 404 HANDLER -------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    url: req.originalUrl
  });
});

// ------------------- ERROR HANDLER -------------------
app.use((err, req, res, next) => {
  console.error('🚨 SERVER ERROR:', err);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

// ------------------- START SERVER -------------------
const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 10000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 https://rekraft-backend.onrender.com`);
    });
  } catch (error) {
    console.error('❌ Server Start Failed:', error);
    process.exit(1);
  }
};

startServer();
