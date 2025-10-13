// src/controllers/discussionController.js
const { pool } = require('../config/database');

// Get Discussions by Class
exports.getDiscussionsByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const [discussions] = await pool.query(
      `SELECT d.*, u.full_name as created_by_name,
              (SELECT COUNT(*) FROM discussion_replies WHERE discussion_id = d.id) as reply_count
       FROM discussions d
       JOIN users u ON d.created_by = u.id
       WHERE d.class_id = ?
       ORDER BY d.created_at DESC`,
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
      message: 'Server error' 
    });
  }
};

// Get Discussion by ID (with replies)
exports.getDiscussionById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get discussion
    const [discussions] = await pool.query(
      `SELECT d.*, u.full_name as created_by_name, c.name as class_name
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

    // Get replies
    const [replies] = await pool.query(
      `SELECT dr.*, u.full_name as user_name
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
      message: 'Server error' 
    });
  }
};

// Create Discussion
exports.createDiscussion = async (req, res) => {
  try {
    const { class_id, title, content } = req.body;
    const { id: userId } = req.user;

    if (!class_id || !title || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }

    const [result] = await pool.query(
      `INSERT INTO discussions (class_id, created_by, title, content) 
       VALUES (?, ?, ?, ?)`,
      [class_id, userId, title, content]
    );

    // Create notifications untuk semua mahasiswa dan dosen di kelas ini
    const [classMembers] = await pool.query(
      `SELECT student_id as user_id FROM class_enrollments WHERE class_id = ?
       UNION
       SELECT instructor_id as user_id FROM classes WHERE id = ?`,
      [class_id, class_id]
    );

    for (let member of classMembers) {
      if (member.user_id !== userId) { // Jangan notif pembuat diskusi
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message, link) 
           VALUES (?, 'discussion', ?, ?, ?)`,
          [
            member.user_id,
            'Diskusi Baru',
            `Diskusi baru: "${title}"`,
            `/discussions/${result.insertId}`
          ]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Discussion created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Create discussion error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Reply to Discussion
exports.replyToDiscussion = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { content } = req.body;
    const { id: userId } = req.user;

    if (!content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Content is required' 
      });
    }

    // Cek apakah discussion ada
    const [discussions] = await pool.query(
      'SELECT * FROM discussions WHERE id = ?',
      [discussionId]
    );

    if (discussions.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Discussion not found' 
      });
    }

    const [result] = await pool.query(
      `INSERT INTO discussion_replies (discussion_id, user_id, content) 
       VALUES (?, ?, ?)`,
      [discussionId, userId, content]
    );

    // Notify discussion creator (if not replying to own discussion)
    const discussion = discussions[0];
    if (discussion.created_by !== userId) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, link) 
         VALUES (?, 'discussion', ?, ?, ?)`,
        [
          discussion.created_by,
          'Balasan Baru',
          `Ada balasan baru di diskusi "${discussion.title}"`,
          `/discussions/${discussionId}`
        ]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Reply to discussion error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};