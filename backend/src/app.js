// src/app.js - Express application setup
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // Static files

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const classRoutes = require('./routes/classes');
const materialRoutes = require('./routes/materials');
const assignmentRoutes = require('./routes/assignments');
const discussionRoutes = require('./routes/discussions');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'E-Learning API is running',
    timestamp: new Date().toISOString()
  });
});

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    message: 'E-Learning API Documentation',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'Login user',
        'GET /api/auth/me': 'Get current user (requires token)',
        'POST /api/auth/logout': 'Logout user'
      },
      users: {
        'GET /api/users': 'Get all users (admin only)',
        'GET /api/users/:id': 'Get user by ID',
        'PUT /api/users/:id': 'Update user',
        'DELETE /api/users/:id': 'Delete user (admin only)'
      },
      classes: {
        'GET /api/classes': 'Get all classes',
        'GET /api/classes/:id': 'Get class detail',
        'POST /api/classes': 'Create new class (admin/dosen)',
        'PUT /api/classes/:id': 'Update class',
        'DELETE /api/classes/:id': 'Delete class (admin only)',
        'POST /api/classes/:classId/enroll': 'Enroll student to class',
        'GET /api/classes/:id/students': 'Get students in class'
      },
      materials: {
        'GET /api/materials/class/:classId': 'Get materials by class',
        'GET /api/materials/:id': 'Get material detail',
        'POST /api/materials': 'Create new material (dosen/admin)',
        'PUT /api/materials/:id': 'Update material',
        'DELETE /api/materials/:id': 'Delete material'
      },
      assignments: {
        'GET /api/assignments/class/:classId': 'Get assignments by class',
        'GET /api/assignments/:id': 'Get assignment detail',
        'POST /api/assignments': 'Create new assignment (dosen/admin)',
        'POST /api/assignments/:assignmentId/submit': 'Submit assignment (mahasiswa)',
        'POST /api/assignments/submissions/:submissionId/grade': 'Grade submission (dosen/admin)'
      },
      discussions: {
        'GET /api/discussions/class/:classId': 'Get discussions by class',
        'GET /api/discussions/:id': 'Get discussion detail with replies',
        'POST /api/discussions': 'Create new discussion',
        'POST /api/discussions/:discussionId/reply': 'Reply to discussion'
      },
      notifications: {
        'GET /api/notifications': 'Get user notifications',
        'PUT /api/notifications/:id/read': 'Mark notification as read',
        'PUT /api/notifications/read-all': 'Mark all notifications as read'
      },
      dashboard: {
        'GET /api/dashboard/stats': 'Get dashboard statistics (role-based)',
        'GET /api/dashboard/recent-activities': 'Get recent activities'
      }
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

module.exports = app;