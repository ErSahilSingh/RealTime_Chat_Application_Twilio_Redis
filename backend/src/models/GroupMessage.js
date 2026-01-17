const mongoose = require('mongoose');

const groupMessageSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true,
  },
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
});

// Compound index for efficient group message queries
groupMessageSchema.index({ groupId: 1, timestamp: -1 });

module.exports = mongoose.model('GroupMessage', groupMessageSchema);
