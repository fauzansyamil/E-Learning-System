// src/controllers/discussionController.js
const { pool } = require('../config/database');

// ==================== CREATE ====================

// Create New Discussion Topic
exports.createDiscussion = async (req, res) => {
  try {
    const { class_id, title, content } = req.body;
    const created_by = req.user.id;

    // Validasi input
    if (!class_id || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Class ID, title, and content are required'
      });
    }

    // Cek apakah user memiliki akses ke kelas ini
    if (req.user.role === 'mahasiswa') {
      const [enrollment] = await pool.query(
        'SELECT id FROM class_enrollments WHERE class_id = ? AND student_id = ?',
        [class_id, created_by]
      );

      if (enrollment.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You are not enrolled in this class'
        });
      }
    } else if (req.user.role === 'dosen') {
      const [classCheck] = await pool.query(
        'SELECT id FROM classes WHERE id = ? AND instructor_id = ?',
        [class_id, created_by]
      );

      if (classCheck.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You are not the instructor of this class'
        });
      }
    }

    // Insert discussion
    const [result] = await pool.query(
      `INSERT INTO discussions
       (class_id, created_by, title, content, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [class_id, created_by, title, content]
    );

    // Get created discussion
    const [discussion] = await pool.query(
      `SELECT d.*, u.full_name as author_name, u.profile_picture, c.name as class_name,
              (SELECT COUNT(*) FROM discussion_replies WHERE discussion_id = d.id) as reply_count
       FROM discussions d
       JOIN users u ON d.created_by = u.id
       JOIN classes c ON d.class_id = c.id
       WHERE d.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Discussion created successfully',
      data: discussion[0]
    });

  } catch (error) {
    console.error('Create discussion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create Reply to Discussion
exports.createReply = async (req, res) => {
  try {
    const { discussion_id } = req.params;
    const { content, parent_reply_id } = req.body;
    const user_id = req.user.id;

    // Validasi input
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    // Cek apakah discussion exists
    const [discussions] = await pool.query(
      'SELECT d.*, c.instructor_id FROM discussions d JOIN classes c ON d.class_id = c.id WHERE d.id = ?',
      [discussion_id]
    );

    if (discussions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    const discussion = discussions[0];

    // Cek akses user ke kelas ini
    if (req.user.role === 'mahasiswa') {
      const [enrollment] = await pool.query(
        'SELECT id FROM class_enrollments WHERE class_id = ? AND student_id = ?',
        [discussion.class_id, user_id]
      );

      if (enrollment.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You are not enrolled in this class'
        });
      }
    } else if (req.user.role === 'dosen' && discussion.instructor_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Insert reply
    const [result] = await pool.query(
      `INSERT INTO discussion_replies 
       (discussion_id, user_id, content, parent_reply_id, created_at, updated_at) 
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [discussion_id, user_id, content, parent_reply_id || null]
    );

    // Update discussion updated_at
    await pool.query(
      'UPDATE discussions SET updated_at = NOW() WHERE id = ?',
      [discussion_id]
    );

    // Get created reply
    const [reply] = await pool.query(
      `SELECT dr.*, u.full_name as author_name, u.profile_picture
       FROM discussion_replies dr
       JOIN users u ON dr.user_id = u.id
       WHERE dr.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Reply created successfully',
      data: reply[0]
    });

  } catch (error) {
    console.error('Create reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== READ ====================

// Get All Discussions (across all user's classes)
exports.getAllDiscussions = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query;
    let params = [];

    if (userRole === 'admin') {
      // Admin can see all discussions
      query = `
        SELECT d.*, u.full_name as author, u.profile_picture,
               r.name as author_role, c.name as class_name,
               (SELECT COUNT(*) FROM discussion_replies WHERE discussion_id = d.id) as replies_count
        FROM discussions d
        JOIN users u ON d.created_by = u.id
        JOIN roles r ON u.role_id = r.id
        JOIN classes c ON d.class_id = c.id
        ORDER BY d.updated_at DESC
      `;
    } else if (userRole === 'dosen') {
      // Dosen can see discussions from their classes
      query = `
        SELECT d.*, u.full_name as author, u.profile_picture,
               r.name as author_role, c.name as class_name,
               (SELECT COUNT(*) FROM discussion_replies WHERE discussion_id = d.id) as replies_count
        FROM discussions d
        JOIN users u ON d.created_by = u.id
        JOIN roles r ON u.role_id = r.id
        JOIN classes c ON d.class_id = c.id
        WHERE c.instructor_id = ?
        ORDER BY d.updated_at DESC
      `;
      params = [userId];
    } else {
      // Mahasiswa can see discussions from enrolled classes
      query = `
        SELECT d.*, u.full_name as author, u.profile_picture,
               r.name as author_role, c.name as class_name,
               (SELECT COUNT(*) FROM discussion_replies WHERE discussion_id = d.id) as replies_count
        FROM discussions d
        JOIN users u ON d.created_by = u.id
        JOIN roles r ON u.role_id = r.id
        JOIN classes c ON d.class_id = c.id
        JOIN class_enrollments ce ON c.id = ce.class_id
        WHERE ce.student_id = ?
        ORDER BY d.updated_at DESC
      `;
      params = [userId];
    }

    const [discussions] = await pool.query(query, params);

    // Fetch replies for each discussion
    for (let discussion of discussions) {
      const [replies] = await pool.query(
        `SELECT dr.*, u.full_name as author, u.profile_picture, r.name as author_role
         FROM discussion_replies dr
         JOIN users u ON dr.user_id = u.id
         JOIN roles r ON u.role_id = r.id
         WHERE dr.discussion_id = ?
         ORDER BY dr.created_at ASC`,
        [discussion.id]
      );
      discussion.replies = replies;
    }

    res.json({
      success: true,
      data: discussions
    });

  } catch (error) {
    console.error('Get all discussions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get All Discussions by Class
exports.getDiscussionsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Cek akses user
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

    // Get discussions
    const [discussions] = await pool.query(
      `SELECT d.*, u.full_name as author_name, u.profile_picture,
              (SELECT COUNT(*) FROM discussion_replies WHERE discussion_id = d.id) as reply_count,
              (SELECT full_name FROM users 
               WHERE id = (SELECT user_id FROM discussion_replies 
                          WHERE discussion_id = d.id 
                          ORDER BY created_at DESC LIMIT 1)) as last_reply_author,
              (SELECT created_at FROM discussion_replies 
               WHERE discussion_id = d.id 
               ORDER BY created_at DESC LIMIT 1) as last_reply_at
       FROM discussions d
       JOIN users u ON d.created_by = u.id
       WHERE d.class_id = ?
       ORDER BY d.updated_at DESC`,
      [classId]
    );

    res.json({
      success: true,
      data: discussions
    });

  } catch (error) {
    console.error('Get discussions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get Discussion by ID (with replies)
exports.getDiscussionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get discussion
    const [discussions] = await pool.query(
      `SELECT d.*, u.full_name as author_name, u.profile_picture, c.name as class_name, c.instructor_id
       FROM discussions d
       JOIN users u ON d.created_by = u.id
       JOIN classes c ON d.class_id = c.id
       WHERE d.id = ?`,
      [id]
    );

    if (discussions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    const discussion = discussions[0];

    // Cek akses user
    if (userRole === 'mahasiswa') {
      const [enrollment] = await pool.query(
        'SELECT id FROM class_enrollments WHERE class_id = ? AND student_id = ?',
        [discussion.class_id, userId]
      );

      if (enrollment.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You are not enrolled in this class'
        });
      }
    } else if (userRole === 'dosen' && discussion.instructor_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get replies
    const [replies] = await pool.query(
      `SELECT dr.*, u.full_name as author_name, u.profile_picture
       FROM discussion_replies dr
       JOIN users u ON dr.user_id = u.id
       WHERE dr.discussion_id = ?
       ORDER BY dr.created_at ASC`,
      [id]
    );

    discussion.replies = replies;

    res.json({
      success: true,
      data: discussion
    });

  } catch (error) {
    console.error('Get discussion detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== UPDATE ====================

// Update Discussion
exports.updateDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.user.id;

    // Get discussion
    const [discussions] = await pool.query(
      'SELECT * FROM discussions WHERE id = ?',
      [id]
    );

    if (discussions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    const discussion = discussions[0];

    // Cek apakah user adalah author atau admin
    if (discussion.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this discussion'
      });
    }

    // Update discussion
    await pool.query(
      `UPDATE discussions 
       SET title = ?, content = ?, updated_at = NOW()
       WHERE id = ?`,
      [title, content, id]
    );

    // Get updated discussion
    const [updatedDiscussion] = await pool.query(
      `SELECT d.*, u.full_name as author_name, u.profile_picture, c.name as class_name
       FROM discussions d
       JOIN users u ON d.created_by = u.id
       JOIN classes c ON d.class_id = c.id
       WHERE d.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Discussion updated successfully',
      data: updatedDiscussion[0]
    });

  } catch (error) {
    console.error('Update discussion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update Reply
exports.updateReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Get reply
    const [replies] = await pool.query(
      'SELECT * FROM discussion_replies WHERE id = ?',
      [id]
    );

    if (replies.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found'
      });
    }

    const reply = replies[0];

    // Cek apakah user adalah author atau admin
    if (reply.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this reply'
      });
    }

    // Update reply
    await pool.query(
      `UPDATE discussion_replies 
       SET content = ?, updated_at = NOW()
       WHERE id = ?`,
      [content, id]
    );

    // Get updated reply
    const [updatedReply] = await pool.query(
      `SELECT dr.*, u.full_name as author_name, u.profile_picture
       FROM discussion_replies dr
       JOIN users u ON dr.user_id = u.id
       WHERE dr.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Reply updated successfully',
      data: updatedReply[0]
    });

  } catch (error) {
    console.error('Update reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== DELETE ====================

// Delete Discussion
exports.deleteDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get discussion
    const [discussions] = await pool.query(
      'SELECT * FROM discussions WHERE id = ?',
      [id]
    );

    if (discussions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    const discussion = discussions[0];

    // Cek authorization (author atau admin)
    if (discussion.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this discussion'
      });
    }

    // Delete replies dulu (karena foreign key)
    await pool.query('DELETE FROM discussion_replies WHERE discussion_id = ?', [id]);

    // Delete discussion
    await pool.query('DELETE FROM discussions WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Discussion deleted successfully'
    });

  } catch (error) {
    console.error('Delete discussion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete Reply
exports.deleteReply = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get reply
    const [replies] = await pool.query(
      'SELECT * FROM discussion_replies WHERE id = ?',
      [id]
    );

    if (replies.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found'
      });
    }

    const reply = replies[0];

    // Cek authorization
    if (reply.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this reply'
      });
    }

    // Delete child replies jika ada
    await pool.query('DELETE FROM discussion_replies WHERE parent_reply_id = ?', [id]);

    // Delete reply
    await pool.query('DELETE FROM discussion_replies WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Reply deleted successfully'
    });

  } catch (error) {
    console.error('Delete reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};