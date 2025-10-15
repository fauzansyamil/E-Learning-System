// src/controllers/dashboardController.js - Complete Version
const { pool } = require('../config/database');

// Get Dashboard Statistics (Role-based)
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let stats = {};

    if (userRole === 'admin') {
      // Admin Dashboard Stats
      const [adminStats] = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM users WHERE role_id = 2) as total_dosen,
          (SELECT COUNT(*) FROM users WHERE role_id = 3) as total_mahasiswa,
          (SELECT COUNT(*) FROM classes) as total_classes,
          (SELECT COUNT(*) FROM assignments) as total_assignments,
          (SELECT COUNT(*) FROM materials) as total_materials,
          (SELECT COUNT(*) FROM discussions) as total_discussions
      `);
      stats = adminStats[0];

    } else if (userRole === 'dosen') {
      // Dosen Dashboard Stats
      const [dosenStats] = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM classes WHERE instructor_id = ?) as total_classes,
          (SELECT COUNT(DISTINCT ce.student_id) 
           FROM class_enrollments ce 
           JOIN classes c ON ce.class_id = c.id 
           WHERE c.instructor_id = ?) as total_students,
          (SELECT COUNT(*) FROM assignments a 
           JOIN classes c ON a.class_id = c.id 
           WHERE c.instructor_id = ?) as total_assignments,
          (SELECT COUNT(*) FROM assignment_submissions asub 
           JOIN assignments a ON asub.assignment_id = a.id 
           JOIN classes c ON a.class_id = c.id 
           WHERE c.instructor_id = ? AND asub.status = 'submitted') as pending_submissions,
          (SELECT COUNT(*) FROM materials m 
           JOIN classes c ON m.class_id = c.id 
           WHERE c.instructor_id = ?) as total_materials
      `, [userId, userId, userId, userId, userId]);
      stats = dosenStats[0];

    } else if (userRole === 'mahasiswa') {
      // Mahasiswa Dashboard Stats
      const [mahasiswaStats] = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM class_enrollments WHERE student_id = ?) as total_classes,
          (SELECT COUNT(DISTINCT a.id) 
           FROM assignments a 
           JOIN classes c ON a.class_id = c.id 
           JOIN class_enrollments ce ON c.id = ce.class_id 
           WHERE ce.student_id = ?) as total_assignments,
          (SELECT COUNT(*) FROM assignment_submissions WHERE user_id = ?) as submitted_assignments,
          (SELECT ROUND(AVG(score), 2) 
           FROM assignment_submissions 
           WHERE user_id = ? AND score IS NOT NULL) as average_score,
          (SELECT COUNT(*) FROM assignments a 
           JOIN classes c ON a.class_id = c.id 
           JOIN class_enrollments ce ON c.id = ce.class_id 
           WHERE ce.student_id = ? 
           AND a.deadline >= NOW() 
           AND a.id NOT IN (SELECT assignment_id FROM assignment_submissions WHERE user_id = ?)) as pending_assignments
      `, [userId, userId, userId, userId, userId, userId]);
      stats = mahasiswaStats[0];
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get Recent Activities
exports.getRecentActivities = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { limit = 10 } = req.query;

    let activities = [];

    if (userRole === 'admin') {
      // Admin sees all activities
      const [allActivities] = await pool.query(`
        SELECT 'user' as type, u.full_name as user_name, 'registered' as action, u.created_at as date
        FROM users u
        ORDER BY u.created_at DESC
        LIMIT ?
      `, [parseInt(limit)]);
      activities = allActivities;

    } else if (userRole === 'dosen') {
      // Dosen sees activities in their classes
      const [dosenActivities] = await pool.query(`
        (SELECT 'submission' as type, u.full_name as user_name, 
                CONCAT('submitted assignment: ', a.title) as action, 
                asub.submitted_at as date
         FROM assignment_submissions asub
         JOIN users u ON asub.user_id = u.id
         JOIN assignments a ON asub.assignment_id = a.id
         JOIN classes c ON a.class_id = c.id
         WHERE c.instructor_id = ?
         ORDER BY asub.submitted_at DESC
         LIMIT ?)
        UNION ALL
        (SELECT 'discussion' as type, u.full_name as user_name,
                CONCAT('posted in discussion: ', d.title) as action,
                d.created_at as date
         FROM discussions d
         JOIN users u ON d.user_id = u.id
         JOIN classes c ON d.class_id = c.id
         WHERE c.instructor_id = ?
         ORDER BY d.created_at DESC
         LIMIT ?)
        ORDER BY date DESC
        LIMIT ?
      `, [userId, parseInt(limit / 2), userId, parseInt(limit / 2), parseInt(limit)]);
      activities = dosenActivities;

    } else if (userRole === 'mahasiswa') {
      // Mahasiswa sees their own activities
      const [studentActivities] = await pool.query(`
        (SELECT 'submission' as type, 
                CONCAT('You submitted: ', a.title) as action,
                asub.submitted_at as date
         FROM assignment_submissions asub
         JOIN assignments a ON asub.assignment_id = a.id
         WHERE asub.user_id = ?
         ORDER BY asub.submitted_at DESC
         LIMIT ?)
        UNION ALL
        (SELECT 'grade' as type,
                CONCAT('You received grade for: ', a.title) as action,
                asub.graded_at as date
         FROM assignment_submissions asub
         JOIN assignments a ON asub.assignment_id = a.id
         WHERE asub.user_id = ? AND asub.graded_at IS NOT NULL
         ORDER BY asub.graded_at DESC
         LIMIT ?)
        UNION ALL
        (SELECT 'enrollment' as type,
                CONCAT('You enrolled in: ', c.name) as action,
                ce.enrolled_at as date
         FROM class_enrollments ce
         JOIN classes c ON ce.class_id = c.id
         WHERE ce.student_id = ?
         ORDER BY ce.enrolled_at DESC
         LIMIT ?)
        ORDER BY date DESC
        LIMIT ?
      `, [userId, parseInt(limit / 3), userId, parseInt(limit / 3), userId, parseInt(limit / 3), parseInt(limit)]);
      activities = studentActivities;
    }

    res.json({
      success: true,
      data: activities
    });

  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get Upcoming Events
exports.getUpcomingEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { limit = 10 } = req.query;

    let events = [];

    if (userRole === 'mahasiswa') {
      // Get upcoming assignments for student
      const [upcomingAssignments] = await pool.query(`
        SELECT a.id, a.title, a.description, a.deadline, c.name as class_name,
               CASE 
                 WHEN asub.id IS NOT NULL THEN 'submitted'
                 ELSE 'pending'
               END as status
        FROM assignments a
        JOIN classes c ON a.class_id = c.id
        JOIN class_enrollments ce ON c.id = ce.class_id
        LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.user_id = ?
        WHERE ce.student_id = ?
          AND a.deadline >= NOW()
        ORDER BY a.deadline ASC
        LIMIT ?
      `, [userId, userId, parseInt(limit)]);
      events = upcomingAssignments;

    } else if (userRole === 'dosen') {
      // Get upcoming deadlines for dosen's assignments
      const [upcomingDeadlines] = await pool.query(`
        SELECT a.id, a.title, a.description, a.deadline, c.name as class_name,
               (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = a.id) as submission_count,
               (SELECT COUNT(*) FROM class_enrollments WHERE class_id = c.id) as total_students
        FROM assignments a
        JOIN classes c ON a.class_id = c.id
        WHERE c.instructor_id = ?
          AND a.deadline >= NOW()
        ORDER BY a.deadline ASC
        LIMIT ?
      `, [userId, parseInt(limit)]);
      events = upcomingDeadlines;
    }

    res.json({
      success: true,
      data: events
    });

  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = exports;