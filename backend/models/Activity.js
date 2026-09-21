const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // Optional to allow logging failed login attempts (no user found)
    default: null,
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'login', 'logout', 'view', 'export', 'upload', 'download', 'share'],
  },
  resource: {
    type: String,
    required: true,
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  details: {
    type: String,
    default: '',
  },
  ip: {
    type: String,
    default: '',
  },
  userAgent: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ resource: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);