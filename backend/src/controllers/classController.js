// src/controllers/classController.js
const { pool } = require('../config/database');

// ==================== CREATE ====================

// Create New Class (Admin/Dosen only)
exports.createClass = async (req, res) => {
  try {
    const { code, name, description, semester, credits, schedule, room, instructor_id } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validasi input
    if (!code || !name || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Code, name, and semester are required'
      });
    }

    // Tentukan instructor_id
    let finalInstructorId = instructor_id;
    if (userRole === 'dosen') {
      finalInstructorId = userId; // Dosen otomatis jadi instructor
    }

    // Cek apakah code sudah ada
    const [existingClass] = await pool.query(
      'SELECT id FROM classes WHERE code = ?',
      [code]
    );

    if (existingClass.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Class code already exists'
      });
    }

    // Insert class
    const [result] = await pool.query(
      `INSERT INTO classes 
       (code, name, description, semester, credits, schedule, room, instructor_id, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
      [code, name, description, semester, credits, schedule, room, finalInstructorId]
    );

    // Get created class
    const [newClass] = await pool.query(
      `SELECT c.*, u.full_name as instructor_name
       FROM classes c
       JOIN users u ON c.instructor_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: newClass[0]
    });

  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== READ ====================

// Get All Classes (filtered by role)
exports.getAllClasses = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = '';
    let params = [];

    if (userRole === 'admin') {
      // Admin bisa lihat semua kelas
      query = `
        SELECT c.*, u.full_name as instructor_name,
               (SELECT COUNT(*) FROM class_enrollments WHERE class_id = c.id) as student_count
        FROM classes c
        JOIN users u ON c.instructor_id = u.id
        WHERE c.status = 'active'
        ORDER BY c.created_at DESC
      `;
    } else if (userRole === 'dosen') {
      // Dosen hanya lihat kelas yang dia ajar
      query = `
        SELECT c.*, u.full_name as instructor_name,
               (SELECT COUNT(*) FROM class_enrollments WHERE class_id = c.id) as student_count
        FROM classes c
        JOIN users u ON c.instructor_id = u.id
        WHERE c.instructor_id = ? AND c.status = 'active'
        ORDER BY c.created_at DESC
      `;
      params = [userId];
    } else if (userRole === 'mahasiswa') {
      // Mahasiswa hanya lihat kelas yang dia ikuti
      query = `
        SELECT c.*, u.full_name as instructor_name,
               (SELECT COUNT(*) FROM class_enrollments WHERE class_id = c.id) as student_count,
               ce.enrolled_at
        FROM class_enrollments ce
        JOIN classes c ON ce.class_id = c.id
        JOIN users u ON c.instructor_id = u.id
        WHERE ce.student_id = ? AND c.status = 'active'
        ORDER BY ce.enrolled_at DESC
      `;
      params = [userId];
    }

    const [classes] = await pool.query(query, params);

    res.json({
      success: true,
      data: classes
    });

  } catch (error) {
    console.error('Get all classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get Class by ID
exports.getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get class info
    const [classes] = await pool.query(
      `SELECT c.*, u.full_name as instructor_name, u.email as instructor_email
       FROM classes c
       JOIN users u ON c.instructor_id = u.id
       WHERE c.id = ?`,
      [id]
    );

    if (classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    const classData = classes[0];

    // Cek akses user
    if (userRole === 'mahasiswa') {
      const [enrollment] = await pool.query(
        'SELECT id FROM class_enrollments WHERE class_id = ? AND student_id = ?',
        [id, userId]
      );

      if (enrollment.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You are not enrolled in this class'
        });
      }
    } else if (userRole === 'dosen' && classData.instructor_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get student count
    const [studentCount] = await pool.query(
      'SELECT COUNT(*) as count FROM class_enrollments WHERE class_id = ?',
      [id]
    );
    classData.student_count = studentCount[0].count;

    // Get assignments count
    const [assignmentCount] = await pool.query(
      'SELECT COUNT(*) as count FROM assignments WHERE class_id = ?',
      [id]
    );
    classData.assignment_count = assignmentCount[0].count;

    // Get materials count
    const [materialCount] = await pool.query(
      'SELECT COUNT(*) as count FROM materials WHERE class_id = ?',
      [id]
    );
    classData.material_count = materialCount[0].count;

    res.json({
      success: true,
      data: classData
    });

  } catch (error) {
    console.error('Get class by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get Class Students
exports.getClassStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Cek authorization
    if (userRole === 'dosen') {
      const [classCheck] = await pool.query(
        'SELECT id FROM classes WHERE id = ? AND instructor_id = ?',
        [id, userId]
      );

      if (classCheck.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Get students
    const [students] = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.email, u.student_id, 
              ce.enrolled_at, ce.attendance_percentage
       FROM class_enrollments ce
       JOIN users u ON ce.student_id = u.id
       WHERE ce.class_id = ?
       ORDER BY u.full_name ASC`,
      [id]
    );

    res.json({
      success: true,
      data: students
    });

  } catch (error) {
    console.error('Get class students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== UPDATE ====================

// Update Class
exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, description, semester, credits, schedule, room, status } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get class info
    const [classes] = await pool.query('SELECT * FROM classes WHERE id = ?', [id]);

    if (classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    const classData = classes[0];

    // Cek authorization
    if (userRole !== 'admin' && classData.instructor_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this class'
      });
    }

    // Update class
    await pool.query(
      `UPDATE classes 
       SET code = ?, name = ?, description = ?, semester = ?, 
           credits = ?, schedule = ?, room = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [code, name, description, semester, credits, schedule, room, status, id]
    );

    // Get updated class
    const [updatedClass] = await pool.query(
      `SELECT c.*, u.full_name as instructor_name
       FROM classes c
       JOIN users u ON c.instructor_id = u.id
       WHERE c.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Class updated successfully',
      data: updatedClass[0]
    });

  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== DELETE ====================

// Delete Class (Admin only)
exports.deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah class exists
    const [classes] = await pool.query('SELECT id FROM classes WHERE id = ?', [id]);

    if (classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Soft delete - set status to inactive
    await pool.query(
      'UPDATE classes SET status = ?, updated_at = NOW() WHERE id = ?',
      ['inactive', id]
    );

    res.json({
      success: true,
      message: 'Class deleted successfully'
    });

  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== ENROLLMENT ====================

// Enroll Student to Class
exports.enrollStudent = async (req, res) => {
  try {
    const { classId } = req.params;
    const { student_id } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Tentukan student_id
    let finalStudentId = student_id;
    if (userRole === 'mahasiswa') {
      finalStudentId = userId; // Mahasiswa enroll diri sendiri
    }

    // Cek apakah class exists
    const [classes] = await pool.query('SELECT id FROM classes WHERE id = ? AND status = ?', [classId, 'active']);

    if (classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found or inactive'
      });
    }

    // Cek apakah sudah enrolled
    const [existingEnrollment] = await pool.query(
      'SELECT id FROM class_enrollments WHERE class_id = ? AND student_id = ?',
      [classId, finalStudentId]
    );

    if (existingEnrollment.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Student already enrolled in this class'
      });
    }

    // Enroll student
    await pool.query(
      'INSERT INTO class_enrollments (class_id, student_id, enrolled_at) VALUES (?, ?, NOW())',
      [classId, finalStudentId]
    );

    res.status(201).json({
      success: true,
      message: 'Enrolled successfully'
    });

  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Unenroll Student from Class
exports.unenrollStudent = async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Cek authorization
    if (userRole === 'dosen') {
      const [classCheck] = await pool.query(
        'SELECT id FROM classes WHERE id = ? AND instructor_id = ?',
        [classId, userId]
      );

      if (classCheck.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Delete enrollment
    const [result] = await pool.query(
      'DELETE FROM class_enrollments WHERE class_id = ? AND student_id = ?',
      [classId, studentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    res.json({
      success: true,
      message: 'Student unenrolled successfully'
    });

  } catch (error) {
    console.error('Unenroll student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = exports;