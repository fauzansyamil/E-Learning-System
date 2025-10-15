// backend/src/controllers/assignmentController.js - FULL COMPLETE VERSION
const { pool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ========================================
// MULTER CONFIGURATION
// ========================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/assignments');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'assignment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|zip|rar|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, ZIP, RAR, and images are allowed'));
    }
  }
}).single('file');

// ========================================
// READ OPERATIONS
// ========================================

// Get all assignments for current user - Enhanced with filtering
exports.getAllAssignments = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, course, semester } = req.query;

    let query = '';
    let params = [userId];
    let whereConditions = [];

    if (userRole === 'mahasiswa') {
      query = `
        SELECT a.*, c.name as course, c.code as courseCode,
               asub.submitted_at as submittedDate,
               asub.score,
               asub.feedback,
               asub.submitted_at IS NOT NULL as submitted,
               CASE 
                 WHEN asub.score IS NOT NULL THEN 'graded'
                 WHEN asub.submitted_at IS NOT NULL THEN 'submitted'
                 ELSE 'pending'
               END as status
        FROM assignments a
        JOIN classes c ON a.class_id = c.id
        JOIN class_enrollments ce ON c.id = ce.class_id
        LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.user_id = ?
        WHERE ce.user_id = ?
      `;
      params.push(userId);

      // Add filters
      if (status && status !== 'all') {
        if (status === 'pending') {
          whereConditions.push('asub.submitted_at IS NULL');
        } else if (status === 'submitted') {
          whereConditions.push('asub.submitted_at IS NOT NULL AND asub.score IS NULL');
        } else if (status === 'graded') {
          whereConditions.push('asub.score IS NOT NULL');
        }
      }

      if (course && course !== 'all') {
        whereConditions.push('c.name = ?');
        params.push(course);
      }

      if (whereConditions.length > 0) {
        query += ' AND ' + whereConditions.join(' AND ');
      }

      query += ' ORDER BY a.deadline ASC';

    } else if (userRole === 'dosen') {
      query = `
        SELECT a.*, c.name as course, c.code as courseCode,
               COUNT(DISTINCT asub.id) as total_submissions,
               COUNT(DISTINCT CASE WHEN asub.score IS NOT NULL THEN asub.id END) as graded_submissions
        FROM assignments a
        JOIN classes c ON a.class_id = c.id
        LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id
        WHERE c.instructor_id = ?
        GROUP BY a.id
        ORDER BY a.deadline ASC
      `;
      params = [userId];
    }

    const [assignments] = await pool.query(query, params);

    // Get attachments for each assignment
    const assignmentIds = assignments.map(a => a.id);
    let attachments = [];
    
    if (assignmentIds.length > 0) {
      const [attachmentResults] = await pool.query(
        `SELECT assignment_id, file_name 
         FROM assignment_attachments 
         WHERE assignment_id IN (?)`,
        [assignmentIds]
      );
      attachments = attachmentResults;
    }

    // Map attachments to assignments
    const assignmentsWithAttachments = assignments.map(a => ({
      ...a,
      attachments: attachments
        .filter(att => att.assignment_id === a.id)
        .map(att => att.file_name),
      points: a.max_score,
      type: a.is_group ? 'group' : 'individual'
    }));

    res.json({
      success: true,
      data: assignmentsWithAttachments
    });

  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignments',
      error: error.message
    });
  }
};

// Get assignment by ID
exports.getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [assignments] = await pool.query(
      `SELECT a.*, c.name as course, c.code as courseCode,
              asub.submitted_at, asub.score, asub.feedback
       FROM assignments a
       JOIN classes c ON a.class_id = c.id
       LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.user_id = ?
       WHERE a.id = ?`,
      [userId, id]
    );

    if (assignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Get attachments
    const [attachments] = await pool.query(
      'SELECT file_name, file_path FROM assignment_attachments WHERE assignment_id = ?',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...assignments[0],
        attachments: attachments.map(a => a.file_name)
      }
    });

  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignment',
      error: error.message
    });
  }
};

// ========================================
// CREATE OPERATIONS
// ========================================

// Create new assignment (Lecturer/Admin only)
exports.createAssignment = async (req, res) => {
  try {
    const {
      classId,
      title,
      description,
      deadline,
      maxScore,
      weight,
      type,
      week,
      isGroup
    } = req.body;

    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate required fields
    if (!classId || !title || !deadline || !maxScore) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if user owns the class (for lecturers)
    if (userRole === 'dosen') {
      const [classes] = await pool.query(
        'SELECT * FROM classes WHERE id = ? AND instructor_id = ?',
        [classId, userId]
      );

      if (classes.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to create assignments for this class'
        });
      }
    }

    // Insert assignment
    const [result] = await pool.query(
      `INSERT INTO assignments 
       (class_id, title, description, deadline, max_score, weight, type, week, is_group, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
      [classId, title, description, deadline, maxScore, weight || 10, type || 'assignment', week || 1, isGroup || 0]
    );

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: {
        id: result.insertId,
        title
      }
    });

  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating assignment',
      error: error.message
    });
  }
};

// ========================================
// UPDATE OPERATIONS
// ========================================

// Update assignment
exports.updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      deadline,
      maxScore,
      weight,
      type,
      week,
      isGroup,
      status
    } = req.body;

    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if assignment exists and user has permission
    const [assignments] = await pool.query(
      `SELECT a.*, c.instructor_id
       FROM assignments a
       JOIN classes c ON a.class_id = c.id
       WHERE a.id = ?`,
      [id]
    );

    if (assignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check permission
    if (userRole === 'dosen' && assignments[0].instructor_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this assignment'
      });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (deadline !== undefined) { updates.push('deadline = ?'); params.push(deadline); }
    if (maxScore !== undefined) { updates.push('max_score = ?'); params.push(maxScore); }
    if (weight !== undefined) { updates.push('weight = ?'); params.push(weight); }
    if (type !== undefined) { updates.push('type = ?'); params.push(type); }
    if (week !== undefined) { updates.push('week = ?'); params.push(week); }
    if (isGroup !== undefined) { updates.push('is_group = ?'); params.push(isGroup); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(id);

    await pool.query(
      `UPDATE assignments SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'Assignment updated successfully'
    });

  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating assignment',
      error: error.message
    });
  }
};

