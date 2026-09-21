const mongoose = require('mongoose');

const aiCacheSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  provider: {
    type: String,
    enum: ['gemini', 'openai', 'mock', 'unknown'],
    default: 'unknown',
  },
  model: {
    type: String,
    default: '',
  },
  hits: {
    type: Number,
    default: 0,
  },
  tokensSaved: {
    type: Number,
    default: 0,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Indexes for efficient cache lookups
aiCacheSchema.index({ key: 1, user: 1 }, { unique: true });
aiCacheSchema.index({ user: 1, expiresAt: 1 });

// TTL index for automatic cache expiration (also covers expiresAt lookups)
aiCacheSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

// Increment hit counter when cache is accessed
aiCacheSchema.methods.recordHit = async function (tokensSaved = 0) {
  this.hits += 1;
  this.tokensSaved += tokensSaved;
  await this.save();
};

module.exports = mongoose.model('AiCache', aiCacheSchema);