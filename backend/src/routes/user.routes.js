const express = require('express');
const {
  getCurrentUser,
  updateProfile,
  searchUsers,
  getUserById
} = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/me', getCurrentUser);
router.put('/me', updateProfile);
router.get('/search', searchUsers);
router.get('/:id', getUserById);

module.exports = router;
