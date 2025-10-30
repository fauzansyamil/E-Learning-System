// backend/src/routes/gradesNew.js
const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const { authenticateToken, authorize } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticateToken);

// ==================== Grade Components ====================

// CREATE - Create grade component (Dosen/Admin)
router.post('/components',
  authorize(['admin', 'dosen']),
  gradeController.createGradeComponent
);

// READ - Get grade components by class
router.get('/components/class/:classId',
  gradeController.getGradeComponentsByClass
);

// UPDATE - Update grade component
router.put('/components/:id',
  authorize(['admin', 'dosen']),
  gradeController.updateGradeComponent
);

// DELETE - Delete grade component
router.delete('/components/:id',
  authorize(['admin', 'dosen']),
  gradeController.deleteGradeComponent
);

// ==================== Component Grades ====================

// CREATE/UPDATE - Grade a student on a component (Dosen/Admin)
router.post('/component-scores',
  authorize(['admin', 'dosen']),
  gradeController.gradeComponentScore
);

// READ - Get student's component grades for a class
router.get('/component-scores/class/:classId/student/:studentId',
  authorize(['admin', 'dosen']),
  gradeController.getStudentComponentGrades
);

// ==================== Final Grades ====================

// READ - Get final grades for a class (Dosen/Admin)
router.get('/final/class/:classId',
  authorize(['admin', 'dosen']),
  gradeController.getFinalGradesByClass
);

// READ - Get my final grade (Student)
router.get('/final/class/:classId/my-grade',
  gradeController.getMyFinalGrade
);

// UPDATE - Publish/unpublish grades (Dosen/Admin)
router.post('/final/publish',
  authorize(['admin', 'dosen']),
  gradeController.publishGrades
);

// UPDATE - Recalculate all grades for a class (Dosen/Admin)
router.post('/final/class/:classId/recalculate',
  authorize(['admin', 'dosen']),
  gradeController.recalculateClassGrades
);

module.exports = router;
