const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  avatar: {
    type: String,
    default: 'https://ui-avatars.com/api/?background=random&name=Group',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure creator is both member and admin
groupSchema.pre('save', function(next) {
  if (this.isNew) {
    if (!this.members.includes(this.createdBy)) {
      this.members.push(this.createdBy);
    }
    if (!this.admins.includes(this.createdBy)) {
      this.admins.push(this.createdBy);
    }
  }
  next();
});

module.exports = mongoose.model('Group', groupSchema);
