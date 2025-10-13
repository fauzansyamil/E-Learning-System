// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Middleware untuk verifikasi JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    // Verifikasi token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ 
          success: false, 
          message: 'Invalid or expired token' 
        });
      }

      // Ambil data user dari database
      const [users] = await pool.query(
        `SELECT u.id, u.username, u.email, u.full_name, r.name as role 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.id = ? AND u.is_active = true`,
        [decoded.userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found or inactive' 
        });
      }

      req.user = users[0];
      next();
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication' 
    });
  }
};

// Middleware untuk authorization berdasarkan role
const authorizeRoles = (...allowedRoles) => {
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
        message: 'You do not have permission to perform this action' 
      });
    }

    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };