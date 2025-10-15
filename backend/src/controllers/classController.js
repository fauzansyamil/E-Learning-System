// backend/src/controllers/classController.js - FULL COMPLETE VERSION
const { pool } = require('../config/database');

// ========================================
// READ OPERATIONS
// ========================================

// Get all classes for current user - Enhanced with progress
exports.getAllClasses = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query, params;

    if (userRole === 'mahasiswa') {
      // Get enrolled classes with progress
      query = `
        SELECT c.*, 
               u.full_name as instructor,
               ce.enrollment_date,
               ce.attendance_percentage as attendance,
               COUNT(DISTINCT m.id) as total_materials,
               COUNT(DISTINCT mr.id) as completed_materials,
               COUNT(DISTINCT a.id) as total_assignments,
               COUNT(DISTINCT asub.id) as completed_assignments,
               ROUND(
                 ((COUNT(DISTINCT mr.id) / NULLIF(COUNT(DISTINCT m.id), 0)) * 50) +
                 ((COUNT(DISTINCT asub.id) / NULLIF(COUNT(DISTINCT a.id), 0)) * 50),
                 0
               ) as progress,
               (SELECT COUNT(*) FROM class_enrollments WHERE class_id = c.id) as enrolled,
               c.capacity
        FROM classes c
        JOIN class_enrollments ce ON c.id = ce.class_id
        JOIN users u ON c.instructor_id = u.id
        LEFT JOIN materials m ON c.id = m.class_id
        LEFT JOIN material_reads mr ON m.id = mr.material_id AND mr.user_id = ?
        LEFT JOIN assignments a ON c.id = a.class_id
        LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.user_id = ?
        WHERE ce.user_id = ?
        GROUP BY c.id
        ORDER BY c.name ASC
      `;
      params = [userId, userId, userId];
    } else if (userRole === 'dosen') {
      // Get classes taught by lecturer
      query = `
        SELECT c.*, 
               u.full_name as instructor,
               (SELECT COUNT(*) FROM class_enrollments WHERE class_id = c.id) as enrolled,
               c.capacity,
               COUNT(DISTINCT m.id) as total_materials,
               COUNT(DISTINCT a.id) as total_assignments
        FROM classes c
        JOIN users u ON c.instructor_id = u.id
        LEFT JOIN materials m ON c.id = m.class_id
        LEFT JOIN assignments a ON c.id = a.class_id
        WHERE c.instructor_id = ?
        GROUP BY c.id
        ORDER BY c.name ASC
      `;
      params = [userId];
    } else {
      // Admin: all classes
      query = `
        SELECT c.*, 
               u.full_name as instructor,
               (SELECT COUNT(*) FROM class_enrollments WHERE class_id = c.id) as enrolled,
               c.capacity
        FROM classes c
        JOIN users u ON c.instructor_id = u.id
        ORDER BY c.name ASC
      `;
      params = [];
    }

    const [classes] = await pool.query(query, params);

    res.json({
      success: true,
      data: classes.map(c => ({
        id: c.id,
        code: c.code,
        name: c.name,
        description: c.description,
        instructor: c.instructor,
        instructorId: c.instructor_id,
        semester: c.semester,
        credits: c.credits,
        schedule: c.schedule,
        room: c.room,
        enrolled: c.enrolled || 0,
        capacity: c.capacity,
        progress: c.progress || 0,
        color: getRandomGradient()
      }))
    });

  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching classes',
      error: error.message
    });
  }
};

// Get class detail by ID - Enhanced with all content
exports.getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get class basic info
    const [classes] = await pool.query(
      `SELECT c.*, u.full_name as instructor,
              (SELECT COUNT(*) FROM class_enrollments WHERE class_id = c.id) as enrolled
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

    // Get weekly content with materials
    const [materials] = await pool.query(
      `SELECT m.*, 
              mr.read_at IS NOT NULL as downloaded,
              mr.read_at IS NOT NULL as watched
       FROM materials m
       LEFT JOIN material_reads mr ON m.id = mr.material_id AND mr.user_id = ?
       WHERE m.class_id = ?
       ORDER BY m.week, m.order_index`,
      [userId, id]
    );

    // Get assignments per week
    const [assignments] = await pool.query(
      `SELECT a.*, 
              asub.submitted_at IS NOT NULL as submitted,
              asub.score,
              asub.submitted_at as submittedDate
       FROM assignments a
       LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.user_id = ?
       WHERE a.class_id = ?
       ORDER BY a.week, a.created_at`,
      [userId, id]
    );

    // Get announcements
    const [announcements] = await pool.query(
      `SELECT * FROM announcements
       WHERE class_id = ?
       ORDER BY is_important DESC, created_at DESC
       LIMIT 10`,
      [id]
    );

    // Get discussions
    const [discussions] = await pool.query(
      `SELECT d.*, u.full_name as author,
              (SELECT COUNT(*) FROM discussion_replies WHERE discussion_id = d.id) as replies
       FROM discussions d
       JOIN users u ON d.user_id = u.id
       WHERE d.class_id = ?
       ORDER BY d.created_at DESC
       LIMIT 10`,
      [id]
    );

    // Group materials and assignments by week
    const weeklyContent = [];
    const weeks = [...new Set(materials.map(m => m.week))];
    
    weeks.forEach(week => {
      const weekMaterials = materials.filter(m => m.week === week);
      const weekAssignments = assignments.filter(a => a.week === week);
      
      if (weekMaterials.length > 0 || weekAssignments.length > 0) {
        weeklyContent.push({
          week,
          title: weekMaterials[0]?.week_title || `Minggu ${week}`,
          materials: weekMaterials.map(m => ({
            type: m.type,
            name: m.title,
            size: m.file_size,
            duration: m.duration,
            downloaded: m.downloaded,
            watched: m.watched,
            url: m.file_url
          })),
          assignments: weekAssignments.map(a => ({
            name: a.title,
            deadline: a.deadline,
            submitted: a.submitted,
            score: a.score,
            submittedDate: a.submittedDate
          }))
        });
      }
    });

    res.json({
      success: true,
      data: {
        ...classData,
        weeklyContent,
        announcements: announcements.map(a => ({
          id: a.id,
          title: a.title,
          date: a.created_at,
          content: a.content,
          important: a.is_important
        })),
        discussions: discussions.map(d => ({
          id: d.id,
          author: d.author,
          avatar: '👨‍💻',
          topic: d.title,
          message: d.content,
          replies: d.replies,
          date: formatTimeAgo(d.created_at),
          solved: d.is_solved
        }))
      }
    });

  } catch (error) {
    console.error('Get class detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching class detail',
      error: error.message
    });
  }
};

// ========================================
// CREATE OPERATIONS
// ========================================

// Create new class (Admin/Lecturer only)
exports.createClass = async (req, res) => {
  try {
    const { code, name, description, semester, credits, schedule, room, capacity, instructorId } = req.body;
    const userRole = req.user.role;

    // Validate required fields
    if (!code || !name || !semester || !credits || !instructorId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if code already exists
    const [existing] = await pool.query(
      'SELECT id FROM classes WHERE code = ?',
      [code]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Class code already exists'
      });
    }

    // If user is lecturer, use their own ID as instructor
    const finalInstructorId = userRole === 'dosen' ? req.user.id : instructorId;

    // Insert new class
    const [result] = await pool.query(
      `INSERT INTO classes 
       (code, name, description, semester, credits, schedule, room, capacity, instructor_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [code, name, description, semester, credits, schedule, room, capacity || 50, finalInstructorId]
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
      message: 'Error creating class',
      error: error.message
    });
  }
};

// ========================================
// UPDATE OPERATIONS
// ========================================

