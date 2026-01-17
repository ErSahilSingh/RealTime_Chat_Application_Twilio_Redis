const Group = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');

/**
 * @route   POST /api/groups
 * @desc    Create a new group
 * @access  Private
 */
exports.createGroup = async (req, res, next) => {
  try {
    const { name, description, members } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required'
      });
    }

    const group = await Group.create({
      name,
      description,
      createdBy: req.user._id,
      members: [...new Set([req.user._id.toString(), ...(members || [])])], // Include creator
      admins: [req.user._id]
    });

    await group.populate('members', 'name avatar');
    await group.populate('admins', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/groups
 * @desc    Get all groups user is part of
 * @access  Private
 */
exports.getUserGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({
      members: req.user._id
    })
      .populate('members', 'name avatar')
      .populate('admins', 'name avatar')
      .populate('createdBy', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      groups
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/groups/:id
 * @desc    Get group details
 * @access  Private
 */
exports.getGroupById = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'name avatar mobileNumber')
      .populate('admins', 'name avatar')
      .populate('createdBy', 'name avatar');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is a member
    if (!group.members.some(m => m._id.toString() === req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    res.json({
      success: true,
      group
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/groups/:id
 * @desc    Update group details (admins only)
 * @access  Private
 */
exports.updateGroup = async (req, res, next) => {
  try {
    const { name, description, avatar } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is admin
    if (!group.admins.some(a => a.toString() === req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update group details'
      });
    }

    if (name) group.name = name;
    if (description) group.description = description;
    if (avatar) group.avatar = avatar;

    await group.save();

    res.json({
      success: true,
      message: 'Group updated successfully',
      group
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/groups/:id
 * @desc    Delete group (creator only)
 * @access  Private
 */
exports.deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the group creator can delete the group'
      });
    }

    await group.deleteOne();
    await GroupMessage.deleteMany({ groupId: group._id });

    res.json({
      success: true,
      message: 'Group deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/groups/:id/members
 * @desc    Add members to group (admins only)
 * @access  Private
 */
exports.addMembers = async (req, res, next) => {
  try {
    const { members } = req.body; // Array of user IDs

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of user IDs'
      });
    }

    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is admin
    if (!group.admins.some(a => a.toString() === req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can add members'
      });
    }

    // Add new members (avoid duplicates)
    members.forEach(memberId => {
      if (!group.members.includes(memberId)) {
        group.members.push(memberId);
      }
    });

    await group.save();
    await group.populate('members', 'name avatar');

    res.json({
      success: true,
      message: 'Members added successfully',
      group
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/groups/:id/members/:userId
 * @desc    Remove member from group (admins only)
 * @access  Private
 */
exports.removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is admin
    if (!group.admins.some(a => a.toString() === req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can remove members'
      });
    }

    // Cannot remove creator
    if (group.createdBy.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove group creator'
      });
    }

    group.members = group.members.filter(m => m.toString() !== userId);
    group.admins = group.admins.filter(a => a.toString() !== userId);

    await group.save();

    res.json({
      success: true,
      message: 'Member removed successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/groups/:id/leave
 * @desc    Leave group
 * @access  Private
 */
exports.leaveGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Creator cannot leave, must delete group instead
    if (group.createdBy.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Group creator cannot leave. Delete the group instead.'
      });
    }

    group.members = group.members.filter(m => m.toString() !== req.user._id.toString());
    group.admins = group.admins.filter(a => a.toString() !== req.user._id.toString());

    await group.save();

    res.json({
      success: true,
      message: 'Left group successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/groups/:id/messages
 * @desc    Get group messages
 * @access  Private
 */
exports.getGroupMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is member
    const group = await Group.findById(id);
    if (!group || !group.members.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these messages'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await GroupMessage.find({ groupId: id })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('from', 'name avatar');

    res.json({
      success: true,
      messages: messages.reverse(),
      page: parseInt(page),
      hasMore: messages.length === parseInt(limit)
    });

  } catch (error) {
    next(error);
  }
};
