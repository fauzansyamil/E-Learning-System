// backend/src/controllers/gradeController.js - NEW for Gradebook page
const { pool } = require('../config/database');

// Get all grades for current user with detailed breakdown
exports.getAllGrades = async (req, res) => {
  try {
    const userId = req.user.id;
    const { semester } = req.query;

    // Build query based on semester filter
    let semesterCondition = '';
    const params = [userId, userId, userId, userId, userId, userId];
    
    if (semester && semester !== 'current') {
      semesterCondition = 'AND c.semester = ?';
      params.push(semester);
    }

    // Get courses with grades breakdown
    const [courses] = await pool.query(
      `SELECT 
        c.id, c.code, c.name, c.credits, 
        u.full_name as instructor,
        c.semester,
        ce.attendance_percentage as attendance
       FROM classes c
       JOIN class_enrollments ce ON c.id = ce.class_id
       JOIN users u ON c.instructor_id = u.id
       WHERE ce.user_id = ? ${semesterCondition}
       ORDER BY c.name ASC`,
      semester && semester !== 'current' ? [userId, semester] : [userId]
    );

    // For each course, get detailed grades
    const coursesWithGrades = await Promise.all(courses.map(async (course) => {
      // Get assignments grades
      const [assignments] = await pool.query(
        `SELECT a.title as name, 
                asub.score, 
                a.max_score as max,
                a.weight
         FROM assignments a
         LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.user_id = ?
         WHERE a.class_id = ? AND a.type = 'assignment'
         ORDER BY a.created_at`,
        [userId, course.id]
      );

      // Get quiz grades
      const [quizzes] = await pool.query(
        `SELECT a.title as name, 
                asub.score, 
                a.max_score as max,
                a.weight
         FROM assignments a
         LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.user_id = ?
         WHERE a.class_id = ? AND a.type = 'quiz'
         ORDER BY a.created_at`,
        [userId, course.id]
      );

      // Get midterm grade
      const [midterm] = await pool.query(
        `SELECT asub.score, 
                a.max_score as max,
                a.weight
         FROM assignments a
         LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.user_id = ?
         WHERE a.class_id = ? AND a.type = 'midterm'
         LIMIT 1`,
        [userId, course.id]
      );

      // Get final project/exam grade
      const [finalProject] = await pool.query(
        `SELECT asub.score, 
                a.max_score as max,
                a.weight
         FROM assignments a
         LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.user_id = ?
         WHERE a.class_id = ? AND a.type IN ('final', 'project')
         LIMIT 1`,
        [userId, course.id]
      );

      // Calculate current score
      let totalScore = 0;
      let totalWeight = 0;

      // Assignments
      assignments.forEach(a => {
        if (a.score !== null) {
          totalScore += (a.score / a.max) * a.weight;
          totalWeight += a.weight;
        }
      });

      // Quizzes
      quizzes.forEach(q => {
        if (q.score !== null) {
          totalScore += (q.score / q.max) * q.weight;
          totalWeight += q.weight;
        }
      });

      // Midterm
      if (midterm.length > 0 && midterm[0].score !== null) {
        totalScore += (midterm[0].score / midterm[0].max) * midterm[0].weight;
        totalWeight += midterm[0].weight;
      }

      // Final
      if (finalProject.length > 0 && finalProject[0].score !== null) {
        totalScore += (finalProject[0].score / finalProject[0].max) * finalProject[0].weight;
        totalWeight += finalProject[0].weight;
      }

      const currentScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
      const letterGrade = getLetterGrade(currentScore);

      return {
        ...course,
        grades: {
          assignments: assignments.map(a => ({
            name: a.name,
            score: a.score,
            max: a.max,
            weight: a.weight
          })),
          quiz: quizzes.map(q => ({
            name: q.name,
            score: q.score,
            max: q.max,
            weight: q.weight
          })),
          midterm: midterm.length > 0 ? {
            score: midterm[0].score,
            max: midterm[0].max,
            weight: midterm[0].weight
          } : { score: null, max: 100, weight: 20 },
          finalProject: finalProject.length > 0 ? {
            score: finalProject[0].score,
            max: finalProject[0].max,
            weight: finalProject[0].weight
          } : { score: null, max: 100, weight: 20 }
        },
        currentScore: parseFloat(currentScore.toFixed(2)),
        letterGrade: letterGrade
      };
    }));

    res.json({
      success: true,
      data: coursesWithGrades
    });

  } catch (error) {
    console.error('Get grades error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching grades',
      error: error.message
    });
  }
};

// Get GPA calculation
exports.getGPA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { semester } = req.query;

    let semesterCondition = '';
    const params = [userId];
    
    if (semester && semester !== 'current') {
      semesterCondition = 'AND c.semester = ?';
      params.push(semester);
    }

    // Get all courses with final grades
    const [courses] = await pool.query(
      `SELECT c.credits, ce.final_grade
       FROM classes c
       JOIN class_enrollments ce ON c.id = ce.class_id
       WHERE ce.user_id = ? AND ce.final_grade IS NOT NULL ${semesterCondition}`,
      params
    );

    if (courses.length === 0) {
      return res.json({
        success: true,
        data: {
          gpa: 0,
          totalCredits: 0,
          completedCourses: 0
        }
      });
    }

    const gradePoints = {
      'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D': 1.0, 'E': 0.0
    };

    let totalPoints = 0;
    let totalCredits = 0;

    courses.forEach(course => {
      const points = gradePoints[course.final_grade] || 0;
      totalPoints += points * course.credits;
      totalCredits += course.credits;
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        gpa: parseFloat(gpa),
        totalCredits,
        completedCourses: courses.length
      }
    });

  } catch (error) {
    console.error('Get GPA error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating GPA',
      error: error.message
    });
  }
};

// Get grades for specific course
exports.getGradesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Verify enrollment
    const [enrollment] = await pool.query(
      'SELECT * FROM class_enrollments WHERE user_id = ? AND class_id = ?',
      [userId, courseId]
    );

    if (enrollment.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Not enrolled in this course'
      });
    }

    // Get all grades for this course
    const [grades] = await pool.query(
      `SELECT a.title, a.type, a.max_score, a.weight,
              asub.score, asub.feedback, asub.graded_at
       FROM assignments a
       LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.user_id = ?
       WHERE a.class_id = ?
       ORDER BY a.type, a.created_at`,
      [userId, courseId]
    );

    res.json({
      success: true,
      data: grades
    });

  } catch (error) {
    console.error('Get course grades error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course grades',
      error: error.message
    });
  }
};

// Helper function to convert score to letter grade
function getLetterGrade(score) {
  if (score >= 85) return 'A';
  if (score >= 80) return 'A-';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 65) return 'B-';
  if (score >= 60) return 'C+';
  if (score >= 55) return 'C';
  if (score >= 50) return 'C-';
  if (score >= 45) return 'D';
  return 'E';
}

module.exports = exports;