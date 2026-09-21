const mongoose = require('mongoose');

const constructionProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  location: {
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  status: {
    type: String,
    enum: ['planning', 'in-progress', 'on-hold', 'completed', 'cancelled'],
    default: 'planning',
  },
  startDate: {
    type: Date,
  },
  expectedEndDate: {
    type: Date,
  },
  actualEndDate: {
    type: Date,
  },
  budget: {
    estimated: { type: Number, default: 0 },
    actual: { type: Number, default: 0 },
  },
  description: {
    type: String,
    default: '',
  },
  milestones: [
    {
      title: String,
      description: String,
      dueDate: Date,
      completedDate: Date,
      status: { type: String, enum: ['pending', 'completed', 'overdue'], default: 'pending' },
    },
  ],
  teamMembers: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: String,
      hoursWorked: Number,
    },
  ],
  documents: [
    {
      title: String,
      url: String,
      type: { type: String, enum: ['blueprint', 'permit', 'contract', 'report', 'other'] },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
  ],
  riskAssessment: {
    level: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    notes: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ConstructionProject', constructionProjectSchema);