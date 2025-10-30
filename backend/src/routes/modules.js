// backend/src/routes/modules.js
const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const { authenticateToken, authorize } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticateToken);

// ==================== Module CRUD ====================

// CREATE - Create new module (Dosen/Admin only)
router.post('/',
  authorize(['admin', 'dosen']),
  moduleController.createModule
);

// CREATE - Add resource to module
router.post('/:module_id/resources',
  authorize(['admin', 'dosen']),
  moduleController.addModuleResource
);

// READ - Get modules by class
router.get('/class/:classId',
  moduleController.getModulesByClass
);

// READ - Get module by ID
router.get('/:id',
  moduleController.getModuleById
);

// UPDATE - Update module
router.put('/:id',
  authorize(['admin', 'dosen']),
  moduleController.updateModule
);

// UPDATE - Reorder modules
router.put('/class/:classId/reorder',
  authorize(['admin', 'dosen']),
  moduleController.reorderModules
);

// DELETE - Delete module
router.delete('/:id',
  authorize(['admin', 'dosen']),
  moduleController.deleteModule
);

// DELETE - Delete module resource
router.delete('/resources/:resourceId',
  authorize(['admin', 'dosen']),
  moduleController.deleteModuleResource
);

module.exports = router;
