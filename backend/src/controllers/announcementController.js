// backend/src/controllers/announcementController.js
const { pool } = require('../config/database');

// ==================== CREATE ====================

// Create announcement
exports.createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      content,
      class_id, // null for system-wide announcement
      priority,
      is_published,
      expires_at
    } = req.body;
    const created_by = req.user.id;

    // Validation
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // Check permission
    if (class_id) {
      // Class announcement - must be instructor or admin
      if (req.user.role !== 'admin') {
        const [classCheck] = await pool.query(
          'SELECT id FROM classes WHERE id = ? AND instructor_id = ?',
          [class_id, created_by]
        );

        if (classCheck.length === 0) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You are not the instructor of this class'
          });
        }
      }
    } else {
      // System-wide announcement - admin only
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can create system-wide announcements'
        });
      }
    }

    const published_at = is_published ? new Date() : null;

    // Insert announcement
    const [result] = await pool.query(
      `INSERT INTO announcements
       (title, content, class_id, created_by, priority, is_published, published_at, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        title,
        content,
        class_id,
        created_by,
        priority || 'normal',
        is_published !== false,
        published_at,
        expires_at
      ]
    );

    // Get created announcement
    const [announcement] = await pool.query(
      `SELECT a.*, u.full_name as author, c.name as class_name, c.code as class_code
       FROM announcements a
       JOIN users u ON a.created_by = u.id
       LEFT JOIN classes c ON a.class_id = c.id
       WHERE a.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement[0]
    });

  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== READ ====================

// Get all announcements (with filters)
exports.getAllAnnouncements = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { class_id, priority } = req.query;

    let query = `
      SELECT a.*, u.full_name as author, c.name as class_name, c.code as class_code
      FROM announcements a
      JOIN users u ON a.created_by = u.id
      LEFT JOIN classes c ON a.class_id = c.id
      WHERE a.is_published = TRUE
        AND (a.expires_at IS NULL OR a.expires_at > NOW())
    `;

    let params = [];

    if (userRole === 'mahasiswa') {
      // Students see system-wide announcements + their enrolled class announcements
      query += ` AND (a.class_id IS NULL OR a.class_id IN (
        SELECT class_id FROM class_enrollments WHERE student_id = ?
      ))`;
      params.push(userId);
    } else if (userRole === 'dosen') {
      // Lecturers see system-wide + their class announcements
      query += ` AND (a.class_id IS NULL OR a.class_id IN (
        SELECT id FROM classes WHERE instructor_id = ?
      ))`;
      params.push(userId);
    }
    // Admin sees all

    // Filter by class
    if (class_id) {
      query += ' AND a.class_id = ?';
      params.push(class_id);
    }

    // Filter by priority
    if (priority) {
      query += ' AND a.priority = ?';
      params.push(priority);
    }

    query += ' ORDER BY a.priority DESC, a.published_at DESC';

    const [announcements] = await pool.query(query, params);

    res.json({
      success: true,
      data: announcements
    });

  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get announcements by class
exports.getAnnouncementsByClass = async (req, res) => {
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

    let query = `
      SELECT a.*, u.full_name as author
      FROM announcements a
      JOIN users u ON a.created_by = u.id
      WHERE a.class_id = ?
    `;

    // Students only see published announcements
    if (userRole === 'mahasiswa') {
      query += ' AND a.is_published = TRUE AND (a.expires_at IS NULL OR a.expires_at > NOW())';
    }

    query += ' ORDER BY a.priority DESC, a.published_at DESC';

    const [announcements] = await pool.query(query, [classId]);

    res.json({
      success: true,
      data: announcements
    });

  } catch (error) {
    console.error('Get class announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get announcement by ID
exports.getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const [announcements] = await pool.query(
      `SELECT a.*, u.full_name as author, u.email as author_email,
              c.name as class_name, c.code as class_code, c.instructor_id
       FROM announcements a
       JOIN users u ON a.created_by = u.id
       LEFT JOIN classes c ON a.class_id = c.id
       WHERE a.id = ?`,
      [id]
    );

    if (announcements.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    const announcement = announcements[0];

    // Check access
    if (userRole === 'mahasiswa') {
      if (!announcement.is_published) {
        return res.status(403).json({
          success: false,
          message: 'This announcement is not published'
        });
      }

      if (announcement.class_id) {
        // Check enrollment
        const [enrollment] = await pool.query(
          'SELECT id FROM class_enrollments WHERE class_id = ? AND student_id = ?',
          [announcement.class_id, userId]
        );

        if (enrollment.length === 0) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }
    } else if (userRole === 'dosen') {
      if (announcement.class_id && announcement.instructor_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: announcement
    });

  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== UPDATE ====================

// Update announcement
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, priority, is_published, expires_at } = req.body;

    // Check if announcement exists and user has permission
    const [announcements] = await pool.query(
      `SELECT a.*, c.instructor_id
       FROM announcements a
       LEFT JOIN classes c ON a.class_id = c.id
       WHERE a.id = ?`,
      [id]
    );

    if (announcements.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    const announcement = announcements[0];

    // Check permission
    if (req.user.role !== 'admin') {
      if (announcement.class_id) {
        // Class announcement - must be instructor
        if (announcement.instructor_id !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      } else {
        // System-wide announcement - admin only
        return res.status(403).json({
          success: false,
          message: 'Only admins can edit system-wide announcements'
        });
      }
    }

    // If publishing for first time, set published_at
    let published_at = announcement.published_at;
    if (is_published && !published_at) {
      published_at = new Date();
    }

    // Update announcement
    await pool.query(
      `UPDATE announcements
       SET title = COALESCE(?, title),
           content = COALESCE(?, content),
           priority = COALESCE(?, priority),
           is_published = COALESCE(?, is_published),
           published_at = ?,
           expires_at = COALESCE(?, expires_at),
           updated_at = NOW()
       WHERE id = ?`,
      [title, content, priority, is_published, published_at, expires_at, id]
    );

    // Get updated announcement
    const [updated] = await pool.query(
      `SELECT a.*, u.full_name as author, c.name as class_name, c.code as class_code
       FROM announcements a
       JOIN users u ON a.created_by = u.id
       LEFT JOIN classes c ON a.class_id = c.id
       WHERE a.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      data: updated[0]
    });

  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== DELETE ====================

// Delete announcement
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if announcement exists and user has permission
    const [announcements] = await pool.query(
      `SELECT a.*, c.instructor_id
       FROM announcements a
       LEFT JOIN classes c ON a.class_id = c.id
       WHERE a.id = ?`,
      [id]
    );

    if (announcements.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    const announcement = announcements[0];

    // Check permission
    if (req.user.role !== 'admin') {
      if (announcement.class_id) {
        if (announcement.instructor_id !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: 'Only admins can delete system-wide announcements'
        });
      }
    }

    // Delete announcement
    await pool.query('DELETE FROM announcements WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });

  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = exports;
