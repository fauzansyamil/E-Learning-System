// src/routes/materials.js
const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { authenticateToken, authorize } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticateToken);

// Public routes (all authenticated users)
router.get('/class/:classId', materialController.getMaterialsByClass);
router.get('/:id', materialController.getMaterialById);

// Admin & Dosen only - FIXED: authorize expects an array
router.post('/', authorize(['admin', 'dosen']), materialController.createMaterial);
router.put('/:id', authorize(['admin', 'dosen']), materialController.updateMaterial);
router.delete('/:id', authorize(['admin', 'dosen']), materialController.deleteMaterial);

module.exports = router;