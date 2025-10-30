// backend/src/controllers/scheduleController.js
const { pool } = require('../config/database');

// ==================== CREATE ====================

// Create schedule
exports.createSchedule = async (req, res) => {
  try {
    const {
      class_id,
      day_of_week,
      start_time,
      end_time,
      room,
      building,
      session_type,
      is_recurring,
      specific_date,
      notes
    } = req.body;

    // Validation
    if (!class_id || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'Class ID, start time, and end time are required'
      });
    }

    if (is_recurring && !day_of_week) {
      return res.status(400).json({
        success: false,
        message: 'Day of week is required for recurring schedules'
      });
    }

    if (!is_recurring && !specific_date) {
      return res.status(400).json({
        success: false,
        message: 'Specific date is required for non-recurring schedules'
      });
    }

    // Check permission (admin or instructor of the class)
    if (req.user.role !== 'admin') {
      const [classCheck] = await pool.query(
        'SELECT id FROM classes WHERE id = ? AND instructor_id = ?',
        [class_id, req.user.id]
      );

      if (classCheck.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not the instructor of this class'
        });
      }
    }

    // Insert schedule
    const [result] = await pool.query(
      `INSERT INTO schedules
       (class_id, day_of_week, start_time, end_time, room, building, session_type, is_recurring, specific_date, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        class_id,
        day_of_week,
        start_time,
        end_time,
        room,
        building,
        session_type || 'lecture',
        is_recurring !== false,
        specific_date,
        notes
      ]
    );

    // Get created schedule
    const [schedule] = await pool.query(
      `SELECT s.*, c.name as class_name, c.code as class_code
       FROM schedules s
       JOIN classes c ON s.class_id = c.id
       WHERE s.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: schedule[0]
    });

  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== READ ====================

// Get all schedules by class
exports.getSchedulesByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check access
    if (userRole === 'mahasiswa') {
      const [enrollment] = await pool.query(
        'SELECT id FROM class_enrollments WHERE class_id = ? AND student_id = ?',
        [classId, userId]
      );

      if (enrollment.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You are not enrolled in this class'
        });
      }
    } else if (userRole === 'dosen') {
      const [classCheck] = await pool.query(
        'SELECT id FROM classes WHERE id = ? AND instructor_id = ?',
        [classId, userId]
      );

      if (classCheck.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You are not the instructor of this class'
        });
      }
    }

    // Get schedules
    const [schedules] = await pool.query(
      `SELECT s.*, c.name as class_name, c.code as class_code
       FROM schedules s
       JOIN classes c ON s.class_id = c.id
       WHERE s.class_id = ?
       ORDER BY
         CASE day_of_week
           WHEN 'Monday' THEN 1
           WHEN 'Tuesday' THEN 2
           WHEN 'Wednesday' THEN 3
           WHEN 'Thursday' THEN 4
           WHEN 'Friday' THEN 5
           WHEN 'Saturday' THEN 6
           WHEN 'Sunday' THEN 7
         END,
         s.start_time ASC`,
      [classId]
    );

    res.json({
      success: true,
      data: schedules
    });

  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get user's weekly schedule (all enrolled classes)
