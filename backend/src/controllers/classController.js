// src/controllers/classController.js
const { pool } = require('../config/database');

// Get All Classes (dengan filter berdasarkan role)
exports.getAllClasses = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    let query = '';
    let params = [];

    if (role === 'admin') {
      // Admin bisa lihat semua kelas
      query = `
        SELECT c.*, u.full_name as instructor_name,
               (SELECT COUNT(*) FROM class_enrollments WHERE class_id = c.id) as student_count
        FROM classes c
        JOIN users u ON c.instructor_id = u.id
        ORDER BY c.created_at DESC
      `;
    } else if (role === 'dosen') {
      // Dosen hanya lihat kelas yang dia ajar
      query = `
        SELECT c.*, u.full_name as instructor_name,
               (SELECT COUNT(*) FROM class_enrollments WHERE class_id = c.id) as student_count
        FROM classes c
        JOIN users u ON c.instructor_id = u.id
        WHERE c.instructor_id = ?
        ORDER BY c.created_at DESC
      `;
      params = [userId];
    } else {
      // Mahasiswa hanya lihat kelas yang dia ikuti
      query = `
        SELECT c.*, u.full_name as instructor_name,
               ce.enrolled_at, ce.status as enrollment_status
        FROM classes c
        JOIN users u ON c.instructor_id = u.id
        JOIN class_enrollments ce ON c.id = ce.class_id
        WHERE ce.student_id = ?
        ORDER BY c.created_at DESC
      `;
      params = [userId];
    }

    const [classes] = await pool.query(query, params);

    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Get Class Detail
exports.getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

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

    // Cek akses: admin bisa akses semua, dosen hanya kelasnya, mahasiswa hanya yang diikuti
    if (role === 'mahasiswa') {
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
    } else if (role === 'dosen' && classData.instructor_id !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not the instructor of this class' 
      });
    }

    // Get student count
    const [studentCount] = await pool.query(
      'SELECT COUNT(*) as count FROM class_enrollments WHERE class_id = ?',
      [id]
    );
    classData.student_count = studentCount[0].count;

    res.json({
      success: true,
      data: classData
    });
  } catch (error) {
    console.error('Get class detail error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Create New Class (Admin & Dosen)
exports.createClass = async (req, res) => {
  try {
    const { code, name, description, instructor_id, semester, year } = req.body;
    const { role, id: userId } = req.user;

    // Validasi
    if (!code || !name || !semester || !year) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }

    // Jika dosen yang membuat, otomatis dia jadi instructor
    const finalInstructorId = role === 'dosen' ? userId : instructor_id;

    // Cek apakah kode kelas sudah ada
    const [existing] = await pool.query(
      'SELECT id FROM classes WHERE code = ?',
      [code]
    );

    if (existing.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Class code already exists' 
      });
    }

    const [result] = await pool.query(
      `INSERT INTO classes (code, name, description, instructor_id, semester, year) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [code, name, description, finalInstructorId, semester, year]
    );

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: {
        id: result.insertId,
        code,
        name
      }
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Update Class
exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, description, semester, year, is_active } = req.body;
    const { role, id: userId } = req.user;

    // Cek apakah kelas ada
    const [classes] = await pool.query('SELECT * FROM classes WHERE id = ?', [id]);
    
    if (classes.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Class not found' 
      });
    }

    // Cek akses: dosen hanya bisa update kelasnya sendiri
    if (role === 'dosen' && classes[0].instructor_id !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only update your own classes' 
      });
    }

    await pool.query(
      `UPDATE classes 
       SET code = COALESCE(?, code), 
           name = COALESCE(?, name), 
           description = COALESCE(?, description),
           semester = COALESCE(?, semester),
           year = COALESCE(?, year),
           is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [code, name, description, semester, year, is_active, id]
    );

    res.json({
      success: true,
      message: 'Class updated successfully'
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Delete Class (Admin only)
exports.deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    const [classes] = await pool.query('SELECT id FROM classes WHERE id = ?', [id]);
    
    if (classes.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Class not found' 
      });
    }

    await pool.query('DELETE FROM classes WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Enroll Student to Class
exports.enrollStudent = async (req, res) => {
  try {
    const { classId } = req.params;
    const { student_id } = req.body;
    const { role, id: userId } = req.user;

    // Mahasiswa hanya bisa enroll dirinya sendiri
    const finalStudentId = role === 'mahasiswa' ? userId : student_id;

    // Cek apakah sudah terdaftar
    const [existing] = await pool.query(
      'SELECT id FROM class_enrollments WHERE class_id = ? AND student_id = ?',
      [classId, finalStudentId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Student already enrolled in this class' 
      });
    }

    await pool.query(
      'INSERT INTO class_enrollments (class_id, student_id) VALUES (?, ?)',
      [classId, finalStudentId]
    );

    res.status(201).json({
      success: true,
      message: 'Student enrolled successfully'
    });
  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Get Students in Class
exports.getClassStudents = async (req, res) => {
  try {
    const { id } = req.params;

    const [students] = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.email, 
              ce.enrolled_at, ce.status
       FROM users u
       JOIN class_enrollments ce ON u.id = ce.student_id
       WHERE ce.class_id = ?
       ORDER BY u.full_name`,
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
      message: 'Server error' 
    });
  }
};