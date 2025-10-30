// backend/src/controllers/gradeController.js
const { pool } = require('../config/database');

// ==================== GRADE COMPONENTS ====================

// Create grade component
exports.createGradeComponent = async (req, res) => {
  try {
    const { class_id, name, weight, description } = req.body;

    // Validation
    if (!class_id || !name || weight === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Class ID, name, and weight are required'
      });
    }

    if (weight < 0 || weight > 100) {
      return res.status(400).json({
        success: false,
        message: 'Weight must be between 0 and 100'
      });
    }

    // Check permission
    if (req.user.role !== 'admin') {
      const [classCheck] = await pool.query(
        'SELECT id FROM classes WHERE id = ? AND instructor_id = ?',
        [class_id, req.user.id]
      );

      if (classCheck.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Check if total weight would exceed 100%
    const [weightCheck] = await pool.query(
      'SELECT COALESCE(SUM(weight), 0) as total_weight FROM grade_components WHERE class_id = ?',
      [class_id]
    );

    if (weightCheck[0].total_weight + weight > 100) {
      return res.status(400).json({
        success: false,
        message: `Total weight would exceed 100%. Current total: ${weightCheck[0].total_weight}%`
      });
    }

    // Insert component
    const [result] = await pool.query(
      `INSERT INTO grade_components (class_id, name, weight, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [class_id, name, weight, description]
    );

    res.status(201).json({
      success: true,
      message: 'Grade component created successfully',
      data: {
        id: result.insertId,
        class_id,
        name,
        weight,
        description
      }
    });

  } catch (error) {
    console.error('Create grade component error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get grade components by class
exports.getGradeComponentsByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const [components] = await pool.query(
      `SELECT * FROM grade_components WHERE class_id = ? ORDER BY created_at ASC`,
      [classId]
    );

    // Calculate total weight
    const totalWeight = components.reduce((sum, c) => sum + parseFloat(c.weight), 0);

    res.json({
      success: true,
      data: {
        components,
        total_weight: totalWeight,
        is_complete: totalWeight === 100
      }
    });

  } catch (error) {
    console.error('Get grade components error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update grade component
exports.updateGradeComponent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, weight, description } = req.body;

    // Get current component
    const [components] = await pool.query(
      `SELECT gc.*, c.instructor_id
       FROM grade_components gc
       JOIN classes c ON gc.class_id = c.id
       WHERE gc.id = ?`,
      [id]
    );

    if (components.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Grade component not found'
      });
    }

    const component = components[0];

    // Check permission
    if (req.user.role !== 'admin' && component.instructor_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // If updating weight, check total
    if (weight !== undefined) {
      const [weightCheck] = await pool.query(
        'SELECT COALESCE(SUM(weight), 0) as total_weight FROM grade_components WHERE class_id = ? AND id != ?',
        [component.class_id, id]
      );

      if (weightCheck[0].total_weight + weight > 100) {
        return res.status(400).json({
          success: false,
          message: `Total weight would exceed 100%. Current total (excluding this): ${weightCheck[0].total_weight}%`
        });
      }
    }

    // Update component
    await pool.query(
      `UPDATE grade_components
       SET name = COALESCE(?, name),
           weight = COALESCE(?, weight),
           description = COALESCE(?, description),
           updated_at = NOW()
       WHERE id = ?`,
      [name, weight, description, id]
    );

    // Get updated component
    const [updated] = await pool.query('SELECT * FROM grade_components WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Grade component updated successfully',
      data: updated[0]
    });

  } catch (error) {
    console.error('Update grade component error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete grade component
exports.deleteGradeComponent = async (req, res) => {
  try {
    const { id } = req.params;

    // Get component
    const [components] = await pool.query(
      `SELECT gc.*, c.instructor_id
       FROM grade_components gc
       JOIN classes c ON gc.class_id = c.id
       WHERE gc.id = ?`,
      [id]
    );

    if (components.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Grade component not found'
      });
    }

    // Check permission
    if (req.user.role !== 'admin' && components[0].instructor_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete component (cascade will delete component_grades)
    await pool.query('DELETE FROM grade_components WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Grade component deleted successfully'
    });

  } catch (error) {
    console.error('Delete grade component error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== COMPONENT GRADES ====================

// Grade a student on a component
exports.gradeComponentScore = async (req, res) => {
  try {
    const { component_id, student_id, score, max_score, notes } = req.body;
    const graded_by = req.user.id;

    // Validation
    if (!component_id || !student_id || score === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Component ID, student ID, and score are required'
      });
    }

    const maxScoreValue = max_score || 100;

    if (score < 0 || score > maxScoreValue) {
      return res.status(400).json({
        success: false,
        message: `Score must be between 0 and ${maxScoreValue}`
      });
    }

    // Get component and check permission
    const [components] = await pool.query(
      `SELECT gc.*, c.instructor_id, c.id as class_id
       FROM grade_components gc
       JOIN classes c ON gc.class_id = c.id
       WHERE gc.id = ?`,
      [component_id]
    );

    if (components.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Grade component not found'
      });
    }

    if (req.user.role !== 'admin' && components[0].instructor_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if student is enrolled
    const [enrollment] = await pool.query(
      'SELECT id FROM class_enrollments WHERE class_id = ? AND student_id = ?',
      [components[0].class_id, student_id]
    );

    if (enrollment.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student is not enrolled in this class'
      });
    }

    // Insert or update grade
    await pool.query(
      `INSERT INTO component_grades (component_id, student_id, score, max_score, notes, graded_by, graded_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         score = VALUES(score),
         max_score = VALUES(max_score),
         notes = VALUES(notes),
         graded_by = VALUES(graded_by),
         graded_at = NOW()`,
      [component_id, student_id, score, maxScoreValue, notes, graded_by]
    );

    // Recalculate final grade
    await calculateFinalGrade(components[0].class_id, student_id);

    res.json({
      success: true,
      message: 'Grade recorded successfully'
    });

  } catch (error) {
    console.error('Grade component score error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get student's component grades for a class
exports.getStudentComponentGrades = async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    // Get all components for the class
    const [components] = await pool.query(
      'SELECT * FROM grade_components WHERE class_id = ? ORDER BY created_at ASC',
      [classId]
    );

    // Get student's grades for each component
    const gradesWithComponents = await Promise.all(
      components.map(async (component) => {
        const [grades] = await pool.query(
          `SELECT cg.*, u.full_name as graded_by_name
           FROM component_grades cg
           LEFT JOIN users u ON cg.graded_by = u.id
           WHERE cg.component_id = ? AND cg.student_id = ?`,
          [component.id, studentId]
        );

        return {
          ...component,
          grade: grades[0] || null
        };
      })
    );

    res.json({
      success: true,
      data: gradesWithComponents
    });

  } catch (error) {
    console.error('Get student component grades error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== FINAL GRADES ====================

// Calculate final grade for a student (Helper function)
async function calculateFinalGrade(class_id, student_id) {
  try {
    // Get all grade components for the class
    const [components] = await pool.query(
      'SELECT * FROM grade_components WHERE class_id = ?',
      [class_id]
    );

    if (components.length === 0) {
      return null; // No grade components defined
    }

    // Get student's scores for all components
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const component of components) {
      const [grades] = await pool.query(
        'SELECT score, max_score FROM component_grades WHERE component_id = ? AND student_id = ?',
        [component.id, student_id]
      );

      if (grades.length > 0) {
        const grade = grades[0];
        // Normalize score to 0-100 scale
        const normalizedScore = (grade.score / grade.max_score) * 100;
        // Apply weight
        const weightedScore = (normalizedScore * component.weight) / 100;
        totalWeightedScore += weightedScore;
        totalWeight += parseFloat(component.weight);
      }
    }

    if (totalWeight === 0) {
      return null; // No grades recorded yet
    }

    // Calculate final numeric grade (0-100 scale)
    const numeric_grade = totalWeightedScore;

    // Calculate letter grade
    const letter_grade = getLetterGrade(numeric_grade);

    // Calculate grade points (GPA scale 0-4.00)
    const grade_points = getGradePoints(numeric_grade);

    // Insert or update final grade
    await pool.query(
      `INSERT INTO final_grades (class_id, student_id, numeric_grade, letter_grade, grade_points, is_published, calculated_at, updated_at)
       VALUES (?, ?, ?, ?, ?, FALSE, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         numeric_grade = VALUES(numeric_grade),
         letter_grade = VALUES(letter_grade),
         grade_points = VALUES(grade_points),
         calculated_at = NOW(),
         updated_at = NOW()`,
      [class_id, student_id, numeric_grade, letter_grade, grade_points]
    );

    return {
      numeric_grade,
      letter_grade,
      grade_points
    };

  } catch (error) {
    console.error('Calculate final grade error:', error);
    throw error;
  }
}

// Helper: Convert numeric grade to letter grade
function getLetterGrade(score) {
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 60) return 'D';
  return 'F';
}

// Helper: Convert numeric grade to grade points (GPA)
function getGradePoints(score) {
  if (score >= 93) return 4.00;
  if (score >= 90) return 3.67;
  if (score >= 87) return 3.33;
  if (score >= 83) return 3.00;
  if (score >= 80) return 2.67;
  if (score >= 77) return 2.33;
  if (score >= 73) return 2.00;
  if (score >= 70) return 1.67;
  if (score >= 67) return 1.33;
  if (score >= 60) return 1.00;
  return 0.00;
}

// Get final grades for a class
exports.getFinalGradesByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    // Check permission
    if (req.user.role === 'mahasiswa') {
      return res.status(403).json({
        success: false,
        message: 'Students cannot view all class grades'
      });
    }

    if (req.user.role === 'dosen') {
      const [classCheck] = await pool.query(
        'SELECT id FROM classes WHERE id = ? AND instructor_id = ?',
        [classId, req.user.id]
      );

      if (classCheck.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Get all enrolled students with their final grades
    const [grades] = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.student_id,
              fg.numeric_grade, fg.letter_grade, fg.grade_points, fg.is_published, fg.calculated_at
       FROM class_enrollments ce
       JOIN users u ON ce.student_id = u.id
       LEFT JOIN final_grades fg ON fg.class_id = ce.class_id AND fg.student_id = u.id
       WHERE ce.class_id = ?
       ORDER BY u.full_name ASC`,
      [classId]
    );

    res.json({
      success: true,
      data: grades
    });

  } catch (error) {
    console.error('Get final grades error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get student's final grade
exports.getMyFinalGrade = async (req, res) => {
  try {
    const { classId } = req.params;
    const student_id = req.user.id;

    // Check enrollment
    const [enrollment] = await pool.query(
      'SELECT id FROM class_enrollments WHERE class_id = ? AND student_id = ?',
      [classId, student_id]
    );

    if (enrollment.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this class'
      });
    }

    // Get final grade (only if published)
    const [grades] = await pool.query(
      `SELECT fg.*, c.name as class_name, c.code as class_code
       FROM final_grades fg
       JOIN classes c ON fg.class_id = c.id
       WHERE fg.class_id = ? AND fg.student_id = ? AND fg.is_published = TRUE`,
      [classId, student_id]
    );

    if (grades.length === 0) {
      return res.json({
        success: true,
        message: 'Grade not yet published',
        data: null
      });
    }

    // Get component breakdown
    const [components] = await pool.query(
      `SELECT gc.name, gc.weight, cg.score, cg.max_score
       FROM grade_components gc
       LEFT JOIN component_grades cg ON gc.id = cg.component_id AND cg.student_id = ?
       WHERE gc.class_id = ?
       ORDER BY gc.created_at ASC`,
      [student_id, classId]
    );

    res.json({
      success: true,
      data: {
        ...grades[0],
        components
      }
    });

  } catch (error) {
    console.error('Get my final grade error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Publish/unpublish grades
exports.publishGrades = async (req, res) => {
  try {
    const { class_id, student_ids, is_published } = req.body;

    // Check permission
    if (req.user.role !== 'admin') {
      const [classCheck] = await pool.query(
        'SELECT id FROM classes WHERE id = ? AND instructor_id = ?',
        [class_id, req.user.id]
      );

      if (classCheck.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    const published_at = is_published ? new Date() : null;

    if (student_ids && student_ids.length > 0) {
      // Publish specific students
      const placeholders = student_ids.map(() => '?').join(',');
      await pool.query(
        `UPDATE final_grades
         SET is_published = ?, published_at = ?, updated_at = NOW()
         WHERE class_id = ? AND student_id IN (${placeholders})`,
        [is_published, published_at, class_id, ...student_ids]
      );
    } else {
      // Publish all students in the class
      await pool.query(
        `UPDATE final_grades
         SET is_published = ?, published_at = ?, updated_at = NOW()
         WHERE class_id = ?`,
        [is_published, published_at, class_id]
      );
    }

    res.json({
      success: true,
      message: `Grades ${is_published ? 'published' : 'unpublished'} successfully`
    });

  } catch (error) {
    console.error('Publish grades error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Manually recalculate all grades for a class
exports.recalculateClassGrades = async (req, res) => {
  try {
    const { classId } = req.params;

    // Check permission
    if (req.user.role !== 'admin') {
      const [classCheck] = await pool.query(
        'SELECT id FROM classes WHERE id = ? AND instructor_id = ?',
        [classId, req.user.id]
      );

      if (classCheck.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Get all enrolled students
    const [students] = await pool.query(
      'SELECT student_id FROM class_enrollments WHERE class_id = ?',
      [classId]
    );

    // Recalculate for each student
    for (const student of students) {
      await calculateFinalGrade(classId, student.student_id);
    }

    res.json({
      success: true,
      message: `Recalculated grades for ${students.length} students`
    });

  } catch (error) {
    console.error('Recalculate grades error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = exports;
