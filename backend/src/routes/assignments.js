// src/routes/assignmentRoutes.js
const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authenticateToken, authorize } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');

// Setup multer for assignment file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/assignments/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'assignment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit for submissions
  fileFilter: function (req, file, cb) {
    // Allowed file types for submissions
    const allowedTypes = /pdf|doc|docx|ppt|pptx|xls|xlsx|jpg|jpeg|png|zip|rar|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type for assignment submission'));
    }
  }
});

// ==================== Assignment CRUD Routes ====================

// CREATE - Create new assignment (Dosen/Admin only)
router.post('/', 
  authenticateToken, 
  authorize(['admin', 'dosen']), 
  assignmentController.createAssignment
);

// READ - Get assignments by class
router.get('/class/:classId', 
  authenticateToken, 
  assignmentController.getAssignmentsByClass
);

// READ - Get assignment by ID
router.get('/:id', 
  authenticateToken, 
  assignmentController.getAssignmentById
);

// UPDATE - Update assignment (Dosen/Admin only)
router.put('/:id', 
  authenticateToken, 
  authorize(['admin', 'dosen']), 
  assignmentController.updateAssignment
);

// DELETE - Delete assignment (Dosen/Admin only)
router.delete('/:id', 
  authenticateToken, 
  authorize(['admin', 'dosen']), 
  assignmentController.deleteAssignment
);

// ==================== Submission Routes ====================

// Submit assignment (Mahasiswa only)
router.post('/:assignmentId/submit', 
  authenticateToken, 
  authorize(['mahasiswa']), 
  upload.single('file'),
  assignmentController.submitAssignment
);

// Get submissions for an assignment (Dosen/Admin)
router.get('/:assignmentId/submissions', 
  authenticateToken, 
  authorize(['admin', 'dosen']), 
  assignmentController.getSubmissions
);

// Grade a submission (Dosen/Admin)
router.put('/submissions/:submissionId/grade', 
  authenticateToken, 
  authorize(['admin', 'dosen']), 
  assignmentController.gradeSubmission
);

// Get my submission (Mahasiswa)
router.get('/:assignmentId/my-submission', 
  authenticateToken, 
  authorize(['mahasiswa']), 
  assignmentController.getMySubmission
);

module.exports = router;