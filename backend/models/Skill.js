const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    enum: ['technical', 'soft', 'management', 'creative', 'language', 'other'],
    default: 'technical',
  },
  proficiencyLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate',
  },
  yearsOfExperience: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
    default: '',
  },
  endorsements: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      comment: String,
      date: { type: Date, default: Date.now },
    },
  ],
  certifications: [
    {
      name: String,
      issuer: String,
      dateObtained: Date,
      expiryDate: Date,
      credentialUrl: String,
    },
  ],
  isVerified: {
    type: Boolean,
    default: false,
  },
  tags: [String],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Skill', skillSchema);