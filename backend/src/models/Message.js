const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
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
  delivered: {
    type: Boolean,
    default: false,
  },
  read: {
    type: Boolean,
    default: false,
    index: true,
  },
  readAt: {
    type: Date,
  },
});

// Compound indexes for efficient chat history queries
messageSchema.index({ from: 1, to: 1, timestamp: -1 });
messageSchema.index({ to: 1, read: 1 }); // For unread message queries

module.exports = mongoose.model('Message', messageSchema);
