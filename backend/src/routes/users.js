// src/routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Admin only routes
router.get('/', authorizeRoles('admin'), userController.getAllUsers);
router.delete('/:id', authorizeRoles('admin'), userController.deleteUser);

// All authenticated users can view and update their own profile
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);

module.exports = router;