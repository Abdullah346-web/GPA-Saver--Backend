const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token and validate single-device login
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;

    // Single-device login: Fetch user and compare token
    if (req.userId !== 'fallback-admin') {
      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      // Check if the incoming token matches the stored current token
      if (user.currentToken !== token) {
        return res.status(401).json({
          success: false,
          message: 'Logged in from another device',
        });
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

// Middleware to check if user is admin
const adminOnly = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }
  next();
};

module.exports = {
  authenticate,
  adminOnly,
};
