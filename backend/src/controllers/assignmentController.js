// src/controllers/assignmentController.js
const { pool } = require('../config/database');

// Get All Assignments (by class)
exports.getAssignmentsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { role, id: userId } = req.user;

    const [assignments] = await pool.query(
      `SELECT a.*, u.full_name as created_by_name,
              (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id) as submission_count
       FROM assignments a
       JOIN users u ON a.created_by = u.id
       WHERE a.class_id = ?
       ORDER BY a.deadline DESC`,
      [classId]
    );

    // Jika mahasiswa, tambahkan info submission status
    if (role === 'mahasiswa') {
      for (let assignment of assignments) {
        const [submission] = await pool.query(
          'SELECT id, status, submitted_at FROM submissions WHERE assignment_id = ? AND student_id = ?',
          [assignment.id, userId]
        );
        assignment.my_submission = submission[0] || null;
      }
    }

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Get Assignment Detail
exports.getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const [assignments] = await pool.query(
      `SELECT a.*, u.full_name as created_by_name, c.name as class_name
       FROM assignments a
       JOIN users u ON a.created_by = u.id
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

    const assignment = assignments[0];

    // Get submissions untuk dosen/admin
    if (role !== 'mahasiswa') {
      const [submissions] = await pool.query(
        `SELECT s.*, u.full_name as student_name, g.score, g.feedback
         FROM submissions s
         JOIN users u ON s.student_id = u.id
         LEFT JOIN grades g ON s.id = g.submission_id
         WHERE s.assignment_id = ?
         ORDER BY s.submitted_at DESC`,
        [id]
      );
      assignment.submissions = submissions;
    } else {
      // Get submission mahasiswa sendiri
      const [submission] = await pool.query(
        `SELECT s.*, g.score, g.feedback, g.graded_at
         FROM submissions s
         LEFT JOIN grades g ON s.id = g.submission_id
         WHERE s.assignment_id = ? AND s.student_id = ?`,
        [id, userId]
      );
      assignment.my_submission = submission[0] || null;
    }

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Get assignment detail error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Create Assignment (Dosen & Admin)
exports.createAssignment = async (req, res) => {
  try {
    const { class_id, title, description, deadline, max_score } = req.body;
    const { id: userId } = req.user;

    if (!class_id || !title || !deadline) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }

    const [result] = await pool.query(
      `INSERT INTO assignments (class_id, created_by, title, description, deadline, max_score) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [class_id, userId, title, description, deadline, max_score || 100]
    );

    // Create notifications untuk semua mahasiswa di kelas ini
    const [students] = await pool.query(
      'SELECT student_id FROM class_enrollments WHERE class_id = ?',
      [class_id]
    );

    for (let student of students) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, link) 
         VALUES (?, 'assignment', ?, ?, ?)`,
        [
          student.student_id,
          'Tugas Baru',
          `Tugas baru "${title}" telah ditambahkan`,
          `/assignments/${result.insertId}`
        ]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Submit Assignment (Mahasiswa)
exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { content, file_url } = req.body;
    const { id: userId } = req.user;

    // Cek apakah assignment ada dan deadline masih valid
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

    const assignment = assignments[0];
    const now = new Date();
    const deadline = new Date(assignment.deadline);
    const status = now > deadline ? 'late' : 'submitted';

    // Cek apakah sudah pernah submit
    const [existing] = await pool.query(
      'SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?',
      [assignmentId, userId]
    );

    if (existing.length > 0) {
      // Update submission yang sudah ada
      await pool.query(
        `UPDATE submissions 
         SET content = ?, file_url = ?, submitted_at = NOW(), status = ?
         WHERE id = ?`,
        [content, file_url, status, existing[0].id]
      );

      res.json({
        success: true,
        message: 'Assignment updated successfully'
      });
    } else {
      // Create new submission
      await pool.query(
        `INSERT INTO submissions (assignment_id, student_id, content, file_url, status) 
         VALUES (?, ?, ?, ?, ?)`,
        [assignmentId, userId, content, file_url, status]
      );

      res.status(201).json({
        success: true,
        message: 'Assignment submitted successfully'
      });
    }
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Grade Submission (Dosen & Admin)
exports.gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { score, feedback } = req.body;
    const { id: userId } = req.user;

    if (score === undefined || score === null) {
      return res.status(400).json({ 
        success: false, 
        message: 'Score is required' 
      });
    }

    // Get submission info
    const [submissions] = await pool.query(
      'SELECT * FROM submissions WHERE id = ?',
      [submissionId]
    );

    if (submissions.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Submission not found' 
      });
    }

    const submission = submissions[0];

    // Check if already graded
    const [existingGrade] = await pool.query(
      'SELECT id FROM grades WHERE submission_id = ?',
      [submissionId]
    );

    if (existingGrade.length > 0) {
      // Update existing grade
      await pool.query(
        'UPDATE grades SET score = ?, feedback = ?, graded_by = ?, graded_at = NOW() WHERE submission_id = ?',
        [score, feedback, userId, submissionId]
      );
    } else {
      // Insert new grade
      await pool.query(
        'INSERT INTO grades (submission_id, graded_by, score, feedback) VALUES (?, ?, ?, ?)',
        [submissionId, userId, score, feedback]
      );
    }

    // Update submission status
    await pool.query(
      'UPDATE submissions SET status = ? WHERE id = ?',
      ['graded', submissionId]
    );

    // Create notification untuk mahasiswa
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, link) 
       VALUES (?, 'grade', ?, ?, ?)`,
      [
        submission.student_id,
        'Nilai Tersedia',
        'Tugas Anda telah dinilai',
        `/submissions/${submissionId}`
      ]
    );

    res.json({
      success: true,
      message: 'Submission graded successfully'
    });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};