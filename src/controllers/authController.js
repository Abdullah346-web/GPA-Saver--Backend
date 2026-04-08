const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Login Controller
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const identifier = String(email || '').trim().toLowerCase();
    const isDbConnected = mongoose.connection.readyState === 1;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    if (!isDbConnected) {
      const isFallbackAdmin =
        (identifier === 'admin123@gmail.com' || identifier === 'admin') &&
        password === 'abdullah12345';

      if (!isFallbackAdmin) {
        return res.status(503).json({
          success: false,
          message: 'Database is unavailable. Only fallback admin login is allowed right now.',
        });
      }

      const token = generateToken('fallback-admin', 'admin');
      return res.status(200).json({
        success: true,
        message: 'Fallback admin login successful',
        token,
        user: {
          id: 'fallback-admin',
          name: 'Admin',
          username: 'admin',
          email: 'admin123@gmail.com',
          role: 'admin',
        },
      });
    }

    // Find user with password field
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Compare passwords
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated',
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    // Single-device login: Save the new token, invalidating any previous sessions
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          isOnline: true,
          lastLoginAt: new Date(),
          currentToken: token,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Logout Controller
const logout = async (req, res) => {
  try {
    if (req.userId && req.userId !== 'fallback-admin') {
      // Single-device login: Clear the current token on logout
      await User.updateOne(
        { _id: req.userId },
        {
          $set: {
            isOnline: false,
            currentToken: null,
          },
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Register User (Admin only)
const registerUser = async (req, res) => {
  try {
    const { name, username, password, email } = req.body;
    const normalizedUsername = String(username || '').trim().toLowerCase();
    const normalizedEmail = email ? String(email).trim().toLowerCase() : undefined;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      return res.status(503).json({
        success: false,
        message: 'Database is unavailable. Please try again in a moment.',
      });
    }

    // Validation
    if (!name || !normalizedUsername || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, username, and password',
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username: normalizedUsername });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists',
      });
    }

    // Check if email already exists (when provided)
    if (normalizedEmail) {
      const existingEmail = await User.findOne({ email: normalizedEmail });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists',
        });
      }
    }

    // Create new user
    const newUser = new User({
      name,
      username: normalizedUsername,
      password,
      role: 'user',
    });

    // Only set email when user actually provides one
    if (normalizedEmail) {
      newUser.email = normalizedEmail;
    }

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const firstMessage = Object.values(error.errors || {})[0]?.message || 'Validation failed';
      return res.status(400).json({
        success: false,
        message: firstMessage,
      });
    }

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      const fieldName = duplicateField === 'email' ? 'Email' : 'Username';
      return res.status(400).json({
        success: false,
        message: `${fieldName} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Admin create user (Admin only)
const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedName = String(name || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPassword = String(password || '');
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      return res.status(503).json({
        success: false,
        message: 'Database is unavailable. Please try again in a moment.',
      });
    }

    if (!normalizedName || !normalizedEmail || !normalizedPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const emailRegex = /^25f-cy-\d{3}@gmail\.com$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format. Use 25f-cy-XXX@gmail.com',
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);

    const newUser = await User.create({
      name: normalizedName,
      username: normalizedEmail,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'user',
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

module.exports = {
  login,
  logout,
  registerUser,
  createUser,
  generateToken,
};
