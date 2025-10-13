// src/routes/dashboard.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/stats', dashboardController.getStats);
router.get('/recent-activities', dashboardController.getRecentActivities);

module.exports = router;