// src/app.js - Main Application File
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const app = express();

// ==================== Middlewares ====================
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // HTTP request logger
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Static files (untuk serve uploaded files)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Create upload directories if not exist
const uploadDirs = [
  'public/uploads/materials',
  'public/uploads/profiles',
  'public/uploads/assignments'
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ==================== Import Routes ====================
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const classRoutes = require('./routes/classes');
const materialRoutes = require('./routes/materials');
const assignmentRoutes = require('./routes/assignments');
const discussionRoutes = require('./routes/discussions');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');
const gradeRoutes = require('./routes/grades');

// New routes for LMS features
const moduleRoutes = require('./routes/modules');
const scheduleRoutes = require('./routes/schedules');
const announcementRoutes = require('./routes/announcements');
const gradeNewRoutes = require('./routes/gradesNew');

// ==================== API Routes ====================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/grades', gradeRoutes);

// New LMS feature routes
app.use('/api/modules', moduleRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/grades-new', gradeNewRoutes); // Enhanced grades with components

// ==================== Root Route ====================
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to E-Learning LMS API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'Login user',
        'POST /api/auth/logout': 'Logout user',
        'GET /api/auth/me': 'Get current user'
      },
      users: {
        'GET /api/users': 'Get all users (admin only)',
        'GET /api/users/me': 'Get current user profile',
        'GET /api/users/:id': 'Get user by ID',
        'POST /api/users': 'Create user (admin only)',
        'PUT /api/users/:id': 'Update user',
        'PUT /api/users/:id/change-password': 'Change password',
        'DELETE /api/users/:id': 'Delete user (admin only)',
        'GET /api/users/stats': 'Get user statistics (admin only)'
      },
      classes: {
        'GET /api/classes': 'Get all classes',
        'GET /api/classes/:id': 'Get class by ID',
        'POST /api/classes': 'Create class (admin/dosen)',
        'PUT /api/classes/:id': 'Update class',
        'DELETE /api/classes/:id': 'Delete class (admin)',
        'POST /api/classes/:classId/enroll': 'Enroll student',
        'GET /api/classes/:id/students': 'Get class students'
      },
      materials: {
        'GET /api/materials/class/:classId': 'Get materials by class',
        'GET /api/materials/:id': 'Get material by ID',
        'POST /api/materials': 'Create material (dosen/admin)',
        'PUT /api/materials/:id': 'Update material',
        'PUT /api/materials/reorder': 'Reorder materials',
        'DELETE /api/materials/:id': 'Delete material'
      },
      assignments: {
        'GET /api/assignments/class/:classId': 'Get assignments by class',
        'GET /api/assignments/:id': 'Get assignment by ID',
        'POST /api/assignments': 'Create assignment (dosen/admin)',
        'PUT /api/assignments/:id': 'Update assignment',
        'DELETE /api/assignments/:id': 'Delete assignment',
        'POST /api/assignments/:assignmentId/submit': 'Submit assignment (mahasiswa)',
        'GET /api/assignments/:assignmentId/submissions': 'Get submissions (dosen)',
        'PUT /api/assignments/submissions/:submissionId/grade': 'Grade submission (dosen)'
      },
      discussions: {
        'GET /api/discussions/class/:classId': 'Get discussions by class',
        'GET /api/discussions/:id': 'Get discussion detail',
        'POST /api/discussions': 'Create discussion',
        'PUT /api/discussions/:id': 'Update discussion',
        'DELETE /api/discussions/:id': 'Delete discussion',
        'POST /api/discussions/:discussion_id/replies': 'Create reply',
        'PUT /api/discussions/replies/:id': 'Update reply',
        'DELETE /api/discussions/replies/:id': 'Delete reply'
      },
      notifications: {
        'GET /api/notifications': 'Get user notifications',
        'GET /api/notifications/unread-count': 'Get unread count',
        'GET /api/notifications/:id': 'Get notification by ID',
        'POST /api/notifications/bulk': 'Send bulk notifications (admin)',
        'POST /api/notifications/send-to-class': 'Send to class (dosen/admin)',
        'PUT /api/notifications/:id/read': 'Mark as read',
        'PUT /api/notifications/read-all': 'Mark all as read',
        'DELETE /api/notifications/:id': 'Delete notification',
        'DELETE /api/notifications/read/all': 'Delete all read',
        'DELETE /api/notifications/all': 'Delete all'
      },
      dashboard: {
        'GET /api/dashboard/stats': 'Get dashboard statistics',
        'GET /api/dashboard/recent-activities': 'Get recent activities'
      },
      grades: {
        'GET /api/grades/class/:classId': 'Get grades by class (dosen/admin)',
        'GET /api/grades/student/:studentId': 'Get student grades',
        'GET /api/grades/my-grades': 'Get my grades (mahasiswa)',
        'GET /api/grades/assignment/:assignmentId': 'Get grades by assignment',
        'GET /api/grades/distribution/:classId': 'Get grade distribution',
        'GET /api/grades/export/:classId': 'Get grades for export',
        'GET /api/grades/statistics': 'Get overall statistics'
      }
    }
  });
});

// ==================== 404 Handler ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

// ==================== Error Handler ====================
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Multer error handling
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB for materials and 5MB for profiles'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;