exports.getMyWeeklySchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query;
    let params = [];

    if (userRole === 'admin') {
      // Admin sees all schedules
      query = `
        SELECT s.*, c.name as class_name, c.code as class_code, c.instructor_id,
               u.full_name as instructor_name
        FROM schedules s
        JOIN classes c ON s.class_id = c.id
        JOIN users u ON c.instructor_id = u.id
        WHERE s.is_recurring = TRUE
        ORDER BY
          CASE s.day_of_week
            WHEN 'Monday' THEN 1
            WHEN 'Tuesday' THEN 2
            WHEN 'Wednesday' THEN 3
            WHEN 'Thursday' THEN 4
            WHEN 'Friday' THEN 5
            WHEN 'Saturday' THEN 6
            WHEN 'Sunday' THEN 7
          END,
          s.start_time ASC
      `;
    } else if (userRole === 'dosen') {
      // Dosen sees their class schedules
      query = `
        SELECT s.*, c.name as class_name, c.code as class_code
        FROM schedules s
        JOIN classes c ON s.class_id = c.id
        WHERE c.instructor_id = ? AND s.is_recurring = TRUE
        ORDER BY
          CASE s.day_of_week
            WHEN 'Monday' THEN 1
            WHEN 'Tuesday' THEN 2
            WHEN 'Wednesday' THEN 3
            WHEN 'Thursday' THEN 4
            WHEN 'Friday' THEN 5
            WHEN 'Saturday' THEN 6
            WHEN 'Sunday' THEN 7
          END,
          s.start_time ASC
      `;
      params = [userId];
    } else {
      // Mahasiswa sees enrolled class schedules
      query = `
        SELECT s.*, c.name as class_name, c.code as class_code,
               u.full_name as instructor_name
        FROM schedules s
        JOIN classes c ON s.class_id = c.id
        JOIN class_enrollments ce ON c.id = ce.class_id
        JOIN users u ON c.instructor_id = u.id
        WHERE ce.student_id = ? AND s.is_recurring = TRUE
        ORDER BY
          CASE s.day_of_week
            WHEN 'Monday' THEN 1
            WHEN 'Tuesday' THEN 2
            WHEN 'Wednesday' THEN 3
            WHEN 'Thursday' THEN 4
            WHEN 'Friday' THEN 5
            WHEN 'Saturday' THEN 6
            WHEN 'Sunday' THEN 7
          END,
          s.start_time ASC
      `;
      params = [userId];
    }

    const [schedules] = await pool.query(query, params);

    res.json({
      success: true,
      data: schedules
    });

  } catch (error) {
    console.error('Get weekly schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get schedule by ID
exports.getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;

    const [schedules] = await pool.query(
      `SELECT s.*, c.name as class_name, c.code as class_code, c.instructor_id,
              u.full_name as instructor_name
       FROM schedules s
       JOIN classes c ON s.class_id = c.id
       JOIN users u ON c.instructor_id = u.id
       WHERE s.id = ?`,
      [id]
    );

    if (schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    res.json({
      success: true,
      data: schedules[0]
    });

  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== UPDATE ====================

// Update schedule
exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      day_of_week,
      start_time,
      end_time,
      room,
      building,
      session_type,
      is_recurring,
      specific_date,
      notes
    } = req.body;

    // Check if schedule exists and user has permission
    const [schedules] = await pool.query(
      `SELECT s.*, c.instructor_id
       FROM schedules s
       JOIN classes c ON s.class_id = c.id
       WHERE s.id = ?`,
      [id]
    );

    if (schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    if (req.user.role !== 'admin' && schedules[0].instructor_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update schedule
    await pool.query(
      `UPDATE schedules
       SET day_of_week = COALESCE(?, day_of_week),
           start_time = COALESCE(?, start_time),
           end_time = COALESCE(?, end_time),
           room = COALESCE(?, room),
           building = COALESCE(?, building),
           session_type = COALESCE(?, session_type),
           is_recurring = COALESCE(?, is_recurring),
           specific_date = COALESCE(?, specific_date),
           notes = COALESCE(?, notes),
           updated_at = NOW()
       WHERE id = ?`,
      [day_of_week, start_time, end_time, room, building, session_type, is_recurring, specific_date, notes, id]
    );

    // Get updated schedule
    const [updated] = await pool.query(
      `SELECT s.*, c.name as class_name, c.code as class_code
       FROM schedules s
       JOIN classes c ON s.class_id = c.id
       WHERE s.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: updated[0]
    });

  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== DELETE ====================

// Delete schedule
exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if schedule exists and user has permission
    const [schedules] = await pool.query(
      `SELECT s.*, c.instructor_id
       FROM schedules s
       JOIN classes c ON s.class_id = c.id
       WHERE s.id = ?`,
      [id]
    );

    if (schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    if (req.user.role !== 'admin' && schedules[0].instructor_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete schedule
    await pool.query('DELETE FROM schedules WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });

  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = exports;
