const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { validateEnv } = require('./config/env');
const { sanitizeBody, sanitizeQuery, sanitizeParams } = require('./utils/security');
const { initializeAI } = require('./services/aiService');
const { ensureIndexes } = require('./config/indexes');
const { initializeOpenAI } = require('./services/ai/openaiService');
const orchestrator = require('./services/ai/orchestrator');
const { assistantEngine, recommendationEngine, documentIntelligenceEngine, analyticsEngine } = require('./services/ai/engines');
const agentManager = require('./services/ai/agents');

// Load env vars from backend/.env
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Validate environment BEFORE any connections or services start
// Fails fast on missing critical configuration
validateEnv();

// Connect to MongoDB
connectDB();

// Initialize indexes after connection
setTimeout(async () => {
  await ensureIndexes();
}, 2000);

// Initialize AI
initializeAI();
initializeOpenAI();
orchestrator.initialize();
assistantEngine.initialize();
recommendationEngine.initialize();
documentIntelligenceEngine.initialize();
analyticsEngine.initialize();
agentManager.initialize();

const app = express();

// Security middleware
app.use(helmet());

// Secure CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // Preflight cache: 24 hours
};
app.use(cors(corsOptions));

// Input sanitization — applied BEFORE body parsing to strip NoSQL operators
// and XSS payloads from all incoming requests
app.use(sanitizeQuery);
app.use(sanitizeParams);

// Body parsing with restricted size (10MB) to prevent payload-based DoS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize request bodies AFTER parsing
app.use(sanitizeBody);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Rate Limiting ─────────────────────────────────────────────────────────
// Auth-specific limiters MUST be registered BEFORE the global limiter
// so the more restrictive rules take precedence.

// Login limiter: 5 attempts per minute per IP
// Prevents brute-force attacks on credentials
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many login attempts, please try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Registration limiter: 3 accounts per hour per IP
// Prevents mass account creation abuse
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many registration attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI endpoint limiter: 30 requests per minute per user
// Prevents AI API abuse and excessive LLM costs
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many AI requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply auth-specific limiters BEFORE global limiter
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/ai', aiLimiter);
app.use('/api/chatbot', aiLimiter);
app.use('/api/knowledge', aiLimiter);
app.use('/api/document-intelligence', aiLimiter);
app.use('/api/analytics', aiLimiter);

// Global limiter: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/businesses', require('./routes/businesses'));
app.use('/api/products', require('./routes/products'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/compliance', require('./routes/compliance'));
app.use('/api/construction-projects', require('./routes/constructionProjects'));
app.use('/api/healthcare-records', require('./routes/healthcareRecords'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/assistant', require('./routes/assistant'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/enterprise', require('./routes/enterprise'));
app.use('/api/knowledge', require('./routes/knowledge'));
app.use('/api/recommendations', require('./routes/recommendation'));
app.use('/api/document-intelligence', require('./routes/documentIntelligence'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/monitoring', require('./routes/monitoring'));
app.use('/api/agents', require('./routes/agents'));
app.use('/api/saas', require('./routes/saas'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'AI Enterprise Hub API is running', timestamp: new Date().toISOString() });
});

// 404 handler for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});