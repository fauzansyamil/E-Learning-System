// src/routes/gradeRoutes.js
const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeControllers');
const { authenticateToken, authorize } = require('../middlewares/auth');

// ==================== Grade Routes ====================

// GET - Get grades by class (Dosen/Admin)
router.get('/class/:classId', 
  authenticateToken, 
  authorize(['admin', 'dosen']), 
  gradeController.getGradesByClass
);

// GET - Get specific student grades (Admin/Dosen/Student own grades)
router.get('/student/:studentId', 
  authenticateToken, 
  gradeController.getStudentGrades
);

// GET - Get my grades (Current student)
router.get('/my-grades', 
  authenticateToken, 
  authorize(['mahasiswa']), 
  gradeController.getMyGrades
);

// GET - Get grades by assignment (Dosen/Admin)
router.get('/assignment/:assignmentId', 
  authenticateToken, 
  authorize(['admin', 'dosen']), 
  gradeController.getGradeByAssignment
);

// GET - Get grade distribution (for charts)
router.get('/distribution/:classId', 
  authenticateToken, 
  authorize(['admin', 'dosen']), 
  gradeController.getGradeDistribution
);

// GET - Get grades for export (CSV data)
router.get('/export/:classId', 
  authenticateToken, 
  authorize(['admin', 'dosen']), 
  gradeController.getGradesForExport
);

// GET - Get overall statistics
router.get('/statistics', 
  authenticateToken, 
  gradeController.getOverallStatistics
);

module.exports = router;