const express = require('express');
const {
  createGroup,
  getUserGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMembers,
  removeMember,
  leaveGroup,
  getGroupMessages
} = require('../controllers/group.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/', createGroup);
router.get('/', getUserGroups);
router.get('/:id', getGroupById);
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);
router.post('/:id/members', addMembers);
router.delete('/:id/members/:userId', removeMember);
router.post('/:id/leave', leaveGroup);
router.get('/:id/messages', getGroupMessages);

module.exports = router;