// Update class information
exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, description, semester, credits, schedule, room, capacity } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if class exists and user has permission
    const [classes] = await pool.query(
      'SELECT * FROM classes WHERE id = ?',
      [id]
    );

    if (classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check permission
    if (userRole === 'dosen' && classes[0].instructor_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this class'
      });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (code !== undefined) { updates.push('code = ?'); params.push(code); }
    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (semester !== undefined) { updates.push('semester = ?'); params.push(semester); }
    if (credits !== undefined) { updates.push('credits = ?'); params.push(credits); }
    if (schedule !== undefined) { updates.push('schedule = ?'); params.push(schedule); }
    if (room !== undefined) { updates.push('room = ?'); params.push(room); }
    if (capacity !== undefined) { updates.push('capacity = ?'); params.push(capacity); }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(id);
    
    await pool.query(
      `UPDATE classes SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'Class updated successfully'
    });

  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating class',
      error: error.message
    });
  }
};

// ========================================
// DELETE OPERATIONS
// ========================================

// Delete class (Admin only)
exports.deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if class exists
    const [classes] = await pool.query(
      'SELECT * FROM classes WHERE id = ?',
      [id]
    );

    if (classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check if class has enrollments
    const [enrollments] = await pool.query(
      'SELECT COUNT(*) as count FROM class_enrollments WHERE class_id = ?',
      [id]
    );

    if (enrollments[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete class with existing enrollments. Please remove all students first.'
      });
    }

    // Delete class (cascade will handle related records if configured)
    await pool.query('DELETE FROM classes WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Class deleted successfully'
    });

  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting class',
      error: error.message
    });
  }
};

// ========================================
// ENROLLMENT OPERATIONS
// ========================================

// Enroll student to class
exports.enrollStudent = async (req, res) => {
  try {
    const { classId, studentId } = req.body;
    const userRole = req.user.role;

    // Validate
    if (!classId) {
      return res.status(400).json({
        success: false,
        message: 'Class ID is required'
      });
    }

    // If student enrolling themselves, use their own ID
    const finalStudentId = userRole === 'mahasiswa' ? req.user.id : studentId;

    if (!finalStudentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    // Check if class exists and has capacity
    const [classes] = await pool.query(
      `SELECT c.*, 
              (SELECT COUNT(*) FROM class_enrollments WHERE class_id = c.id) as enrolled
       FROM classes c
       WHERE c.id = ?`,
      [classId]
    );

    if (classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    if (classes[0].enrolled >= classes[0].capacity) {
      return res.status(400).json({
        success: false,
        message: 'Class is full'
      });
    }

    // Check if already enrolled
    const [existing] = await pool.query(
      'SELECT id FROM class_enrollments WHERE class_id = ? AND user_id = ?',
      [classId, finalStudentId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in this class'
      });
    }

    // Enroll student
    await pool.query(
      `INSERT INTO class_enrollments 
       (class_id, user_id, enrollment_date, status)
       VALUES (?, ?, NOW(), 'active')`,
      [classId, finalStudentId]
    );

    res.json({
      success: true,
      message: 'Student enrolled successfully'
    });

  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling student',
      error: error.message
    });
  }
};

// Unenroll student from class
exports.unenrollStudent = async (req, res) => {
  try {
    const { classId, studentId } = req.body;
    const userRole = req.user.role;

    // If student unenrolling themselves
    const finalStudentId = userRole === 'mahasiswa' ? req.user.id : studentId;

    // Check if enrollment exists
    const [enrollment] = await pool.query(
      'SELECT * FROM class_enrollments WHERE class_id = ? AND user_id = ?',
      [classId, finalStudentId]
    );

    if (enrollment.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Delete enrollment
    await pool.query(
      'DELETE FROM class_enrollments WHERE class_id = ? AND user_id = ?',
      [classId, finalStudentId]
    );

    res.json({
      success: true,
      message: 'Student unenrolled successfully'
    });

  } catch (error) {
    console.error('Unenroll student error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unenrolling student',
      error: error.message
    });
  }
};

// Get enrolled students for a class
exports.getEnrolledStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check permission
    if (userRole === 'dosen') {
      const [classes] = await pool.query(
        'SELECT * FROM classes WHERE id = ? AND instructor_id = ?',
        [id, userId]
      );

      if (classes.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Get enrolled students
    const [students] = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.email,
              ce.enrollment_date, ce.status, ce.attendance_percentage
       FROM class_enrollments ce
       JOIN users u ON ce.user_id = u.id
       WHERE ce.class_id = ?
       ORDER BY u.full_name ASC`,
      [id]
    );

    res.json({
      success: true,
      data: students
    });

  } catch (error) {
    console.error('Get enrolled students error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrolled students',
      error: error.message
    });
  }
};

// ========================================
// HELPER FUNCTIONS
// ========================================

function getRandomGradient() {
  const gradients = [
    'from-blue-500 to-blue-700',
    'from-green-500 to-green-700',
    'from-purple-500 to-purple-700',
    'from-orange-500 to-orange-700',
    'from-red-500 to-red-700',
    'from-indigo-500 to-indigo-700'
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
}

function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  let interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " hari lalu";
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " jam lalu";
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " menit lalu";
  
  return "Baru saja";
}

module.exports = exports;