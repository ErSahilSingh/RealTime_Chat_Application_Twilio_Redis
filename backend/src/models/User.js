const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  mobileNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^\+?[1-9]\d{1,14}$/, // E.164 format
  },
  name: {
    type: String,
    default: 'User',
    trim: true,
  },
  avatar: {
    type: String,
    default: 'https://ui-avatars.com/api/?background=random&name=User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for efficient queries
userSchema.index({ mobileNumber: 1 });

// Update lastSeen before saving
userSchema.pre('save', function(next) {
  this.lastSeen = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);
