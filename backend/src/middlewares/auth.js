// src/middlewares/auth.js
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Middleware untuk verifikasi JWT token
exports.authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token using Promise-based approach (FIXED)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Get user from database
    const [users] = await pool.query(
      `SELECT u.id, u.username, u.email, u.full_name, r.name as role, u.is_active
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    // Check if user is active
    if (user.is_active !== 1) {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive'
      });
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Middleware untuk authorization berdasarkan role
exports.authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions'
      });
    }

    next();
  };
};