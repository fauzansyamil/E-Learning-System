
// backend/src/routes/grades.js - NEW routes for grades
const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// @route   GET /api/grades
// @desc    Get all grades for current user with breakdown
// @access  Private (Student)
router.get('/', gradeController.getAllGrades);

// @route   GET /api/grades/gpa
// @desc    Calculate GPA for current user
// @access  Private (Student)
router.get('/gpa', gradeController.getGPA);

// @route   GET /api/grades/course/:courseId
// @desc    Get grades for specific course
// @access  Private (Student)
router.get('/course/:courseId', gradeController.getGradesByCourse);

module.exports = router;