const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// Configure nodemailer - FIXED: createTransport (not createTransporter)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

// Generate random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate JWT Token (same as in server.js)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Register
router.post('/register', async (req, res) => {
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
router.post('/login', async (req, res) => {
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

// Forgot Password - Send OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('🔄 Forgot password request for:', email);

    // Validation
    if (!email) {
      return res.status(400).json({ 
        success: false,
        error: 'Email is required' 
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'No account found with this email' 
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore.set(email, { otp, expiresAt });

    console.log('📧 Sending OTP to:', email, 'OTP:', otp);

    // For development - if email fails, return OTP in response
    try {
      // Send email with OTP
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset OTP - Rekraft',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #8f1eae; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Rekraft</h1>
            </div>
            <div style="padding: 20px;">
              <h2 style="color: #8f1eae;">Password Reset Request</h2>
              <p>You requested to reset your password for your Rekraft account.</p>
              <div style="background: #f5f2fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                <h3 style="margin: 0; color: #8f1eae; font-size: 24px; letter-spacing: 5px;">${otp}</h3>
                <p style="margin: 10px 0 0 0; color: #666;">This OTP will expire in 10 minutes</p>
              </div>
              <p>If you didn't request this, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">Rekraft - Premium Refurbished Electronics</p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('✅ OTP sent successfully to:', email);

      res.json({ 
        success: true,
        message: 'Password reset OTP sent to your email',
        expiresIn: '10 minutes'
      });

    } catch (emailError) {
      console.log('📧 Email sending failed, returning OTP in response:', otp);
      res.json({ 
        success: true,
        message: 'Password reset OTP generated',
        otp: otp, // Return OTP for development
        expiresIn: '10 minutes'
      });
    }

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Verify OTP
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log('🔄 OTP verification for:', email);

    // Validation
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and OTP are required' 
      });
    }

    // Check if OTP exists and is valid
    const storedData = otpStore.get(email);
    if (!storedData) {
      return res.status(400).json({ 
        success: false,
        error: 'OTP not found or expired' 
      });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ 
        success: false,
        error: 'OTP has expired' 
      });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid OTP' 
      });
    }

    // OTP is valid - mark as verified
    otpStore.set(email, { ...storedData, verified: true });

    console.log('✅ OTP verified successfully for:', email);

    res.json({ 
      success: true,
      message: 'OTP verified successfully' 
    });

  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Reset Password - FIXED VERSION
router.post('/reset-password', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('? Password reset for:', email);

        // Validation
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Email and password are required' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                success: false,
                error: 'Password must be at least 6 characters long' 
            });
        }

        // Check if OTP was verified
        const storedData = otpStore.get(email);
        if (!storedData || !storedData.verified) {
            return res.status(400).json({ 
                success: false,
                error: 'OTP verification required' 
            });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }

        // FIX: Directly update the password field - the pre('save') middleware will hash it
        user.password = password; // Set plain text password, middleware will hash it
        await user.save(); // This triggers the pre('save') middleware to hash the password

        // Clear OTP from store
        otpStore.delete(email);

        console.log('? Password reset successfully for:', email);

        res.json({ 
            success: true,
            message: 'Password reset successfully' 
        });

    } catch (error) {
        console.error('? Reset password error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error' 
        });
    }
});

module.exports = router;