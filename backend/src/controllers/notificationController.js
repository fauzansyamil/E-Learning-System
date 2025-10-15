// src/controllers/notificationController.js
const { pool } = require('../config/database');

// ==================== CREATE ====================

// Create Notification (Helper function - biasanya dipanggil dari controller lain)
exports.createNotification = async (userId, title, message, type, relatedId = null) => {
  try {
    await pool.query(
      `INSERT INTO notifications 
       (user_id, title, message, type, related_id, is_read, created_at) 
       VALUES (?, ?, ?, ?, ?, 0, NOW())`,
      [userId, title, message, type, relatedId]
    );
    return { success: true };
  } catch (error) {
    console.error('Create notification error:', error);
    return { success: false, error: error.message };
  }
};

// Create Bulk Notifications (untuk notifikasi ke banyak user sekaligus)
exports.createBulkNotifications = async (req, res) => {
  try {
    const { user_ids, title, message, type, related_id } = req.body;

    // Validasi input
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    if (!title || !message || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title, message, and type are required'
      });
    }

    // Only admin can create bulk notifications
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can create bulk notifications'
      });
    }

    // Insert notifications untuk setiap user
    const values = user_ids.map(userId => [userId, title, message, type, related_id, 0]);
    
    await pool.query(
      `INSERT INTO notifications 
       (user_id, title, message, type, related_id, is_read, created_at) 
       VALUES ?`,
      [values]
    );

    res.status(201).json({
      success: true,
      message: `Notifications sent to ${user_ids.length} users`
    });

  } catch (error) {
    console.error('Create bulk notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Send notification to all students in a class
exports.sendNotificationToClass = async (req, res) => {
  try {
    const { class_id, title, message, type, related_id } = req.body;
    const userId = req.user.id;

    // Validasi input
    if (!class_id || !title || !message || !type) {
      return res.status(400).json({
        success: false,
        message: 'Class ID, title, message, and type are required'
      });
    }

    // Cek apakah user adalah dosen dari kelas ini atau admin
    if (req.user.role !== 'admin') {
      const [classCheck] = await pool.query(
        'SELECT id FROM classes WHERE id = ? AND instructor_id = ?',
        [class_id, userId]
      );

      if (classCheck.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to send notifications to this class'
        });
      }
    }

    // Get all students in the class
    const [students] = await pool.query(
      'SELECT student_id FROM class_enrollments WHERE class_id = ?',
      [class_id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No students found in this class'
      });
    }

    // Insert notifications untuk setiap student
    const values = students.map(student => [student.student_id, title, message, type, related_id, 0]);
    
    await pool.query(
      `INSERT INTO notifications 
       (user_id, title, message, type, related_id, is_read, created_at) 
       VALUES ?`,
      [values]
    );

    res.status(201).json({
      success: true,
      message: `Notifications sent to ${students.length} students`
    });

  } catch (error) {
    console.error('Send notification to class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== READ ====================

// Get All Notifications for Current User
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0, is_read } = req.query;

    let query = `
      SELECT * FROM notifications 
      WHERE user_id = ?
    `;
    const params = [userId];

    // Filter by read status if specified
    if (is_read !== undefined) {
      query += ' AND is_read = ?';
      params.push(is_read === 'true' ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [notifications] = await pool.query(query, params);

    // Get unread count
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    res.json({
      success: true,
      data: notifications,
      unread_count: countResult[0].unread_count
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get Unread Notifications Count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    res.json({
      success: true,
      count: result[0].count
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get Notification by ID
exports.getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [notifications] = await pool.query(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (notifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: notifications[0]
    });

  } catch (error) {
    console.error('Get notification detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== UPDATE ====================

// Mark Notification as Read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Cek apakah notification milik user ini
    const [notifications] = await pool.query(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (notifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Update is_read
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Mark All Notifications as Read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== DELETE ====================

// Delete Notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Cek apakah notification milik user ini
    const [notifications] = await pool.query(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (notifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Delete notification
    await pool.query('DELETE FROM notifications WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete All Read Notifications
exports.deleteAllRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await pool.query(
      'DELETE FROM notifications WHERE user_id = ? AND is_read = 1',
      [userId]
    );

    res.json({
      success: true,
      message: `${result.affectedRows} notifications deleted`
    });

  } catch (error) {
    console.error('Delete all read notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete All Notifications
exports.deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await pool.query(
      'DELETE FROM notifications WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: `${result.affectedRows} notifications deleted`
    });

  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = exports;