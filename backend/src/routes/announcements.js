// backend/src/routes/announcements.js
const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authenticateToken, authorize } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticateToken);

// ==================== Announcement CRUD ====================

// CREATE - Create new announcement (Dosen/Admin)
router.post('/',
  authorize(['admin', 'dosen']),
  announcementController.createAnnouncement
);

// READ - Get all announcements (filtered by user's access)
router.get('/',
  announcementController.getAllAnnouncements
);

// READ - Get announcements by class
router.get('/class/:classId',
  announcementController.getAnnouncementsByClass
);

// READ - Get announcement by ID
router.get('/:id',
  announcementController.getAnnouncementById
);

// UPDATE - Update announcement
router.put('/:id',
  authorize(['admin', 'dosen']),
  announcementController.updateAnnouncement
);

// DELETE - Delete announcement
router.delete('/:id',
  authorize(['admin', 'dosen']),
  announcementController.deleteAnnouncement
);

module.exports = router;
