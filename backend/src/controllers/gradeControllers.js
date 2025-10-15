// src/controllers/gradeController.js
const { pool } = require('../config/database');

// ==================== GET GRADES ====================

// Get All Grades by Class (Dosen/Admin)
exports.getGradesByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Cek authorization
    if (userRole !== 'admin') {
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

    // Get all students in the class with their grades
    const [grades] = await pool.query(
      `SELECT 
        u.id as student_id,
        u.username,
        u.full_name,
        u.student_id as nim,
        COUNT(DISTINCT asub.id) as total_submissions,
        COUNT(DISTINCT CASE WHEN asub.status = 'graded' THEN asub.id END) as graded_submissions,
        ROUND(AVG(CASE WHEN asub.score IS NOT NULL THEN asub.score END), 2) as average_score,
        SUM(CASE WHEN asub.score IS NOT NULL THEN asub.score ELSE 0 END) as total_score,
        COUNT(DISTINCT a.id) as total_assignments
      FROM class_enrollments ce
      JOIN users u ON ce.student_id = u.id
      LEFT JOIN assignments a ON a.class_id = ce.class_id
      LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id AND asub.user_id = u.id
      WHERE ce.class_id = ?
      GROUP BY u.id, u.username, u.full_name, u.student_id
      ORDER BY u.full_name ASC`,
      [classId]
    );

    res.json({
      success: true,
      data: grades
    });

  } catch (error) {
    console.error('Get grades by class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get Student Grades (for specific student)
exports.getStudentGrades = async (req, res) => {
  try {
    const { studentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Mahasiswa hanya bisa lihat nilai sendiri
    if (userRole === 'mahasiswa' && parseInt(studentId) !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get all grades for the student
    const [grades] = await pool.query(
      `SELECT 
        c.id as class_id,
        c.code as class_code,
        c.name as class_name,
        a.id as assignment_id,
        a.title as assignment_title,
        a.max_score,
        asub.score,
        asub.feedback,
        asub.submitted_at,
        asub.graded_at,
        asub.status,
        u.full_name as graded_by
      FROM assignments a
      JOIN classes c ON a.class_id = c.id
      JOIN class_enrollments ce ON c.id = ce.class_id AND ce.student_id = ?
      LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.user_id = ?
      LEFT JOIN users u ON asub.graded_by = u.id
      ORDER BY c.name ASC, a.deadline DESC`,
      [studentId, studentId]
    );

    // Calculate statistics
    const stats = {
      total_assignments: grades.length,
      submitted: grades.filter(g => g.submitted_at !== null).length,
      graded: grades.filter(g => g.graded_at !== null).length,
      average_score: 0,
      highest_score: 0,
      lowest_score: 0
    };

    const scoredAssignments = grades.filter(g => g.score !== null);
    if (scoredAssignments.length > 0) {
      const scores = scoredAssignments.map(g => g.score);
      stats.average_score = parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
      stats.highest_score = Math.max(...scores);
      stats.lowest_score = Math.min(...scores);
    }

    res.json({
      success: true,
      data: {
        grades: grades,
        statistics: stats
      }
    });

  } catch (error) {
    console.error('Get student grades error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get My Grades (for current logged-in student)
exports.getMyGrades = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all grades for current student
    const [grades] = await pool.query(
      `SELECT 
        c.id as class_id,
        c.code as class_code,
        c.name as class_name,
        c.semester,
        a.id as assignment_id,
        a.title as assignment_title,
        a.description,
        a.max_score,
        a.deadline,
        asub.id as submission_id,
        asub.score,
        asub.feedback,
        asub.submitted_at,
        asub.graded_at,
        asub.status,
        CASE 
          WHEN asub.score IS NOT NULL AND a.max_score > 0 
          THEN ROUND((asub.score / a.max_score) * 100, 2)
          ELSE NULL
        END as percentage,
        u.full_name as graded_by
      FROM class_enrollments ce
      JOIN classes c ON ce.class_id = c.id
      JOIN assignments a ON a.class_id = c.id
      LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.user_id = ?
      LEFT JOIN users u ON asub.graded_by = u.id
      WHERE ce.student_id = ?
      ORDER BY c.name ASC, a.deadline DESC`,
      [userId, userId]
    );

    // Group by class
    const gradesByClass = {};
    grades.forEach(grade => {
      if (!gradesByClass[grade.class_id]) {
        gradesByClass[grade.class_id] = {
          class_id: grade.class_id,
          class_code: grade.class_code,
          class_name: grade.class_name,
          semester: grade.semester,
          assignments: [],
          statistics: {
            total_assignments: 0,
            submitted: 0,
            graded: 0,
            average_score: 0,
            average_percentage: 0
          }
        };
      }

      gradesByClass[grade.class_id].assignments.push({
        assignment_id: grade.assignment_id,
        title: grade.assignment_title,
        description: grade.description,
        max_score: grade.max_score,
        deadline: grade.deadline,
        submission_id: grade.submission_id,
        score: grade.score,
        percentage: grade.percentage,
        feedback: grade.feedback,
        submitted_at: grade.submitted_at,
        graded_at: grade.graded_at,
        status: grade.status,
        graded_by: grade.graded_by
      });
    });

    // Calculate statistics for each class
    Object.values(gradesByClass).forEach(classData => {
      const assignments = classData.assignments;
      classData.statistics.total_assignments = assignments.length;
      classData.statistics.submitted = assignments.filter(a => a.submitted_at !== null).length;
      classData.statistics.graded = assignments.filter(a => a.graded_at !== null).length;

      const gradedAssignments = assignments.filter(a => a.score !== null);
      if (gradedAssignments.length > 0) {
        const totalScore = gradedAssignments.reduce((sum, a) => sum + a.score, 0);
        const totalPercentage = gradedAssignments.reduce((sum, a) => sum + (a.percentage || 0), 0);
        classData.statistics.average_score = parseFloat((totalScore / gradedAssignments.length).toFixed(2));
        classData.statistics.average_percentage = parseFloat((totalPercentage / gradedAssignments.length).toFixed(2));
      }
    });

    res.json({
      success: true,
      data: Object.values(gradesByClass)
    });

  } catch (error) {
    console.error('Get my grades error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get Grade Detail by Assignment
exports.getGradeByAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get assignment info first
    const [assignments] = await pool.query(
      `SELECT a.*, c.instructor_id, c.name as class_name
       FROM assignments a
       JOIN classes c ON a.class_id = c.id
       WHERE a.id = ?`,
      [assignmentId]
    );

    if (assignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const assignment = assignments[0];

    // Check authorization
    if (userRole === 'dosen' && assignment.instructor_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get all submissions with grades for this assignment
    const [submissions] = await pool.query(
      `SELECT 
        asub.id as submission_id,
        asub.user_id,
        u.full_name as student_name,
        u.student_id as nim,
        asub.score,
        asub.feedback,
        asub.file_path,
        asub.submitted_at,
        asub.graded_at,
        asub.status,
        grader.full_name as graded_by,
        CASE 
          WHEN asub.score IS NOT NULL AND ? > 0 
          THEN ROUND((asub.score / ?) * 100, 2)
          ELSE NULL
        END as percentage
      FROM assignment_submissions asub
      JOIN users u ON asub.user_id = u.id
      LEFT JOIN users grader ON asub.graded_by = grader.id
      WHERE asub.assignment_id = ?
      ORDER BY u.full_name ASC`,
      [assignment.max_score, assignment.max_score, assignmentId]
    );

    // Calculate statistics
    const stats = {
      total_submissions: submissions.length,
      graded: submissions.filter(s => s.graded_at !== null).length,
      pending: submissions.filter(s => s.status === 'submitted').length,
      average_score: 0,
      highest_score: 0,
      lowest_score: 0,
      pass_rate: 0 // Assuming passing score is 60%
    };

    const gradedSubmissions = submissions.filter(s => s.score !== null);
    if (gradedSubmissions.length > 0) {
      const scores = gradedSubmissions.map(s => s.score);
      stats.average_score = parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
      stats.highest_score = Math.max(...scores);
      stats.lowest_score = Math.min(...scores);
      
      const passingScore = assignment.max_score * 0.6; // 60% passing
      const passedCount = scores.filter(s => s >= passingScore).length;
      stats.pass_rate = parseFloat(((passedCount / scores.length) * 100).toFixed(2));
    }

    res.json({
      success: true,
      data: {
        assignment: {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          max_score: assignment.max_score,
          deadline: assignment.deadline,
          class_name: assignment.class_name
        },
        submissions: submissions,
        statistics: stats
      }
    });

  } catch (error) {
    console.error('Get grade by assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== GRADE DISTRIBUTION ====================

// Get Grade Distribution (for charts/statistics)
exports.getGradeDistribution = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check authorization
    if (userRole !== 'admin') {
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

    // Get grade distribution
    const [distribution] = await pool.query(
      `SELECT 
        CASE
          WHEN (asub.score / a.max_score * 100) >= 90 THEN 'A'
          WHEN (asub.score / a.max_score * 100) >= 80 THEN 'B'
          WHEN (asub.score / a.max_score * 100) >= 70 THEN 'C'
          WHEN (asub.score / a.max_score * 100) >= 60 THEN 'D'
          ELSE 'E'
        END as grade_letter,
        COUNT(*) as count
      FROM assignment_submissions asub
      JOIN assignments a ON asub.assignment_id = a.id
      WHERE a.class_id = ? 
        AND asub.score IS NOT NULL
        AND a.max_score > 0
      GROUP BY grade_letter
      ORDER BY grade_letter ASC`,
      [classId]
    );

    res.json({
      success: true,
      data: distribution
    });

  } catch (error) {
    console.error('Get grade distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== EXPORT GRADES ====================

// Get Grades for Export (CSV format data)
exports.getGradesForExport = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check authorization
    if (userRole !== 'admin') {
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

    // Get all assignments for the class
    const [assignments] = await pool.query(
      'SELECT id, title, max_score FROM assignments WHERE class_id = ? ORDER BY deadline ASC',
      [classId]
    );

    // Get all students with their grades
    const [students] = await pool.query(
      `SELECT 
        u.id,
        u.student_id as nim,
        u.full_name,
        u.email
      FROM class_enrollments ce
      JOIN users u ON ce.student_id = u.id
      WHERE ce.class_id = ?
      ORDER BY u.full_name ASC`,
      [classId]
    );

    // Get all grades
    const grades = [];
    for (const student of students) {
      const studentGrades = {
        nim: student.nim,
        name: student.full_name,
        email: student.email,
        assignments: {}
      };

      for (const assignment of assignments) {
        const [submission] = await pool.query(
          'SELECT score FROM assignment_submissions WHERE assignment_id = ? AND user_id = ?',
          [assignment.id, student.id]
        );

        studentGrades.assignments[assignment.title] = submission.length > 0 && submission[0].score !== null 
          ? submission[0].score 
          : '-';
      }

      // Calculate total and average
      const scores = Object.values(studentGrades.assignments).filter(s => s !== '-');
      studentGrades.total = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) : 0;
      studentGrades.average = scores.length > 0 
        ? parseFloat((studentGrades.total / scores.length).toFixed(2)) 
        : 0;

      grades.push(studentGrades);
    }

    res.json({
      success: true,
      data: {
        assignments: assignments,
        grades: grades
      }
    });

  } catch (error) {
    console.error('Get grades for export error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== STATISTICS ====================

// Get Overall Statistics
exports.getOverallStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let stats = {};

    if (userRole === 'admin') {
      // Admin gets system-wide statistics
      const [systemStats] = await pool.query(`
        SELECT 
          COUNT(DISTINCT asub.id) as total_submissions,
          COUNT(DISTINCT CASE WHEN asub.status = 'graded' THEN asub.id END) as graded_submissions,
          ROUND(AVG(CASE WHEN asub.score IS NOT NULL THEN asub.score END), 2) as average_score,
          COUNT(DISTINCT a.id) as total_assignments,
          COUNT(DISTINCT c.id) as total_classes
        FROM assignment_submissions asub
        JOIN assignments a ON asub.assignment_id = a.id
        JOIN classes c ON a.class_id = c.id
      `);
      stats = systemStats[0];

    } else if (userRole === 'dosen') {
      // Dosen gets their classes statistics
      const [dosenStats] = await pool.query(`
        SELECT 
          COUNT(DISTINCT asub.id) as total_submissions,
          COUNT(DISTINCT CASE WHEN asub.status = 'graded' THEN asub.id END) as graded_submissions,
          COUNT(DISTINCT CASE WHEN asub.status = 'submitted' THEN asub.id END) as pending_grading,
          ROUND(AVG(CASE WHEN asub.score IS NOT NULL THEN asub.score END), 2) as average_score,
          COUNT(DISTINCT a.id) as total_assignments,
          COUNT(DISTINCT c.id) as total_classes
        FROM classes c
        LEFT JOIN assignments a ON a.class_id = c.id
        LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id
        WHERE c.instructor_id = ?
      `, [userId]);
      stats = dosenStats[0];

    } else if (userRole === 'mahasiswa') {
      // Mahasiswa gets their own statistics
      const [studentStats] = await pool.query(`
        SELECT 
          COUNT(DISTINCT a.id) as total_assignments,
          COUNT(DISTINCT asub.id) as submitted_assignments,
          COUNT(DISTINCT CASE WHEN asub.status = 'graded' THEN asub.id END) as graded_assignments,
          ROUND(AVG(CASE WHEN asub.score IS NOT NULL THEN asub.score END), 2) as average_score,
          COUNT(DISTINCT c.id) as enrolled_classes
        FROM class_enrollments ce
        JOIN classes c ON ce.class_id = c.id
        LEFT JOIN assignments a ON a.class_id = c.id
        LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id AND asub.user_id = ?
        WHERE ce.student_id = ?
      `, [userId, userId]);
      stats = studentStats[0];
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get overall statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = exports;