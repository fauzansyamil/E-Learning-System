// src/routes/assignments.js
const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Public routes (all authenticated users)
router.get('/class/:classId', assignmentController.getAssignmentsByClass);
router.get('/:id', assignmentController.getAssignmentById);

// Admin & Dosen only
router.post('/', authorizeRoles('admin', 'dosen'), assignmentController.createAssignment);
router.post('/submissions/:submissionId/grade', authorizeRoles('admin', 'dosen'), assignmentController.gradeSubmission);

// Mahasiswa only
router.post('/:assignmentId/submit', authorizeRoles('mahasiswa'), assignmentController.submitAssignment);

module.exports = router;