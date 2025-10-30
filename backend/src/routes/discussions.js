// src/routes/discussions.js
const express = require('express');
const router = express.Router();
const discussionController = require('../controllers/discussionController');
const { authenticateToken } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticateToken);

// All authenticated users can create and participate in discussions
router.get('/', discussionController.getAllDiscussions); // Get all discussions
router.get('/class/:classId', discussionController.getDiscussionsByClass);
router.get('/:id', discussionController.getDiscussionById);
router.post('/', discussionController.createDiscussion);
router.post('/:discussion_id/reply', discussionController.createReply); // Fixed: use discussion_id to match controller

module.exports = router;