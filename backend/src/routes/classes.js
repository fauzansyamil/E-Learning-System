// src/routes/classRoutes.js
const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticateToken, authorize } = require('../middlewares/auth');

// ==================== Class CRUD Routes ====================

// CREATE - Create new class (Admin/Dosen only)
router.post('/', 
  authenticateToken, 
  authorize(['admin', 'dosen']), 
  classController.createClass
);

// READ - Get all classes (filtered by role)
router.get('/', 
  authenticateToken, 
  classController.getAllClasses
);

// READ - Get class by ID
router.get('/:id', 
  authenticateToken, 
  classController.getClassById
);

// READ - Get students in a class
router.get('/:id/students', 
  authenticateToken, 
  classController.getClassStudents
);

// UPDATE - Update class (Admin/Instructor only)
router.put('/:id', 
  authenticateToken, 
  authorize(['admin', 'dosen']), 
  classController.updateClass
);

// DELETE - Delete class (Admin only)
router.delete('/:id', 
  authenticateToken, 
  authorize(['admin']), 
  classController.deleteClass
);

// ==================== Enrollment Routes ====================

// Enroll student to class
router.post('/:classId/enroll', 
  authenticateToken, 
  classController.enrollStudent
);

// Unenroll student from class
router.delete('/:classId/enroll/:studentId', 
  authenticateToken, 
  authorize(['admin', 'dosen']), 
  classController.unenrollStudent
);

module.exports = router;