// backend/src/controllers/assignmentController.js - FULL COMPLETE VERSION
import pool from '../config/database.js';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

// ========================================
// MULTER CONFIGURATION
// ========================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/assignments';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ storage });

// ===================
//  CREATE ASSIGNMENT
// ===================
export const createAssignment = async (req, res) => {
  try {
    const { title, description, class_id, deadline } = req.body;
    const file = req.file ? req.file.filename : null;
    const lecturer_id = req.user.id;

    const [result] = await pool.query(
      `INSERT INTO assignments (title, description, class_id, lecturer_id, file, deadline)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description, class_id, lecturer_id, file, deadline]
    );

    res.json({
      success: true,
      message: 'Assignment created successfully',
      data: { id: result.insertId }
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

// ===================
//  GET ALL ASSIGNMENTS (by lecturer or admin)
// ===================
export const getAssignments = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    let query = `
      SELECT a.*, c.name as course, c.code as courseCode
      FROM assignments a
      JOIN classes c ON a.class_id = c.id
    `;

    let params = [];

    if (userRole === 'dosen') {
      query += ' WHERE a.lecturer_id = ?';
      params.push(userId);
    }

    const [assignments] = await pool.query(query, params);

    res.json({
      success: true,
      data: assignments
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

// ===================
//  GET ASSIGNMENT BY ID
// ===================
export const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [assignments] = await pool.query(
      `SELECT a.*, c.name as course, c.code as courseCode
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

    res.json({
      success: true,
      data: assignments[0]
    });
  } catch (error) {
    console.error('Get assignment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignment',
      error: error.message
    });
  }
};

// ===================
//  UPDATE ASSIGNMENT
// ===================
export const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, deadline } = req.body;
    const file = req.file ? req.file.filename : null;

    let updateQuery = `
      UPDATE assignments 
      SET title = ?, description = ?, deadline = ?
    `;
    let params = [title, description, deadline];

    if (file) {
      updateQuery += ', file = ?';
      params.push(file);
    }

    updateQuery += ' WHERE id = ?';
    params.push(id);

    await pool.query(updateQuery, params);

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

// ===================
//  DELETE ASSIGNMENT
// ===================
export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`DELETE FROM assignments WHERE id = ?`, [id]);

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

// ===================
//  SUBMIT ASSIGNMENT (Student)
// ===================
export const submitAssignment = async (req, res) => {
  try {
    const { assignment_id } = req.body;
    const file = req.file ? req.file.filename : null;
    const user_id = req.user.id;

    const [existing] = await pool.query(
      `SELECT * FROM assignment_submissions WHERE assignment_id = ? AND user_id = ?`,
      [assignment_id, user_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this assignment'
      });
    }

    await pool.query(
      `INSERT INTO assignment_submissions (assignment_id, user_id, file, submitted_at)
       VALUES (?, ?, ?, NOW())`,
      [assignment_id, user_id, file]
    );

    res.json({
      success: true,
      message: 'Assignment submitted successfully'
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting assignment',
      error: error.message
    });
  }
};

// ===================
//  NEW: GET ASSIGNMENTS BY CLASS
// ===================
export const getAssignmentsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT a.*, c.name as course, c.code as courseCode
      FROM assignments a
      JOIN classes c ON a.class_id = c.id
      WHERE a.class_id = ?
    `;
    let params = [classId];

    // jika dosen, hanya ambil kelas miliknya
    if (userRole === 'dosen') {
      query += ' AND c.instructor_id = ?';
      params.push(userId);
    }

    const [assignments] = await pool.query(query, params);

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Get assignments by class error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignments by class',
      error: error.message
    });
  }
};

// ===================
//  NEW: GET MY SUBMISSION (Student)
// ===================
export const getMySubmission = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const userId = req.user.id;

    const [submission] = await pool.query(
      `SELECT * FROM assignment_submissions 
       WHERE assignment_id = ? AND user_id = ?`,
      [assignmentId, userId]
    );

    if (submission.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No submission found'
      });
    }

    res.json({
      success: true,
      data: submission[0]
    });
  } catch (error) {
    console.error('Get my submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submission',
      error: error.message
    });
  }
};

// ===================
//  GET ALL SUBMISSIONS (for lecturer/admin)
// ===================
export const getSubmissions = async (req, res) => {
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

// ===================
//  GRADE SUBMISSION (for lecturer/admin)
// ===================
export const gradeSubmission = async (req, res) => {
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