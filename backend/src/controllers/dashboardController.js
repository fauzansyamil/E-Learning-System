// src/controllers/dashboardController.js
const { pool } = require('../config/database');

// Get Dashboard Statistics (role-based)
exports.getStats = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    let stats = {};

    if (role === 'admin') {
      // Admin stats
      const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
      const [dosen] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role_id = 2');
      const [mahasiswa] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role_id = 3');
      const [classes] = await pool.query('SELECT COUNT(*) as count FROM classes');
      const [assignments] = await pool.query('SELECT COUNT(*) as count FROM assignments');

      stats = {
        total_users: users[0].count,
        total_dosen: dosen[0].count,
        total_mahasiswa: mahasiswa[0].count,
        total_classes: classes[0].count,
        total_assignments: assignments[0].count
      };

    } else if (role === 'dosen') {
      // Dosen stats
      const [myClasses] = await pool.query(
        'SELECT COUNT(*) as count FROM classes WHERE instructor_id = ?',
        [userId]
      );

      const [totalStudents] = await pool.query(
        `SELECT COUNT(DISTINCT ce.student_id) as count 
         FROM class_enrollments ce
         JOIN classes c ON ce.class_id = c.id
         WHERE c.instructor_id = ?`,
        [userId]
      );

      const [pendingSubmissions] = await pool.query(
        `SELECT COUNT(*) as count 
         FROM submissions s
         JOIN assignments a ON s.assignment_id = a.id
         WHERE a.created_by = ? AND s.status != 'graded'`,
        [userId]
      );

      const [totalMaterials] = await pool.query(
        'SELECT COUNT(*) as count FROM materials WHERE created_by = ?',
        [userId]
      );

      stats = {
        my_classes: myClasses[0].count,
        total_students: totalStudents[0].count,
        pending_submissions: pendingSubmissions[0].count,
        total_materials: totalMaterials[0].count
      };

    } else {
      // Mahasiswa stats
      const [enrolledClasses] = await pool.query(
        'SELECT COUNT(*) as count FROM class_enrollments WHERE student_id = ?',
        [userId]
      );

      const [pendingAssignments] = await pool.query(
        `SELECT COUNT(*) as count 
         FROM assignments a
         JOIN class_enrollments ce ON a.class_id = ce.class_id
         WHERE ce.student_id = ?
         AND NOT EXISTS (
           SELECT 1 FROM submissions s 
           WHERE s.assignment_id = a.id AND s.student_id = ?
         )
         AND a.deadline > NOW()`,
        [userId, userId]
      );

      const [totalSubmissions] = await pool.query(
        'SELECT COUNT(*) as count FROM submissions WHERE student_id = ?',
        [userId]
      );

      const [avgGrade] = await pool.query(
        `SELECT AVG(g.score) as avg_score
         FROM grades g
         JOIN submissions s ON g.submission_id = s.id
         WHERE s.student_id = ?`,
        [userId]
      );

      stats = {
        enrolled_classes: enrolledClasses[0].count,
        pending_assignments: pendingAssignments[0].count,
        total_submissions: totalSubmissions[0].count,
        average_grade: avgGrade[0].avg_score ? parseFloat(avgGrade[0].avg_score).toFixed(1) : 0
      };
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Get Recent Activities
exports.getRecentActivities = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    let activities = [];

    if (role === 'admin') {
      // Recent system activities
      const [recentUsers] = await pool.query(
        `SELECT 'user_registered' as type, full_name as title, created_at 
         FROM users 
         ORDER BY created_at DESC 
         LIMIT 10`
      );

      const [recentClasses] = await pool.query(
        `SELECT 'class_created' as type, name as title, created_at 
         FROM classes 
         ORDER BY created_at DESC 
         LIMIT 10`
      );

      activities = [...recentUsers, ...recentClasses]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10);

    } else if (role === 'dosen') {
      // Recent submissions to my assignments
      const [recentSubmissions] = await pool.query(
        `SELECT 'submission' as type, 
                CONCAT(u.full_name, ' - ', a.title) as title,
                s.submitted_at as created_at
         FROM submissions s
         JOIN assignments a ON s.assignment_id = a.id
         JOIN users u ON s.student_id = u.id
         WHERE a.created_by = ?
         ORDER BY s.submitted_at DESC
         LIMIT 10`,
        [userId]
      );

      activities = recentSubmissions;

    } else {
      // Recent assignments and grades
      const [recentAssignments] = await pool.query(
        `SELECT 'assignment' as type, 
                a.title,
                a.created_at
         FROM assignments a
         JOIN class_enrollments ce ON a.class_id = ce.class_id
         WHERE ce.student_id = ?
         ORDER BY a.created_at DESC
         LIMIT 5`,
        [userId]
      );

      const [recentGrades] = await pool.query(
        `SELECT 'grade' as type,
                CONCAT(a.title, ' - Score: ', g.score) as title,
                g.graded_at as created_at
         FROM grades g
         JOIN submissions s ON g.submission_id = s.id
         JOIN assignments a ON s.assignment_id = a.id
         WHERE s.student_id = ?
         ORDER BY g.graded_at DESC
         LIMIT 5`,
        [userId]
      );

      activities = [...recentAssignments, ...recentGrades]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10);
    }

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};