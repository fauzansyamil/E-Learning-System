// src/routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorize } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');

// Setup multer for profile picture upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/profiles/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (JPEG, JPG, PNG, GIF)'));
    }
  }
});

// CREATE - Create new user (Admin only)
router.post('/', 
  authenticateToken, 
  authorize(['admin']), 
  upload.single('profile_picture'),
  userController.createUser
);

// READ - Get current user profile
router.get('/me', 
  authenticateToken, 
  userController.getCurrentUser
);

// READ - Get user statistics (Admin only)
router.get('/stats', 
  authenticateToken, 
  authorize(['admin']), 
  userController.getUserStats
);

// READ - Get all users (Admin only with filters)
router.get('/', 
  authenticateToken, 
  authorize(['admin']), 
  userController.getAllUsers
);

// READ - Get user by ID
router.get('/:id', 
  authenticateToken, 
  userController.getUserById
);

// UPDATE - Update user
router.put('/:id', 
  authenticateToken, 
  upload.single('profile_picture'),
  userController.updateUser
);

// UPDATE - Change password
router.put('/:id/change-password', 
  authenticateToken, 
  userController.changePassword
);

// DELETE - Soft delete user (Admin only)
router.delete('/:id', 
  authenticateToken, 
  authorize(['admin']), 
  userController.deleteUser
);

// DELETE - Permanent delete user (Admin only)
router.delete('/:id/permanent', 
  authenticateToken, 
  authorize(['admin']), 
  userController.permanentDeleteUser
);

module.exports = router;