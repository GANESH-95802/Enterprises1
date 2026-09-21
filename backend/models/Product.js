const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  category: {
    type: String,
    enum: ['electronics', 'clothing', 'food', 'software', 'hardware', 'service', 'other'],
    default: 'other',
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },
  costPrice: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
    default: '',
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
  },
  stock: {
    type: Number,
    default: 0,
    min: 0,
  },
  unit: {
    type: String,
    default: 'pcs',
  },
  images: [String],
  isActive: {
    type: Boolean,
    default: true,
  },
  tags: [String],
  salesHistory: [
    {
      date: Date,
      quantity: Number,
      revenue: Number,
    },
  ],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);