// src/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middlewares/auth');

// ==================== Dashboard Routes ====================

// Get dashboard statistics (role-based)
router.get('/stats', 
  authenticateToken, 
  dashboardController.getDashboardStats
);

// Get recent activities
router.get('/recent-activities', 
  authenticateToken, 
  dashboardController.getRecentActivities
);

// Get upcoming events (assignments, classes, etc)
router.get('/upcoming-events', 
  authenticateToken, 
  dashboardController.getUpcomingEvents
);

module.exports = router;