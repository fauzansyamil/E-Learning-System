// src/controllers/materialController.js
const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

// ==================== CREATE ====================

// Create New Material (Dosen/Admin only)
exports.createMaterial = async (req, res) => {
  try {
    const { class_id, title, description, type, content, order_number } = req.body;
    const created_by = req.user.id;

    // Validasi input
    if (!class_id || !title || !type) {
      return res.status(400).json({
        success: false,
        message: 'Class ID, title, and type are required'
      });
    }

    // Cek apakah user adalah dosen dari kelas ini atau admin
    if (req.user.role !== 'admin') {
      const [classCheck] = await pool.query(
        'SELECT id FROM classes WHERE id = ? AND instructor_id = ?',
        [class_id, created_by]
      );

      if (classCheck.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to add materials to this class'
        });
      }
    }

    // Handle file upload jika ada
    let file_path = null;
    if (req.file) {
      file_path = `/uploads/materials/${req.file.filename}`;
    }

    // Insert material ke database
    const [result] = await pool.query(
      `INSERT INTO materials 
       (class_id, title, description, type, content, file_path, order_number, created_by, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [class_id, title, description, type, content, file_path, order_number || 0, created_by]
    );

    // Get created material
    const [material] = await pool.query(
      `SELECT m.*, u.full_name as created_by_name, c.name as class_name
       FROM materials m
       JOIN users u ON m.created_by = u.id
       JOIN classes c ON m.class_id = c.id
       WHERE m.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Material created successfully',
      data: material[0]
    });

  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== READ ====================

// Get All Materials by Class
exports.getMaterialsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Cek apakah user memiliki akses ke kelas ini
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

    // Get materials
    const [materials] = await pool.query(
      `SELECT m.*, u.full_name as created_by_name
       FROM materials m
       JOIN users u ON m.created_by = u.id
       WHERE m.class_id = ?
       ORDER BY m.order_number ASC, m.created_at DESC`,
      [classId]
    );

    res.json({
      success: true,
      data: materials
    });

  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get Material by ID (Detail)
exports.getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const [materials] = await pool.query(
      `SELECT m.*, u.full_name as created_by_name, c.name as class_name, c.instructor_id
       FROM materials m
       JOIN users u ON m.created_by = u.id
       JOIN classes c ON m.class_id = c.id
       WHERE m.id = ?`,
      [id]
    );

    if (materials.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    const material = materials[0];

    // Cek akses user
    if (userRole === 'mahasiswa') {
      const [enrollment] = await pool.query(
        'SELECT id FROM class_enrollments WHERE class_id = ? AND student_id = ?',
        [material.class_id, userId]
      );

      if (enrollment.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You are not enrolled in this class'
        });
      }
    } else if (userRole === 'dosen' && material.instructor_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: material
    });

  } catch (error) {
    console.error('Get material detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== UPDATE ====================

// Update Material (Dosen/Admin only)
exports.updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, content, order_number } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get material info
    const [materials] = await pool.query(
      'SELECT m.*, c.instructor_id FROM materials m JOIN classes c ON m.class_id = c.id WHERE m.id = ?',
      [id]
    );

    if (materials.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    const material = materials[0];

    // Cek authorization
    if (userRole !== 'admin' && material.instructor_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this material'
      });
    }

    // Handle file upload jika ada file baru
    let file_path = material.file_path;
    if (req.file) {
      // Hapus file lama jika ada
      if (material.file_path) {
        const oldFilePath = path.join(__dirname, '../../public', material.file_path);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      file_path = `/uploads/materials/${req.file.filename}`;
    }

    // Update material
    await pool.query(
      `UPDATE materials 
       SET title = ?, description = ?, type = ?, content = ?, file_path = ?, order_number = ?, updated_at = NOW()
       WHERE id = ?`,
      [title, description, type, content, file_path, order_number, id]
    );

    // Get updated material
    const [updatedMaterial] = await pool.query(
      `SELECT m.*, u.full_name as created_by_name, c.name as class_name
       FROM materials m
       JOIN users u ON m.created_by = u.id
       JOIN classes c ON m.class_id = c.id
       WHERE m.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Material updated successfully',
      data: updatedMaterial[0]
    });

  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== DELETE ====================

// Delete Material (Dosen/Admin only)
exports.deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get material info
    const [materials] = await pool.query(
      'SELECT m.*, c.instructor_id FROM materials m JOIN classes c ON m.class_id = c.id WHERE m.id = ?',
      [id]
    );

    if (materials.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    const material = materials[0];

    // Cek authorization
    if (userRole !== 'admin' && material.instructor_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this material'
      });
    }

    // Hapus file jika ada
    if (material.file_path) {
      const filePath = path.join(__dirname, '../../public', material.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete material dari database
    await pool.query('DELETE FROM materials WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Material deleted successfully'
    });

  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== ADDITIONAL FUNCTIONS ====================

// Reorder Materials
exports.reorderMaterials = async (req, res) => {
  try {
    const { materials } = req.body; // Array of {id, order_number}

    if (!Array.isArray(materials) || materials.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Materials array is required'
      });
    }

    // Update order untuk setiap material
    for (const material of materials) {
      await pool.query(
        'UPDATE materials SET order_number = ? WHERE id = ?',
        [material.order_number, material.id]
      );
    }

    res.json({
      success: true,
      message: 'Materials reordered successfully'
    });

  } catch (error) {
    console.error('Reorder materials error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = exports;