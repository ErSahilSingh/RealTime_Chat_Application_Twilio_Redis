const express = require('express');
const {
  getChatHistory,
  getUnreadCounts,
  markAsRead
} = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/:userId', getChatHistory);
router.get('/unread', getUnreadCounts);
router.put('/messages/:id/read', markAsRead);

module.exports = router;
