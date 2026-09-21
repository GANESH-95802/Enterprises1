const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
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
  company: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'lead'],
    default: 'active',
  },
  totalPurchases: {
    type: Number,
    default: 0,
  },
  lastPurchaseDate: {
    type: Date,
  },
  tags: [String],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Customer', customerSchema);