// src/controllers/materialController.js
const { pool } = require('../config/database');

// Get Materials by Class
exports.getMaterialsByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const [materials] = await pool.query(
      `SELECT m.*, u.full_name as created_by_name
       FROM materials m
       JOIN users u ON m.created_by = u.id
       WHERE m.class_id = ?
       ORDER BY m.order_number, m.created_at`,
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
      message: 'Server error' 
    });
  }
};

// Get Material by ID
exports.getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;

    const [materials] = await pool.query(
      `SELECT m.*, u.full_name as created_by_name, c.name as class_name
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

    res.json({
      success: true,
      data: materials[0]
    });
  } catch (error) {
    console.error('Get material detail error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Create Material
exports.createMaterial = async (req, res) => {
  try {
    const { class_id, title, description, type, file_url, order_number } = req.body;
    const { id: userId } = req.user;

    if (!class_id || !title || !type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }

    const [result] = await pool.query(
      `INSERT INTO materials (class_id, created_by, title, description, type, file_url, order_number) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [class_id, userId, title, description, type, file_url, order_number || 0]
    );

    // Create notifications untuk semua mahasiswa di kelas ini
    const [students] = await pool.query(
      'SELECT student_id FROM class_enrollments WHERE class_id = ?',
      [class_id]
    );

    for (let student of students) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, link) 
         VALUES (?, 'material', ?, ?, ?)`,
        [
          student.student_id,
          'Materi Baru',
          `Materi baru "${title}" telah ditambahkan`,
          `/materials/${result.insertId}`
        ]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Material created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Update Material
exports.updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, file_url, order_number } = req.body;

    const [materials] = await pool.query('SELECT * FROM materials WHERE id = ?', [id]);
    
    if (materials.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Material not found' 
      });
    }

    await pool.query(
      `UPDATE materials 
       SET title = COALESCE(?, title), 
           description = COALESCE(?, description),
           type = COALESCE(?, type),
           file_url = COALESCE(?, file_url),
           order_number = COALESCE(?, order_number)
       WHERE id = ?`,
      [title, description, type, file_url, order_number, id]
    );

    res.json({
      success: true,
      message: 'Material updated successfully'
    });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Delete Material
exports.deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    const [materials] = await pool.query('SELECT id FROM materials WHERE id = ?', [id]);
    
    if (materials.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Material not found' 
      });
    }

    await pool.query('DELETE FROM materials WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};