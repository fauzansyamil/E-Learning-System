// backend/src/controllers/moduleController.js
const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

// ==================== CREATE ====================

// Create new module
exports.createModule = async (req, res) => {
  try {
    const { class_id, title, description, content, duration_minutes, is_published } = req.body;
    const created_by = req.user.id;

    // Validation
    if (!class_id || !title) {
      return res.status(400).json({
        success: false,
        message: 'Class ID and title are required'
      });
    }

    // Check if user has permission (admin or instructor of the class)
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

    // Get next order number
    const [orderResult] = await pool.query(
      'SELECT COALESCE(MAX(module_order), -1) + 1 as next_order FROM modules WHERE class_id = ?',
      [class_id]
    );
    const module_order = orderResult[0].next_order;

    // Insert module
    const [result] = await pool.query(
      `INSERT INTO modules
       (class_id, title, description, content, module_order, duration_minutes, is_published, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [class_id, title, description, content, module_order, duration_minutes, is_published || false, created_by]
    );

    // Get created module
    const [module] = await pool.query(
      `SELECT m.*, u.full_name as author, c.name as class_name
       FROM modules m
       JOIN users u ON m.created_by = u.id
       JOIN classes c ON m.class_id = c.id
       WHERE m.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Module created successfully',
      data: module[0]
    });

  } catch (error) {
    console.error('Create module error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Add resource to module
exports.addModuleResource = async (req, res) => {
  try {
    const { module_id } = req.params;
    const { title, file_type, file_url, file_size } = req.body;

    // Validation
    if (!title || !file_type || !file_url) {
      return res.status(400).json({
        success: false,
        message: 'Title, file_type, and file_url are required'
      });
    }

    // Check if module exists and user has permission
    const [modules] = await pool.query(
      `SELECT m.*, c.instructor_id
       FROM modules m
       JOIN classes c ON m.class_id = c.id
       WHERE m.id = ?`,
      [module_id]
    );

    if (modules.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    if (req.user.role !== 'admin' && modules[0].instructor_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Insert resource
    const [result] = await pool.query(
      `INSERT INTO module_resources (module_id, title, file_type, file_url, file_size, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [module_id, title, file_type, file_url, file_size]
    );

    res.status(201).json({
      success: true,
      message: 'Resource added successfully',
      data: {
        id: result.insertId,
        module_id,
        title,
        file_type,
        file_url
      }
    });

  } catch (error) {
    console.error('Add resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== READ ====================

// Get all modules by class
exports.getModulesByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check access
    if (userRole === 'mahasiswa') {
      // Check if student is enrolled
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
      // Check if instructor
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

    // Get modules
    let query = `
      SELECT m.*, u.full_name as author,
             (SELECT COUNT(*) FROM module_resources WHERE module_id = m.id) as resource_count
      FROM modules m
      JOIN users u ON m.created_by = u.id
      WHERE m.class_id = ?
    `;

    // Students only see published modules
    if (userRole === 'mahasiswa') {
      query += ' AND m.is_published = TRUE';
    }

    query += ' ORDER BY m.module_order ASC';

    const [modules] = await pool.query(query, [classId]);

    // Get resources for each module
    for (let module of modules) {
      const [resources] = await pool.query(
        'SELECT * FROM module_resources WHERE module_id = ? ORDER BY created_at ASC',
        [module.id]
      );
      module.resources = resources;
    }

    res.json({
      success: true,
      data: modules
    });

  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get single module by ID
exports.getModuleById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get module with resources
    const [modules] = await pool.query(
      `SELECT m.*, u.full_name as author, c.name as class_name, c.instructor_id
       FROM modules m
       JOIN users u ON m.created_by = u.id
       JOIN classes c ON m.class_id = c.id
       WHERE m.id = ?`,
      [id]
    );

    if (modules.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    const module = modules[0];

    // Check access
    if (userRole === 'mahasiswa') {
      if (!module.is_published) {
        return res.status(403).json({
          success: false,
          message: 'This module is not published yet'
        });
      }

      // Check enrollment
      const [enrollment] = await pool.query(
        'SELECT id FROM class_enrollments WHERE class_id = ? AND student_id = ?',
        [module.class_id, userId]
      );

      if (enrollment.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You are not enrolled in this class'
        });
      }
    } else if (userRole === 'dosen' && module.instructor_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get resources
    const [resources] = await pool.query(
      'SELECT * FROM module_resources WHERE module_id = ? ORDER BY created_at ASC',
      [id]
    );
    module.resources = resources;

    res.json({
      success: true,
      data: module
    });

  } catch (error) {
    console.error('Get module error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== UPDATE ====================

// Update module
exports.updateModule = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, content, duration_minutes, is_published } = req.body;
    const userId = req.user.id;

    // Check if module exists and user has permission
    const [modules] = await pool.query(
      `SELECT m.*, c.instructor_id
       FROM modules m
       JOIN classes c ON m.class_id = c.id
       WHERE m.id = ?`,
      [id]
    );

    if (modules.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    if (req.user.role !== 'admin' && modules[0].instructor_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update module
    await pool.query(
      `UPDATE modules
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           content = COALESCE(?, content),
           duration_minutes = COALESCE(?, duration_minutes),
           is_published = COALESCE(?, is_published),
           updated_at = NOW()
       WHERE id = ?`,
      [title, description, content, duration_minutes, is_published, id]
    );

    // Get updated module
    const [updated] = await pool.query(
      `SELECT m.*, u.full_name as author, c.name as class_name
       FROM modules m
       JOIN users u ON m.created_by = u.id
       JOIN classes c ON m.class_id = c.id
       WHERE m.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Module updated successfully',
      data: updated[0]
    });

  } catch (error) {
    console.error('Update module error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Reorder modules
exports.reorderModules = async (req, res) => {
  try {
    const { class_id, module_orders } = req.body; // module_orders: [{id, order}, ...]
    const userId = req.user.id;

    // Check permission
    if (req.user.role !== 'admin') {
      const [classCheck] = await pool.query(
        'SELECT id FROM classes WHERE id = ? AND instructor_id = ?',
        [class_id, userId]
      );

      if (classCheck.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Update orders
    for (const item of module_orders) {
      await pool.query(
        'UPDATE modules SET module_order = ?, updated_at = NOW() WHERE id = ? AND class_id = ?',
        [item.order, item.id, class_id]
      );
    }

    res.json({
      success: true,
      message: 'Modules reordered successfully'
    });

  } catch (error) {
    console.error('Reorder modules error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== DELETE ====================

// Delete module
exports.deleteModule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if module exists and user has permission
    const [modules] = await pool.query(
      `SELECT m.*, c.instructor_id
       FROM modules m
       JOIN classes c ON m.class_id = c.id
       WHERE m.id = ?`,
      [id]
    );

    if (modules.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    if (req.user.role !== 'admin' && modules[0].instructor_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete module (resources will be deleted by CASCADE)
    await pool.query('DELETE FROM modules WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Module deleted successfully'
    });

  } catch (error) {
    console.error('Delete module error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete module resource
exports.deleteModuleResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const userId = req.user.id;

    // Check permission
    const [resources] = await pool.query(
      `SELECT mr.*, m.class_id, c.instructor_id
       FROM module_resources mr
       JOIN modules m ON mr.module_id = m.id
       JOIN classes c ON m.class_id = c.id
       WHERE mr.id = ?`,
      [resourceId]
    );

    if (resources.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    if (req.user.role !== 'admin' && resources[0].instructor_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete resource
    await pool.query('DELETE FROM module_resources WHERE id = ?', [resourceId]);

    res.json({
      success: true,
      message: 'Resource deleted successfully'
    });

  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = exports;
