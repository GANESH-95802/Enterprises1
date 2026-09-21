const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    enum: ['retail', 'technology', 'healthcare', 'construction', 'finance', 'education', 'other'],
    default: 'other',
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    default: '',
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    country: { type: String, default: 'USA' },
  },
  website: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active',
  },
  employees: [
    {
      name: String,
      email: String,
      role: String,
      department: String,
    },
  ],
  revenue: {
    type: Number,
    default: 0,
  },
  foundedYear: {
    type: Number,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Business', businessSchema);