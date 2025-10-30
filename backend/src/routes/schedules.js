// backend/src/routes/schedules.js
const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticateToken, authorize } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticateToken);

// ==================== Schedule CRUD ====================

// CREATE - Create new schedule (Dosen/Admin only)
router.post('/',
  authorize(['admin', 'dosen']),
  scheduleController.createSchedule
);

// READ - Get user's weekly schedule (all enrolled classes)
router.get('/my-schedule',
  scheduleController.getMyWeeklySchedule
);

// READ - Get schedules by class
router.get('/class/:classId',
  scheduleController.getSchedulesByClass
);

// READ - Get schedule by ID
router.get('/:id',
  scheduleController.getScheduleById
);

// UPDATE - Update schedule
router.put('/:id',
  authorize(['admin', 'dosen']),
  scheduleController.updateSchedule
);

// DELETE - Delete schedule
router.delete('/:id',
  authorize(['admin', 'dosen']),
  scheduleController.deleteSchedule
);

module.exports = router;
