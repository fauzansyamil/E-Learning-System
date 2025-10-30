// src/controllers/userController.js
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// ==================== CREATE ====================

// Create New User (Admin only)
exports.createUser = async (req, res) => {
  try {
    const { 
      username, 
      email, 
      password_hash, 
      full_name, 
      role_id, 
      phone, 
      address,
      date_of_birth,
      gender,
      student_id,
      employee_id
    } = req.body;

    // Validasi input
    if (!username || !email || !password || !full_name || !role_id) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, password_hash, full name, and role are required'
      });
    }

    // Only admin can create users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can create users'
      });
    }

    // Cek apakah username atau email sudah ada
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password_hash, 10);

    // Handle profile picture upload
    let profile_picture = null;
    if (req.file) {
      profile_picture = `/uploads/profiles/${req.file.filename}`;
    }

    // Insert user
    const [result] = await pool.query(
      `INSERT INTO users
       (username, email, password_hash, full_name, role_id, phone, address, date_of_birth,
        gender, student_id, employee_id, profile_picture, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW(), NOW())`,
      [username, email, hashedPassword, full_name, role_id, phone, address,
       date_of_birth, gender, student_id, employee_id, profile_picture]
    );

    // Get created user (without password)
    const [user] = await pool.query(
      `SELECT u.id, u.username, u.email, u.full_name, u.phone, u.address, 
              u.date_of_birth, u.gender, u.student_id, u.employee_id, 
              u.profile_picture, u.is_active, r.id as role_id, r.name as role,
              u.created_at, u.updated_at
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user[0]
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== READ ====================

// Get All Users (dengan filter dan pagination)
exports.getAllUsers = async (req, res) => {
  try {
    const { 
      role, 
      status, 
      search,
      limit = 50, 
      offset = 0,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    // Only admin can get all users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    let query = `
      SELECT u.id, u.username, u.email, u.full_name, u.phone, u.address, 
             u.date_of_birth, u.gender, u.student_id, u.employee_id, 
             u.profile_picture, u.is_active, r.id as role_id, r.name as role,
             u.created_at, u.updated_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by role
    if (role) {
      query += ' AND r.name = ?';
      params.push(role);
    }

    // Filter by status
    if (status) {
      query += ' AND u.is_active = ?';
      params.push(status);
    }

    // Search by name, username, or email
    if (search) {
      query += ' AND (u.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Sorting
    const allowedSortFields = ['username', 'full_name', 'email', 'created_at', 'updated_at'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY u.${sortField} ${sortDirection}`;

    // Pagination
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [users] = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM users u JOIN roles r ON u.role_id = r.id WHERE 1=1';
    const countParams = [];

    if (role) {
      countQuery += ' AND r.name = ?';
      countParams.push(role);
    }
    if (status) {
      countQuery += ' AND u.is_active = ?';
      countParams.push(status);
    }
    if (search) {
      countQuery += ' AND (u.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: users,
      pagination: {
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        total_pages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get User by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;

    // User hanya bisa lihat profilenya sendiri, kecuali admin
    if (requesterRole !== 'admin' && parseInt(id) !== requesterId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const [users] = await pool.query(
      `SELECT u.id, u.username, u.email, u.full_name, u.phone, u.address, 
              u.date_of_birth, u.gender, u.student_id, u.employee_id, 
              u.profile_picture, u.is_active, r.id as role_id, r.name as role,
              u.created_at, u.updated_at
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Jika mahasiswa, tambahkan info kelas yang diikuti
    if (users[0].role === 'mahasiswa') {
      const [classes] = await pool.query(
        `SELECT c.id, c.code, c.name, c.semester, u.full_name as instructor_name
         FROM classes c
         JOIN class_enrollments ce ON c.id = ce.class_id
         JOIN users u ON c.instructor_id = u.id
         WHERE ce.student_id = ?`,
        [id]
      );
      users[0].enrolled_classes = classes;
    }

    // Jika dosen, tambahkan info kelas yang diajar
    if (users[0].role === 'dosen') {
      const [classes] = await pool.query(
        `SELECT c.id, c.code, c.name, c.semester,
                (SELECT COUNT(*) FROM class_enrollments WHERE class_id = c.id) as student_count
         FROM classes c
         WHERE c.instructor_id = ?`,
        [id]
      );
      users[0].teaching_classes = classes;
    }

    res.json({
      success: true,
      data: users[0]
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get Current User Profile
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await pool.query(
      `SELECT u.id, u.username, u.email, u.full_name, u.phone, u.address, 
              u.date_of_birth, u.gender, u.student_id, u.employee_id, 
              u.profile_picture, u.is_active, r.id as role_id, r.name as role,
              u.created_at, u.updated_at
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== UPDATE ====================

// Update User
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;
    
    const { 
      email, 
      full_name, 
      phone, 
      address,
      date_of_birth,
      gender,
      student_id,
      employee_id,
      role_id,
      status
    } = req.body;

    // User hanya bisa update profilenya sendiri, kecuali admin
    if (requesterRole !== 'admin' && parseInt(id) !== requesterId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get current user data
    const [currentUser] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    
    if (currentUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Cek apakah email sudah digunakan user lain
    if (email && email !== currentUser[0].email) {
      const [existingEmail] = await pool.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );

      if (existingEmail.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Handle profile picture upload
    let profile_picture = currentUser[0].profile_picture;
    if (req.file) {
      // Delete old profile picture if exists
      if (currentUser[0].profile_picture) {
        const oldFilePath = path.join(__dirname, '../../public', currentUser[0].profile_picture);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      profile_picture = `/uploads/profiles/${req.file.filename}`;
    }

    // Build update query
    let updateFields = [];
    let updateValues = [];

    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (full_name) {
      updateFields.push('full_name = ?');
      updateValues.push(full_name);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(address);
    }
    if (date_of_birth !== undefined) {
      updateFields.push('date_of_birth = ?');
      updateValues.push(date_of_birth);
    }
    if (gender !== undefined) {
      updateFields.push('gender = ?');
      updateValues.push(gender);
    }
    if (student_id !== undefined) {
      updateFields.push('student_id = ?');
      updateValues.push(student_id);
    }
    if (employee_id !== undefined) {
      updateFields.push('employee_id = ?');
      updateValues.push(employee_id);
    }

    // Only admin can change role and status
    if (requesterRole === 'admin') {
      if (role_id !== undefined) {
        updateFields.push('role_id = ?');
        updateValues.push(role_id);
      }
      if (status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(status);
      }
    }

    if (profile_picture !== currentUser[0].profile_picture) {
      updateFields.push('profile_picture = ?');
      updateValues.push(profile_picture);
    }

    updateFields.push('updated_at = NOW()');

    if (updateFields.length === 1) { // Hanya updated_at
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    // Update user
    updateValues.push(id);
    await pool.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Get updated user
    const [updatedUser] = await pool.query(
      `SELECT u.id, u.username, u.email, u.full_name, u.phone, u.address, 
              u.date_of_birth, u.gender, u.student_id, u.employee_id, 
              u.profile_picture, u.is_active, r.id as role_id, r.name as role,
              u.created_at, u.updated_at
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser[0]
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;
    const { old_password, new_password } = req.body;

    // Validasi input
    if (!new_password) {
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }

    // User hanya bisa change password sendiri, kecuali admin
    if (requesterRole !== 'admin' && parseInt(id) !== requesterId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get user
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Jika bukan admin, verify old password
    if (requesterRole !== 'admin') {
      if (!old_password) {
        return res.status(400).json({
          success: false,
          message: 'Old password is required'
        });
      }

      const validPassword = await bcrypt.compare(old_password, users[0].password_hash);

      if (!validPassword) {
        return res.status(400).json({
          success: false,
          message: 'Old password is incorrect'
        });
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, id]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== DELETE ====================

// Delete User (Admin only - Soft delete)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Only admin can delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can delete users'
      });
    }

    // Cek apakah user exist
    const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete - set status to inactive
    await pool.query(
      'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?',
      ['inactive', id]
    );

    res.json({
      success: true,
      message: 'User deleted successfully (soft delete)'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Permanent Delete User (Admin only - Hard delete)
exports.permanentDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Only admin can permanently delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can permanently delete users'
      });
    }

    // Get user info untuk delete profile picture
    const [users] = await pool.query('SELECT profile_picture FROM users WHERE id = ?', [id]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete profile picture if exists
    if (users[0].profile_picture) {
      const filePath = path.join(__dirname, '../../public', users[0].profile_picture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Hard delete user
    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'User permanently deleted'
    });

  } catch (error) {
    console.error('Permanent delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== ADDITIONAL FUNCTIONS ====================

// Get User Statistics (Admin only)
exports.getUserStats = async (req, res) => {
  try {
    // Only admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN r.name = 'admin' THEN 1 ELSE 0 END) as total_admin,
        SUM(CASE WHEN r.name = 'dosen' THEN 1 ELSE 0 END) as total_dosen,
        SUM(CASE WHEN r.name = 'mahasiswa' THEN 1 ELSE 0 END) as total_mahasiswa,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as total_active,
        SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as total_inactive
      FROM users u
      JOIN roles r ON u.role_id = r.id
    `);

    res.json({
      success: true,
      data: stats[0]
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = exports;