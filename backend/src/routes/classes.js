// src/routes/classes.js
const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Public routes (all authenticated users)
router.get('/', classController.getAllClasses);
router.get('/:id', classController.getClassById);
router.post('/:classId/enroll', classController.enrollStudent);
router.get('/:id/students', classController.getClassStudents);

// Admin & Dosen only
router.post('/', authorizeRoles('admin', 'dosen'), classController.createClass);
router.put('/:id', authorizeRoles('admin', 'dosen'), classController.updateClass);

// Admin only
router.delete('/:id', authorizeRoles('admin'), classController.deleteClass);

module.exports = router;