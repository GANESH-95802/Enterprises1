const mongoose = require('mongoose');

/**
 * Invoice
 * Represents billing invoices for organization subscriptions.
 * Payment gateway ready architecture.
 */
const invoiceSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null,
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'paid', 'failed', 'void', 'refunded'],
    default: 'draft',
    index: true,
  },
  amount: {
    type: Number,
    required: true,
    default: 0,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    default: 0,
  },
  billingPeriod: {
    start: {
      type: Date,
      default: null,
    },
    end: {
      type: Date,
      default: null,
    },
  },
  items: [{
    description: {
      type: String,
      default: '',
    },
    quantity: {
      type: Number,
      default: 1,
    },
    unitPrice: {
      type: Number,
      default: 0,
    },
    amount: {
      type: Number,
      default: 0,
    },
  }],
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'bank', 'manual', 'none'],
    default: 'none',
  },
  paymentGateway: {
    type: String,
    default: '',
  },
  paymentReference: {
    type: String,
    default: '',
  },
  paidAt: {
    type: Date,
    default: null,
  },
  dueDate: {
    type: Date,
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Indexes for efficient invoice queries
invoiceSchema.index({ organizationId: 1, createdAt: -1 });
invoiceSchema.index({ status: 1, dueDate: 1 });
invoiceSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);