// ========================================
// DELETE OPERATIONS
// ========================================

// Delete assignment (Lecturer/Admin only)
exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if assignment exists and user has permission
    const [assignments] = await pool.query(
      `SELECT a.*, c.instructor_id
       FROM assignments a
       JOIN classes c ON a.class_id = c.id
       WHERE a.id = ?`,
      [id]
    );

    if (assignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check permission
    if (userRole === 'dosen' && assignments[0].instructor_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this assignment'
      });
    }

    // Check if there are submissions
    const [submissions] = await pool.query(
      'SELECT COUNT(*) as count FROM assignment_submissions WHERE assignment_id = ?',
      [id]
    );

    if (submissions[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete assignment with existing submissions'
      });
    }

    // Delete assignment
    await pool.query('DELETE FROM assignments WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });

  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting assignment',
      error: error.message
    });
  }
};

// ========================================
// SUBMISSION OPERATIONS
// ========================================

// Submit assignment with file upload
exports.submitAssignment = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    try {
      const { assignmentId } = req.params;
      const userId = req.user.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Check if assignment exists and deadline hasn't passed
      const [assignments] = await pool.query(
        'SELECT * FROM assignments WHERE id = ?',
        [assignmentId]
      );

      if (assignments.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      // Check if already submitted
      const [existing] = await pool.query(
        'SELECT id FROM assignment_submissions WHERE assignment_id = ? AND user_id = ?',
        [assignmentId, userId]
      );

      if (existing.length > 0) {
        // Update existing submission
        await pool.query(
          `UPDATE assignment_submissions 
           SET file_path = ?, file_name = ?, submitted_at = NOW(), status = 'submitted'
           WHERE assignment_id = ? AND user_id = ?`,
          [file.path, file.originalname, assignmentId, userId]
        );
      } else {
        // Create new submission
        await pool.query(
          `INSERT INTO assignment_submissions 
           (assignment_id, user_id, file_path, file_name, submitted_at, status)
           VALUES (?, ?, ?, ?, NOW(), 'submitted')`,
          [assignmentId, userId, file.path, file.originalname]
        );
      }

      res.json({
        success: true,
        message: 'Assignment submitted successfully',
        data: {
          fileName: file.originalname,
          fileSize: file.size,
          submittedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Submit assignment error:', error);
      res.status(500).json({
        success: false,
        message: 'Error submitting assignment',
        error: error.message
      });
    }
  });
};

// Get assignment submissions (for lecturer)
exports.getSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if lecturer owns this assignment
    if (userRole === 'dosen') {
      const [assignment] = await pool.query(
        `SELECT a.* FROM assignments a
         JOIN classes c ON a.class_id = c.id
         WHERE a.id = ? AND c.instructor_id = ?`,
        [assignmentId, userId]
      );

      if (assignment.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    const [submissions] = await pool.query(
      `SELECT asub.*, u.full_name as student_name, u.username
       FROM assignment_submissions asub
       JOIN users u ON asub.user_id = u.id
       WHERE asub.assignment_id = ?
       ORDER BY asub.submitted_at DESC`,
      [assignmentId]
    );

    res.json({
      success: true,
      data: submissions
    });

  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submissions',
      error: error.message
    });
  }
};

// Grade assignment submission (for lecturer)
exports.gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { score, feedback } = req.body;
    const userId = req.user.id;

    // Verify lecturer owns this assignment
    const [submission] = await pool.query(
      `SELECT asub.*, a.class_id, a.max_score
       FROM assignment_submissions asub
       JOIN assignments a ON asub.assignment_id = a.id
       JOIN classes c ON a.class_id = c.id
       WHERE asub.id = ? AND c.instructor_id = ?`,
      [submissionId, userId]
    );

    if (submission.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Validate score
    if (score > submission[0].max_score) {
      return res.status(400).json({
        success: false,
        message: `Score cannot exceed maximum score of ${submission[0].max_score}`
      });
    }

    // Update grade
    await pool.query(
      `UPDATE assignment_submissions 
       SET score = ?, feedback = ?, graded_at = NOW(), status = 'graded'
       WHERE id = ?`,
      [score, feedback, submissionId]
    );

    res.json({
      success: true,
      message: 'Assignment graded successfully'
    });

  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error grading assignment',
      error: error.message
    });
  }
};

module.exports = exports;