# AI Enterprise Hub — Implementation Blueprint: Phase 0 & Phase 1

> **Document Version:** 1.0  
> **Status:** Implementation Blueprint — Ready for Execution  
> **Based On:** FINAL-DEVELOPMENT-ROADMAP.md, Codebase Analysis Complete  
> **Strategy:** Incremental enhancement — No redesign, no architecture changes

---

## TABLE OF CONTENTS

1. [Current Codebase Assessment](#1-current-codebase-assessment)
2. [PHASE 0: Security Implementation](#2-phase-0-security-implementation)
3. [PHASE 1: AI Core Implementation](#3-phase-1-ai-core-implementation)
4. [Development Order & Dependencies](#4-development-order--dependencies)
5. [Checklists](#5-checklists)

---

## 1. CURRENT CODEBASE ASSESSMENT

### 1.1 What Works (No Changes Needed)

| Component | Status | Evidence |
|-----------|--------|----------|
| Express server with route registration | ✅ Production-ready | `server.js` — clean, modular |
| MongoDB models (10 entities) | ✅ Production-ready | All models have proper schemas, indexes, timestamps |
| CRUD controllers + routes | ✅ Production-ready | Generic pattern via `crudController.js` |
| Activity tracking service | ✅ Production-ready | `activityService.js` — logs all user actions |
| Notification service | ✅ Production-ready | `notificationService.js` — full CRUD |
| Enterprise controller/routes | ✅ Production-ready | Activities, notifications, analytics |
| Helmet security headers | ✅ Production-ready | `app.use(helmet())` in server.js |
| JWT authentication flow | ✅ Functional | Login/register/profile working |
| Role-based authorization | ✅ Functional | `authorize()` middleware working |
| Dashboard controller/routes | ✅ Production-ready | Stats + charts endpoints |
| Frontend API service layer | ✅ Production-ready | `api.js` with interceptors, error handling |

### 1.2 What Needs Enhancement (Additive Changes)

| Component | Current State | Target State | Change Type |
|-----------|---------------|--------------|-------------|
| `aiService.js` | Monolithic Gemini wrapper | Orchestrator entry point | Refactor + add routing |
| `openaiService.js` | Direct OpenAI calls | Client pattern with fallback | Refactor |
| `chatbotService.js` | Basic LLM call | Full pipeline (NLP → Memory → Context → Answer) | Enhance |
| `aiController.js` | Direct service calls | Routes through orchestrator | Refactor |
| `chatbotController.js` | Basic message/report/insights | Full conversation management | Enhance |
| `AIInsights.jsx` | Feature card grid | Assistant query interface + widgets | Enhance |
| `auth.js` middleware | Basic JWT verify | Token hardening + refresh + blacklist | Enhance |
| `validators/auth.js` | Password: upper+lower+number | Add special character requirement | Enhance |
| `errorHandler.js` | May leak stack traces | Production-safe sanitization | Enhance |
| `server.js` | Global rate limit, open CORS | Auth-specific limits, restricted CORS | Enhance |
| `config/indexes.js` | Existing model indexes | Add AI collection indexes | Expand |
| `.env` | Uses `:` instead of `=` | Fix syntax + add validation | Fix + enhance |

### 1.3 Critical Bug Found

**File:** `backend/.env`  
**Issue:** Uses `:` instead of `=` for variable assignment  
**Example:** `MONGO_URI: mongodb://...` should be `MONGO_URI=mongodb://...`  
**Impact:** `dotenv` may not parse correctly. This must be fixed before any other work.

---

## 2. PHASE 0: SECURITY IMPLEMENTATION

### 2.1 Required Backend Changes — Complete File Map

#### P0-1: Password Policy Enforcement

**Files to modify:**
- `backend/validators/auth.js` — Add special character requirement to password validation

**Current code (line 15-16):**
```javascript
body('password')
  .notEmpty().withMessage('Password is required')
  .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
```

**Change required:**
1. Change `min: 6` to `min: 8`
2. Add special character requirement: `(?=.*[!@#$%^&*])`
3. Update error message to list all requirements

**Why required:** Weak passwords are the #1 attack vector. Current validation allows `Password1` which is trivially brute-forced. NIST and OWASP both recommend minimum 8 characters with complexity requirements.

**Risk if ignored:** Account takeover via credential stuffing. Users reuse passwords from other services. A breach of any other service exposes this system.

---

#### P0-2: Rate Limiting on Auth Routes

**Files to modify:**
- `backend/server.js` — Add auth-specific rate limiters

**Current code (lines 42-48):**
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);
```

**Change required:**
1. Add `authLimiter`: 5 requests per minute per IP on `/api/auth/login`
2. Add `registerLimiter`: 3 requests per hour per IP on `/api/auth/register`
3. Keep global limiter at 100/15min for other routes
4. Apply auth-specific limiters BEFORE the global limiter

**Why required:** Global 100/15min allows 400 login attempts per hour. With a common password list of 1000 passwords, an attacker can try 400 per hour and succeed within hours. 5/min limits to 300/hour, and 3/hour for registration prevents account creation abuse.

**Risk if ignored:** Brute force attack success within hours. Account enumeration via timing differences. Mass account creation for spam/phishing.

---

#### P0-3: JWT Token Hardening

**Files to modify:**
- `backend/middleware/auth.js` — Add token expiration, refresh rotation, blacklisting
- `backend/controllers/authController.js` — Add refresh token logic, token blacklist on logout
- `backend/routes/auth.js` — Add logout route
- `backend/models/User.js` — Add `refreshToken` field (optional, or use separate store)
- `backend/utils/helpers.js` — Already has `generateRefreshToken` function (line 9-11)

**Current auth.js (lines 1-38):**
- Single JWT verify with no expiration check (expiration is in the token itself but not enforced in middleware)
- No refresh token mechanism
- No token blacklisting on logout
- Token expires in 30 days (authController.js line 6)

**Change required:**
1. **Access token:** Change expiry from `30d` to `15min` in `authController.js`
2. **Refresh token:** Use existing `generateRefreshToken` from `helpers.js` (7d expiry)
3. **Token blacklist:** Add in-memory Set or Redis set for blacklisted tokens
4. **Logout endpoint:** `POST /api/auth/logout` — add token to blacklist
5. **Auth middleware:** Check blacklist before verifying
6. **Refresh endpoint:** `POST /api/auth/refresh` — validate refresh token, issue new access token

**Why required:** 30-day tokens mean a stolen token gives attacker 30 days of access. 15-minute access tokens limit damage window. Refresh tokens with rotation prevent replay attacks. Blacklisting ensures logout is meaningful.

**Risk if ignored:** Stolen JWT token grants unlimited access for 30 days. No way to revoke access. Logout is cosmetic only — token still works.

---

#### P0-4: Input Sanitization & Validation

**Files to modify:**
- `backend/middleware/validate.js` — Add MongoDB injection prevention, XSS sanitization
- `backend/validators/generic.js` — Add strict schema validation patterns
- `backend/validators/auth.js` — Already has basic validation, enhance with sanitization

**Current validate.js (lines 1-17):**
- Only checks `validationResult` from express-validator
- No sanitization of inputs
- No MongoDB injection prevention

**Change required:**
1. **Add sanitization middleware** that runs AFTER validation:
   - Strip `$` prefixed keys from objects (prevents MongoDB injection: `$where`, `$regex`, `$ne`, etc.)
   - Strip `.` from keys (prevents MongoDB dotted-key injection)
   - HTML-encode string inputs (prevents XSS)
   - Remove null bytes, control characters
2. **Add schema validation** to all generic validators:
   - Field type enforcement (string, number, etc.)
   - Max length limits on all string fields
   - Enum validation where applicable

**Why required:** MongoDB injection via `$where`, `$regex`, or `$ne` operators can bypass authentication, extract data, or execute arbitrary JavaScript. XSS in stored data can compromise other users' sessions.

**Risk if ignored:** Attacker sends `{ "email": { "$gt": "" }, "password": { "$ne": "" } }` to login endpoint → bypasses authentication entirely. Stored XSS in business names or product descriptions compromises admin sessions.

---

#### P0-5: CORS Configuration

**Files to modify:**
- `backend/server.js` — Restrict CORS to specific origins

**Current code (line 33):**
```javascript
app.use(cors());
```

**Change required:**
```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',') 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
```

**Why required:** Open CORS allows any website to make authenticated requests to the API. If a user visits a malicious site while logged in, that site can make API calls on their behalf (CSRF-like attack via CORS).

**Risk if ignored:** Cross-origin data theft. Malicious site reads user data via authenticated API calls. Session hijacking via CORS-based attacks.

---

#### P0-6: Environment Variable Validation

**Files to modify:**
- `backend/server.js` — Add startup validation for required env vars
- `backend/.env` — Fix `:` to `=` syntax

**Current .env file:**
```
MONGO_URI: mongodb://...  ← BUG: uses colon instead of equals
JWT_SECRET=your_jwt_secret_key_change_this
GEMINI_API_KEY=AQ.Ab8RN6IpDNNwSMXR6JHdUq0IAVMIToTOtAE4FmBKyA0bPc2DnQ
OPENAI_API_KEY=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
PORT=5000
NODE_ENV=development
```

**Change required:**
1. Fix `MONGO_URI:` to `MONGO_URI=` in `.env`
2. Add validation function in `server.js`:
```javascript
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'NODE_ENV'];
const missing = requiredEnvVars.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}
```
3. Add warnings for optional but recommended vars: `GEMINI_API_KEY`, `OPENAI_API_KEY`

**Why required:** Missing env vars cause cryptic runtime errors. `MONGO_URI` with wrong syntax causes connection failure at first DB operation, not at startup. Fail-fast prevents half-initialized servers.

**Risk if ignored:** Server starts without database connection, returns 500 errors on every request. Debugging is harder because error appears at first query, not at startup.

---

#### P0-7: Error Message Sanitization

**Files to modify:**
- `backend/middleware/errorHandler.js` — Sanitize error messages in production

**Current code (lines 35-39):**
```javascript
res.status(statusCode).json({
  success: false,
  message,
  stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
});
```

**Change required:**
1. Add a sanitization function that strips sensitive data from error messages:
   - File paths (e.g., `C:\Users\...`)
   - Database connection strings
   - API keys
   - Internal IP addresses
   - Stack traces (already handled for production)
2. Add generic error messages for production:
   - `'Internal server error'` for 500 errors
   - `'Not found'` for 404 errors
   - Log the full error to console/logger for debugging

**Why required:** Error messages can leak internal paths, database structure, API keys, and other sensitive information. Attackers use error details to map the system and find vulnerabilities.

**Risk if ignored:** Production error response reveals `MongoError: E11000 duplicate key error collection: test.users index: email_1 dup key: { email: "admin@test.com" }` — attacker learns valid email addresses and database structure.

---

#### P0-8: File Upload Security

**Files to modify:**
- `backend/services/aiService.js` — Add multer configuration with security constraints
- `backend/server.js` — Add file size limits at Express level

**Current state:** No file upload validation exists. `express.json({ limit: '50mb' })` allows large payloads.

**Change required:**
1. Create `backend/middleware/upload.js` with:
   - File type whitelist: `['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain']`
   - File size limit: 10MB
   - Filename sanitization (remove special chars, path traversal attempts)
   - Virus scanning placeholder (log warning that no scanner is configured)
2. Apply to file upload routes

**Why required:** Unrestricted file upload allows attackers to upload malicious files (PHP shells, JavaScript files, large files for DoS). Without type checking, an attacker can upload and execute arbitrary code.

**Risk if ignored:** Attacker uploads a malicious HTML file with JavaScript that steals session cookies. Or uploads a 1GB file causing disk space exhaustion (DoS).

---

#### P0-9: API Key Rotation Mechanism

**Files to modify:**
- `backend/services/aiService.js` — Add multi-key support with rotation
- `backend/services/ai/openaiService.js` — Add multi-key support with rotation
- `backend/.env` — Add secondary key variables

**Change required:**
1. Support comma-separated API keys in env vars: `GEMINI_API_KEY=key1,key2,key3`
2. Add key rotation logic:
   - Track which key is currently active
   - On rate limit error (429), rotate to next key
   - On auth error (401), mark key as invalid, rotate
   - Log key usage for monitoring
3. Add fallback chain: primary → secondary → mock

**Why required:** Single API key is a single point of failure. If the key is rate-limited or revoked, the entire AI system goes down. Multiple keys with automatic rotation ensure continuous operation.

**Risk if ignored:** Gemini/OpenAI rate limit hit → all AI features return mock data. Key revoked → complete AI system failure until manual intervention.

---

#### P0-10: Audit Logging for Auth Events

**Files to modify:**
- `backend/controllers/authController.js` — Add activity logging for auth events
- `backend/services/activityService.js` — Already has `logActivity` function (line 4)

**Current authController.js:** No activity logging on register, login, or profile changes.

**Change required:**
1. Add `logActivity` calls to:
   - `register` — log `action: 'create'`, `resource: 'user'`
   - `login` — log `action: 'login'`, `resource: 'auth'`, include success/failure
   - `updateProfile` — log `action: 'update'`, `resource: 'user'`
   - Add `logout` — log `action: 'logout'`, `resource: 'auth'`
2. Add login failure logging (before throwing error)
3. Add password change logging (when implemented)

**Why required:** Without audit logs, security incidents cannot be investigated. If an account is compromised, there's no record of when, from where, or what actions were taken. Compliance requirements (SOC2, GDPR, HIPAA) mandate audit trails.

**Risk if ignored:** Zero visibility into security incidents. Cannot determine scope of a breach. Non-compliance with regulatory requirements.

---

### 2.2 Implementation Order — Step by Step

#### Step 1: Fix Critical Bug + Environment (Day 1, 30 min)

**Order:** P0-6 (partial) → P0-5

**Files to modify:**
1. `backend/.env` — Fix `MONGO_URI:` to `MONGO_URI=`
2. `backend/server.js` — Add env var validation + CORS config

**Why first:** The `.env` syntax bug means the app may not be reading config correctly. CORS is a quick win that closes a major vulnerability immediately.

**Execution:**
```
1. Edit .env: Change "MONGO_URI:" to "MONGO_URI="
2. Edit server.js: Add validateEnv() function before connectDB()
3. Edit server.js: Replace app.use(cors()) with restricted corsOptions
4. Test: Start server, verify it reads env vars, verify CORS headers
```

---

#### Step 2: Authentication Hardening (Day 1-2)

**Order:** P0-1 → P0-3 → P0-10

**Files to modify:**
1. `backend/validators/auth.js` — Password policy
2. `backend/middleware/auth.js` — Token blacklist, refresh validation
3. `backend/controllers/authController.js` — Token expiry, refresh, logout, audit logging
4. `backend/routes/auth.js` — Add logout + refresh routes
5. `backend/services/activityService.js` — Already ready, just import and use

**Why second:** Authentication is the primary security boundary. Hardening it first protects all other features.

**Execution:**
```
1. Edit validators/auth.js: min 8 chars, add special char requirement
2. Edit middleware/auth.js: Add blacklist check, add token expiry validation
3. Edit controllers/authController.js: 
   - Change generateToken expiry to '15m'
   - Add generateRefreshToken on login
   - Add logout handler (adds token to blacklist)
   - Add refreshToken handler
   - Add logActivity calls for register, login, logout
4. Edit routes/auth.js: Add POST /logout, POST /refresh
5. Test: Register with weak password (should fail), login (should get access+refresh), logout (token invalidated)
```

---

#### Step 3: Input/Output Security (Day 2-3)

**Order:** P0-4 → P0-7

**Files to modify:**
1. `backend/middleware/validate.js` — Add sanitization
2. `backend/middleware/errorHandler.js` — Add production-safe messages
3. `backend/validators/generic.js` — Add max length limits, type enforcement

**Why third:** Input validation protects all endpoints. Error sanitization prevents information leakage.

**Execution:**
```
1. Edit middleware/validate.js:
   - Add sanitizeInput() function that strips $ and . from keys
   - Add xssSanitize() function that HTML-encodes strings
   - Apply sanitization after validation passes
2. Edit middleware/errorHandler.js:
   - Add sanitizeMessage() for production mode
   - Add generic fallback messages
   - Keep full error in console.log for debugging
3. Edit validators/generic.js:
   - Add .isLength({ max: 200 }) to all string fields
   - Add .isIn() for enum fields where applicable
4. Test: Send $where injection (should be stripped), trigger error (should not leak paths)
```

---

#### Step 4: Infrastructure Security (Day 3-4)

**Order:** P0-2 → P0-8 → P0-9

**Files to modify:**
1. `backend/server.js` — Add auth-specific rate limiters
2. `backend/middleware/upload.js` — New file for file upload security
3. `backend/services/aiService.js` — Multi-key rotation
4. `backend/services/ai/openaiService.js` — Multi-key rotation
5. `backend/.env` — Add secondary key vars

**Why fourth:** Rate limiting prevents brute force. File upload security prevents malicious uploads. Key rotation ensures AI availability.

**Execution:**
```
1. Edit server.js:
   - Add authLimiter (5/min) for /api/auth/login
   - Add registerLimiter (3/hour) for /api/auth/register
   - Apply before global limiter
2. Create middleware/upload.js:
   - File type whitelist
   - File size limit (10MB)
   - Filename sanitization
3. Edit services/aiService.js:
   - Parse comma-separated GEMINI_API_KEY
   - Add key rotation on 429/401 errors
   - Add fallback chain
4. Edit services/ai/openaiService.js:
   - Same key rotation pattern
5. Test: Hit login 6 times fast (should block), upload invalid file type (should reject)
```

---

### 2.3 Risk Assessment Summary

| Priority | Fix | Risk if Ignored | Severity | Likelihood | Risk Score |
|----------|-----|-----------------|----------|------------|------------|
| P0-1 | Password policy | Account takeover | Critical | High | **Critical** |
| P0-2 | Auth rate limiting | Brute force success | Critical | High | **Critical** |
| P0-3 | JWT hardening | Session hijacking | Critical | Medium | **High** |
| P0-4 | Input sanitization | NoSQL injection, XSS | Critical | Medium | **High** |
| P0-5 | CORS config | Cross-origin data theft | High | Medium | **High** |
| P0-6 | Env validation | Runtime crashes | High | Low | **Medium** |
| P0-7 | Error sanitization | Information leakage | Medium | Medium | **Medium** |
| P0-8 | File upload security | Malicious file upload | High | Low | **Medium** |
| P0-9 | API key rotation | AI service downtime | Medium | Low | **Low** |
| P0-10 | Auth audit logging | No incident visibility | Medium | Low | **Low** |

---

## 3. PHASE 1: AI CORE IMPLEMENTATION

### 3.1 ENGINE 1: AI ASSISTANT ENGINE

#### 3.1.1 Purpose

The AI Assistant Engine enables users to query enterprise data using natural language. It classifies intent, builds context, retrieves knowledge, and generates coherent responses — all without the user writing database queries or navigating complex dashboards.

#### 3.1.2 User Value

- **Before:** User must navigate to specific pages (Businesses, Products, Reports) and manually filter/search data
- **After:** User types "What were our top 5 products last quarter?" and gets instant answer with data, sources, and follow-up suggestions
- **Time saved:** 5-15 minutes per query → hours per week per user
- **Accessibility:** Non-technical users can access enterprise data without SQL knowledge

#### 3.1.3 Data Required

| Data Source | Fields Used | Access Pattern | Why |
|-------------|-------------|----------------|-----|
| `users` | _id, name, role, department, preferences | Read on each query | Personalize response style, scope data access |
| `businesses` | _id, name, category, status, revenue, industry | Read on domain queries | Provide business context for answers |
| `products` | _id, name, category, price, quantity, sales | Read on product queries | Answer product-specific questions |
| `activities` | user, action, resource, timestamp | Read for personalization | Understand user's recent focus areas |
| `ai_conversations` (new) | query, response, intent, confidence, feedback | Read/Write per interaction | Store history for context, improve accuracy |
| `ai_cache` (new) | query_hash, response, intent, created_at | Read before LLM, Write after | Reduce latency, save API costs |

#### 3.1.4 Backend Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AI ASSISTANT ENGINE ARCHITECTURE                         │
│                                                                               │
│  POST /api/assistant/query                                                    │
│       │                                                                       │
│       ▼                                                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                    AI ORCHESTRATOR LAYER                                │    │
│  │                                                                         │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │    │
│  │  │  Query Router │  │  Context     │  │  Memory      │  │  Response│  │    │
│  │  │  (intent)     │  │  Manager     │  │  Manager     │  │  Builder │  │    │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────┬─────┘  │    │
│  └─────────┼─────────────────┼─────────────────┼───────────────┼────────┘    │
│            │                 │                 │               │             │
│            ▼                 ▼                 ▼               ▼             │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                    ENGINE LAYER (4 Algorithms)                         │    │
│  │                                                                         │    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┐  │    │
│  │  │  Intent          │  │  Context         │  │  Knowledge       │  │  │    │
│  │  │  Classifier (A1) │─▶│  Builder (A2)    │─▶│  Retriever (A3)  │─▶│  │    │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘  │  │    │
│  │                                                                    │  │    │
│  │                                               ┌──────────────────┐ │  │    │
│  │                                               │  Response        │◀┘  │    │
│  │                                               │  Generator (A4)  │    │    │
│  │                                               └──────────────────┘    │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│            │                                                                  │
│            ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                    MODEL ROUTER LAYER                                   │    │
│  │                                                                         │    │
│  │  Rule Match (0.3) → Embedding (0.3) → Gemini (0.4) → OpenAI (fallback) │    │
│  │                                                                         │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Architecture flow:**
```
User → POST /api/assistant/query → auth middleware → rate limiter → 
assistantController.query() → orchestrator.processQuery() →
  queryRouter.route(query, user) → 
    intentClassifier.classify(query, context) → 
    contextBuilder.build(user, session, domain) → 
    knowledgeRetriever.retrieve(intent, entities, context) → 
    responseGenerator.generate(knowledge, intent, context) →
  responseBuilder.format(response, sources) →
  cache.store(query_hash, response) →
  ai_conversations.insert({query, response, intent, confidence}) →
Response → User
```

#### 3.1.5 Required Backend Modules

**New files to create:**

| File | Path | Purpose | Lines (est.) |
|------|------|---------|--------------|
| `orchestrator/index.js` | `backend/services/ai/orchestrator/index.js` | Main orchestrator entry point, coordinates all engines | 80 |
| `orchestrator/queryRouter.js` | `backend/services/ai/orchestrator/queryRouter.js` | Intent-based routing, priority queue, load balancing | 100 |
| `orchestrator/contextManager.js` | `backend/services/ai/orchestrator/contextManager.js` | Session state, user profile, domain context | 120 |
| `orchestrator/memoryManager.js` | `backend/services/ai/orchestrator/memoryManager.js` | Short-term (Redis) + long-term (MongoDB) memory | 100 |
| `orchestrator/responseBuilder.js` | `backend/services/ai/orchestrator/responseBuilder.js` | Template selection, formatting, enrichment | 80 |
| `clients/geminiClient.js` | `backend/services/ai/clients/geminiClient.js` | Refactored from aiService.js — rate limiting, retry, caching | 150 |
| `clients/openaiClient.js` | `backend/services/ai/clients/openaiClient.js` | Refactored from openaiService.js — client pattern | 120 |
| `clients/embeddingClient.js` | `backend/services/ai/clients/embeddingClient.js` | Embedding generation via Gemini/OpenAI | 80 |
| `engines/assistant/intentClassifier.js` | `backend/services/ai/engines/assistant/intentClassifier.js` | A1: MultiLayerIntentClassifier | 200 |
| `engines/assistant/contextBuilder.js` | `backend/services/ai/engines/assistant/contextBuilder.js` | A2: TemporalContextBuilder | 150 |
| `engines/assistant/knowledgeRetriever.js` | `backend/services/ai/engines/assistant/knowledgeRetriever.js` | A3: HybridKnowledgeRetriever | 200 |
| `engines/assistant/responseGenerator.js` | `backend/services/ai/engines/assistant/responseGenerator.js` | A4: ContextAwareResponseGenerator | 180 |
| `utils/promptBuilder.js` | `backend/services/ai/utils/promptBuilder.js` | Dynamic prompt construction with templates | 100 |
| `utils/responseParser.js` | `backend/services/ai/utils/responseParser.js` | LLM response parsing and validation | 80 |
| `utils/safetyFilter.js` | `backend/services/ai/utils/safetyFilter.js` | Content safety, PII detection, harmful content filter | 100 |
| `ml/inference/modelRouter.js` | `backend/services/ai/ml/inference/modelRouter.js` | Route to best model: Rule→ML→Embeddings→LLM | 120 |
| `assistantController.js` | `backend/controllers/assistantController.js` | Assistant query, context, suggestions, history endpoints | 100 |
| `routes/assistant.js` | `backend/routes/assistant.js` | Route definitions for assistant endpoints | 30 |

**Existing files to modify:**

| File | Change | Why |
|------|--------|-----|
| `backend/services/aiService.js` | Refactor to orchestrator entry point | Current monolithic file becomes thin wrapper that calls orchestrator |
| `backend/services/ai/openaiService.js` | Refactor to client pattern | Current direct calls become `openaiClient.js` |
| `backend/controllers/aiController.js` | Route through orchestrator | Current direct service calls go through orchestrator |
| `backend/routes/ai.js` | Add assistant route registration | Register new `/api/assistant` routes |
| `backend/server.js` | Add assistant route | `app.use('/api/assistant', ...)` |
| `backend/config/indexes.js` | Add AI collection indexes | Ensure query performance for new collections |
| `frontend/src/pages/AIInsights.jsx` | Add assistant query interface | Replace feature card grid with query input + results |
| `frontend/src/services/api.js` | Add assistant API methods | `assistantAPI.query()`, `assistantAPI.getHistory()` |

#### 3.1.6 Database Design

**New collections:**

**ai_conversations:**
```javascript
{
  user: { type: ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true },
  query: { type: String, required: true },
  response: { type: String, required: true },
  intent: { type: String, index: true },
  confidence: { type: Number },
  entities: [{ type: String, value: String }],
  sources: [{ source: String, collection: String, id: ObjectId, score: Number }],
  metadata: {
    tokensUsed: Number,
    latency: Number,
    modelUsed: String,
    cacheHit: Boolean
  },
  feedback: { rating: Number, comment: String, corrected: Boolean },
  createdAt: { type: Date, default: Date.now }
}
// Indexes: { user: 1, createdAt: -1 }, { sessionId: 1 }, { intent: 1, createdAt: -1 }
```

**ai_cache:**
```javascript
{
  queryHash: { type: String, required: true, unique: true, index: true },
  query: { type: String, required: true },
  response: { type: String, required: true },
  intent: { type: String },
  confidence: { type: Number },
  sources: [{ source: String, collection: String, id: ObjectId, score: Number }],
  hitCount: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now, expires: 3600 } // TTL: 1 hour
}
// Indexes: { queryHash: 1 }, { createdAt: 1 } (TTL)
```

#### 3.1.7 API Endpoints Required

| # | Method | Endpoint | Input | Output | Purpose |
|---|--------|----------|-------|--------|---------|
| 1 | POST | `/api/assistant/query` | `{ query, domain?, sessionId? }` | `{ response, confidence, sources, suggestions }` | Process natural language query |
| 2 | GET | `/api/assistant/context` | `?sessionId=` | `{ context, session, profile, domain }` | Get current user context |
| 3 | GET | `/api/assistant/suggestions` | `?domain=&count=` | `{ suggestions: [{text, intent, confidence}] }` | Get contextual suggestions |
| 4 | GET | `/api/assistant/history` | `?page=&limit=` | `{ history: [...], pagination }` | Get query history |
| 5 | POST | `/api/assistant/feedback` | `{ queryId, rating, comment? }` | `{ success }` | Submit feedback on response |

#### 3.1.8 Algorithm Flow — A1: MultiLayerIntentClassifier

```
Input: Query Q, User context C, Session history H, Domain config D

Step 1: QUERY NORMALIZATION
  Q_clean = lowercase(removeStopwords(stem(Q)))
  Purpose: Standardize input for pattern matching

Step 2: PATTERN MATCHING (Rule-based, weight: 0.3)
  For each pattern P in intent_patterns[domain]:
    if match(Q, P.regex) → intent = P.intent, confidence = P.confidence
  Purpose: Fast path for known patterns (e.g., "show sales" → sales_query)

Step 3: EMBEDDING MATCHING (Vector-based, weight: 0.3)
  Q_embed = generateEmbedding(Q)
  For each intent I in intent_catalog:
    similarity = cosineSimilarity(Q_embed, I.embedding)
  Best match = max(similarity)
  Purpose: Catch patterns not covered by rules

Step 4: LLM CLASSIFICATION (LLM-based, weight: 0.4)
  prompt = buildClassificationPrompt(Q, context, domain)
  llm_result = callGemini(prompt)
  Parse { intent, confidence, entities, sub_intent }
  Purpose: Handle complex, ambiguous, or novel queries

Step 5: ENSEMBLE FUSION
  For each intent i:
    score(i) = 0.3 * rule_match(i) + 0.3 * embedding_match(i) + 0.4 * llm_match(i)
  Best intent = argmax(score)

Step 6: THRESHOLD CHECK
  if confidence >= 0.85 → execute intent
  if 0.60 <= confidence < 0.85 → ask clarification question
  if confidence < 0.60 → fallback to general chatbot

Output: { intent, confidence, entities, sub_intent }
```

**Testing approach:**
1. **Unit tests:** Test each layer independently with known inputs
   - Rule matching: 20 test patterns, verify correct intent
   - Embedding matching: 10 test queries, verify top-3 accuracy
   - LLM classification: 10 test queries, verify parseable output
2. **Integration tests:** Test full pipeline with 50 diverse queries
   - Measure accuracy: target ≥90%
   - Measure latency: target <2s for rule/embedding, <5s for LLM
3. **Edge cases:**
   - Empty query → return error
   - Ambiguous query → return clarification
   - Out-of-domain query → fallback to chatbot
   - Malicious query → safety filter blocks

---

### 3.2 ENGINE 2: RECOMMENDATION ENGINE

#### 3.2.1 Purpose

The Recommendation Engine analyzes user behavior and enterprise needs to generate personalized recommendations for products, services, skills, and actions. It uses content-based filtering, collaborative filtering, and adaptive ranking.

#### 3.2.2 User Value

- **Before:** User manually browses products, skills, or services — no guidance on what's relevant
- **After:** User sees "Recommended for you: Medical Equipment Supplies (based on your recent purchases)" and "Users in Healthcare also viewed: Compliance Software"
- **Time saved:** Eliminates manual browsing and research
- **Discovery:** Surfaces items user wouldn't have found otherwise
- **Engagement:** Personalized experience increases platform stickiness

#### 3.2.3 Data Required

| Data Source | Fields Used | Access Pattern | Why |
|-------------|-------------|----------------|-----|
| `activities` | user, action, resource, resourceId, timestamp, metadata | Aggregate for behavior analysis | Build behavioral profile from user actions |
| `users` | _id, role, department, industry, preferences | Read for user profiling | Personalize based on role and preferences |
| `products` | _id, name, category, price, features, rating, tags | Read for item scoring | Score items against user preferences |
| `businesses` | _id, industry, size, budget, status, category | Read for enterprise context | Filter by enterprise domain |
| `customers` | _id, industry, purchases, interactions, segment | Read for customer patterns | Collaborative filtering signal |

#### 3.2.4 Backend Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   RECOMMENDATION ENGINE ARCHITECTURE                          │
│                                                                               │
│  GET /api/recommendations?type=products&limit=10                              │
│       │                                                                       │
│       ▼                                                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                    RECOMMENDATION PIPELINE                              │    │
│  │                                                                         │    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┐  │    │
│  │  │  Behavior         │  │  Enterprise      │  │  Multi-Factor    │  │  │    │
│  │  │  Analyzer (B1)    │─▶│  Need Analyzer   │─▶│  Scorer (B3)    │──▶│  │    │
│  │  │                   │  │  (B2)            │  │                  │  │  │    │
│  │  │  - Aggregate      │  │  - Gap Analysis  │  │  - User Fit      │  │  │    │
│  │  │  - Frequency      │  │  - Budget Check  │  │  - Enterprise    │  │  │    │
│  │  │  - Preferences    │  │  - Vendor Eval   │  │  - Popularity    │  │  │    │
│  │  │  - Patterns       │  │  - Trend Align   │  │  - Recency       │  │  │    │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘  │  │    │
│  │                                                                    │  │    │
│  │                                               ┌──────────────────┐ │  │    │
│  │                                               │  Adaptive        │◀┘  │    │
│  │                                               │  Ranker (B4)    │    │    │
│  │                                               │                  │    │    │
│  │                                               │  - Rules         │    │    │
│  │                                               │  - Signals       │    │    │
│  │                                               │  - Feedback      │    │    │
│  │                                               │  - Diversity     │    │    │
│  │                                               └──────────────────┘    │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│            │                                                                  │
│            ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                    CACHE LAYER                                         │    │
│  │                                                                         │    │
│  │  Redis Cache (TTL: 1 hour) — Key: recs:{userId}:{type}                 │    │
│  │  Invalidated on: new activity, explicit refresh                        │    │
│  │                                                                         │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│            │                                                                  │
│            ▼                                                                  │
│  Response: { recommendations: [{item, score, reason, breakdown}], metadata }  │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.2.5 Required Backend Modules

**New files to create:**

| File | Path | Purpose | Lines (est.) |
|------|------|---------|--------------|
| `engines/recommendation/behaviorAnalyzer.js` | `backend/services/ai/engines/recommendation/behaviorAnalyzer.js` | B1: Analyze user actions, build behavioral profile | 180 |
| `engines/recommendation/needAnalyzer.js` | `backend/services/ai/engines/recommendation/needAnalyzer.js` | B2: Identify business needs, gaps, opportunities | 150 |
| `engines/recommendation/recommendationScorer.js` | `backend/services/ai/engines/recommendation/recommendationScorer.js` | B3: Score items on user fit, enterprise fit, popularity, recency | 200 |
| `engines/recommendation/adaptiveRanker.js` | `backend/services/ai/engines/recommendation/adaptiveRanker.js` | B4: Optimize ranking with rules, signals, feedback, diversity | 180 |
| `recommendationController.js` | `backend/controllers/recommendationController.js` | Recommendation endpoints | 100 |
| `routes/recommendations.js` | `backend/routes/recommendations.js` | Route definitions | 30 |

**Existing files to modify:**

| File | Change | Why |
|------|--------|-----|
| `backend/server.js` | Add recommendation route | `app.use('/api/recommendations', ...)` |
| `backend/config/indexes.js` | Add recommendation query indexes | Ensure performance for aggregation queries |
| `frontend/src/services/api.js` | Add recommendation API methods | `recommendationAPI.getRecommendations()` |
| `frontend/src/pages/AIInsights.jsx` | Add recommendation widget | Show personalized recommendations |

#### 3.2.6 Database Design

**No new collections required.** The Recommendation Engine uses existing collections:
- `activities` — for behavior analysis
- `users` — for user profiling
- `products` — for item scoring
- `businesses` — for enterprise context
- `customers` — for collaborative filtering

**New indexes needed:**
```javascript
// activities collection — for behavior analysis queries
{ user: 1, action: 1, createdAt: -1 }
{ user: 1, resource: 1, createdAt: -1 }

// products collection — for recommendation queries
{ category: 1, rating: -1, createdAt: -1 }
{ category: 1, price: 1 }
```

#### 3.2.7 API Endpoints Required

| # | Method | Endpoint | Input | Output | Purpose |
|---|--------|----------|-------|--------|---------|
| 1 | GET | `/api/recommendations` | `?type=&limit=&category=` | `{ recommendations: [{item, score, reason}], metadata }` | Get personalized recommendations |
| 2 | GET | `/api/recommendations/trending` | `?limit=&category=` | `{ trending: [{item, trend_score, reason}] }` | Get trending items |
| 3 | GET | `/api/recommendations/similar/:id` | `:id, ?limit=` | `{ similar: [{item, similarity, reason}] }` | Get similar items |
| 4 | POST | `/api/recommendations/feedback` | `{ itemId, action, rating? }` | `{ success, updated_profile }` | Submit feedback |

#### 3.2.8 Algorithm Flow — B3: MultiFactorRecommendationScorer

```
Input: Candidates C, Behavioral profile BP, Enterprise needs N, Business context BC

Step 1: USER FIT SCORE (weight: 0.35)
  category_match = BP.topCategories contains item.category ? 1.0 : 0.2
  price_fit = item.price within BP.priceRange ? 1.0 : max(0, 1 - abs(item.price - BP.avgPrice) / BP.avgPrice)
  feature_match = count(BP.preferredFeatures ∩ item.features) / len(BP.preferredFeatures)
  user_fit = 0.4 * category_match + 0.3 * price_fit + 0.3 * feature_match

Step 2: ENTERPRISE FIT SCORE (weight: 0.30)
  need_match = N.prioritizedNeeds contains item.category ? 1.0 : 0.1
  industry_match = item.industry === BC.industry ? 1.0 : 0.3
  size_match = item.targetSize contains BC.size ? 1.0 : 0.5
  enterprise_fit = 0.5 * need_match + 0.3 * industry_match + 0.2 * size_match

Step 3: POPULARITY SCORE (weight: 0.20)
  views_norm = item.views / max_views_in_category
  purchases_norm = item.purchases / max_purchases_in_category
  rating_norm = item.rating / 5.0
  popularity = 0.2 * views_norm + 0.4 * purchases_norm + 0.4 * rating_norm

Step 4: RECENCY SCORE (weight: 0.15)
  days_since_creation = (now - item.createdAt) / (24 * 60 * 60 * 1000)
  recency = exp(-0.01 * days_since_creation)

Step 5: FINAL SCORE
  final_score = 0.35 * user_fit + 0.30 * enterprise_fit + 0.20 * popularity + 0.15 * recency

Step 6: FILTERING
  if user_fit < 0.3 → exclude
  if enterprise_fit < 0.2 → exclude
  if final_score < 0.4 → exclude

Step 7: DIVERSITY ENFORCEMENT
  max_per_category = 3
  if items from same category > max_per_category → keep top max_per_category

Output: { recommendations: [{item_id, final_score, scores_breakdown, reason}], diversity_metrics }
```

**Testing approach:**
1. **Unit tests:** Test each scoring factor independently
   - User fit: 10 test items, verify correct scoring
   - Enterprise fit: 10 test items, verify industry/budget matching
   - Popularity: 10 test items, verify normalization
   - Recency: 10 test items, verify decay curve
2. **Integration tests:** Test full pipeline with 100 items
   - Verify top-5 relevance (manual review)
   - Verify diversity (no more than 3 from same category)
   - Verify exclusion rules (low-fit items removed)
3. **A/B testing:** Compare recommendation click-through rates
   - Baseline: random items
   - Test: algorithm recommendations
   - Target: 2x improvement in CTR

---

### 3.3 ENGINE 3: AI CHATBOT ENGINE

#### 3.3.1 Purpose

The Chatbot Engine provides conversational AI interaction with memory, context tracking, and natural language understanding for ongoing dialogues. It enhances the existing chatbot with full NLP pipeline, conversation memory, and context management.

#### 3.3.2 User Value

- **Before:** Chatbot responds to individual messages with no memory of previous context. User must repeat information.
- **After:** User can have flowing conversations: "Show me Q3 sales" → "What about by region?" → system remembers Q3 context and shows regional breakdown
- **Natural interaction:** Pronoun resolution ("it", "they", "that"), ellipsis resolution ("and the profits?"), topic tracking
- **Persistence:** Conversations persist across sessions, user can resume later

#### 3.3.3 Data Required

| Data Source | Fields Used | Access Pattern | Why |
|-------------|-------------|----------------|-----|
| `conversations` (new) | _id, user, sessionId, title, status, metadata | Read/Write per session | Store conversation metadata |
| `messages` (new) | _id, conversation, role, content, intent, entities, sentiment | Read/Write per exchange | Store individual messages |
| `users` | _id, name, role, department, preferences | Read for personalization | Personalize responses |
| `activities` | user, action, resource, timestamp | Read for context enrichment | Understand recent user activity |

#### 3.3.4 Backend Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AI CHATBOT ENGINE ARCHITECTURE                           │
│                                                                               │
│  POST /api/chatbot/message { message, conversationId? }                       │
│       │                                                                       │
│       ▼                                                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                    CHATBOT PIPELINE (4 Algorithms)                      │    │
│  │                                                                         │    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┐  │    │
│  │  │  NLP              │  │  Conversation    │  │  Context         │  │  │    │
│  │  │  Processor (G1)   │─▶│  Memory          │─▶│  Manager (G3)   │──▶│  │    │
│  │  │                   │  │  Manager (G2)    │  │                  │  │  │    │
│  │  │  - Tokenize       │  │  - Short-term    │  │  - Topic Track   │  │  │    │
│  │  │  - Intent Detect  │  │  - Long-term     │  │  - Pronoun Res   │  │  │    │
│  │  │  - Entity Extract │  │  - Merge         │  │  - Ellipsis Res  │  │  │    │
│  │  │  - Sentiment      │  │  - Summarize     │  │  - Weighting     │  │  │    │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘  │  │    │
│  │                                                                    │  │    │
│  │                                               ┌──────────────────┐ │  │    │
│  │                                               │  Answer          │◀┘  │    │
│  │                                               │  Generator (G4)  │    │    │
│  │                                               │                  │    │    │
│  │                                               │  - Knowledge Sel │    │    │
│  │                                               │  - Response Type │    │    │
│  │                                               │  - Template      │    │    │
│  │                                               │  - Gemini Call   │    │    │
│  │                                               │  - Validate      │    │    │
│  │                                               │  - Enrich        │    │    │
│  │                                               └──────────────────┘    │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│            │                                                                  │
│            ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                    MEMORY HIERARCHY                                     │    │
│  │                                                                         │    │
│  │  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────┐  │    │
│  │  │  Short-term (Redis)  │  │  Long-term (MongoDB) │  │  Episodic    │  │    │
│  │  │  Last 10 exchanges   │  │  Summarized history  │  │  Key decisions│  │    │
│  │  │  TTL: session + 1hr  │  │  TTL: 90 days       │  │  Permanent    │  │    │
│  │  └──────────────────────┘  └──────────────────────┘  └──────────────┘  │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│            │                                                                  │
│            ▼                                                                  │
│  Response: { response, conversationId, suggestions, metadata }                │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.3.5 Required Backend Modules

**New files to create:**

| File | Path | Purpose | Lines (est.) |
|------|------|---------|--------------|
| `engines/chatbot/nlpProcessor.js` | `backend/services/ai/engines/chatbot/nlpProcessor.js` | G1: NLP processing — tokenize, intent, entities, sentiment | 200 |
| `engines/chatbot/memoryManager.js` | `backend/services/ai/engines/chatbot/memoryManager.js` | G2: Conversation memory — short/long-term management | 180 |
| `engines/chatbot/contextManager.js` | `backend/services/ai/engines/chatbot/contextManager.js` | G3: Context management — topic tracking, pronoun resolution | 200 |
| `engines/chatbot/answerGenerator.js` | `backend/services/ai/engines/chatbot/answerGenerator.js` | G4: Answer generation — knowledge selection, LLM call, validation | 200 |

**Existing files to modify:**

| File | Change | Why |
|------|--------|-----|
| `backend/services/ai/chatbotService.js` | Enhance with full algorithm pipeline | Current version is basic LLM call, needs full G1→G2→G3→G4 pipeline |
| `backend/controllers/chatbotController.js` | Add conversation management | Current has message/report/insights, needs conversation CRUD |
| `backend/routes/chatbot.js` | Add conversation routes | Add GET/PUT for conversations |
| `backend/server.js` | No changes needed | Routes already registered |
| `backend/config/indexes.js` | Add chatbot collection indexes | conversations + messages indexes |
| `frontend/src/services/api.js` | Add conversation API methods | `chatbotAPI.getConversations()`, `chatbotAPI.getConversation()` |

#### 3.3.6 Database Design

**New collections:**

**conversations:**
```javascript
{
  user: { type: ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  title: { type: String, default: 'New Conversation' },
  status: { type: String, enum: ['active', 'archived', 'closed'], default: 'active' },
  metadata: {
    startTime: Date,
    endTime: Date,
    messageCount: { type: Number, default: 0 },
    topics: [String],
    sentiment: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
// Indexes: { user: 1, updatedAt: -1 }, { sessionId: 1 }
```

**messages:**
```javascript
{
  conversation: { type: ObjectId, ref: 'Conversation', required: true, index: true },
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  intent: { type: String },
  entities: [{ type: String, value: String }],
  sentiment: { label: String, score: Number },
  metadata: {
    tokensUsed: Number,
    latency: Number,
    modelUsed: String
  },
  timestamp: { type: Date, default: Date.now }
}
// Indexes: { conversation: 1, timestamp: 1 }
```

#### 3.3.7 API Endpoints Required

| # | Method | Endpoint | Input | Output | Purpose |
|---|--------|----------|-------|--------|---------|
| 1 | POST | `/api/chatbot/message` | `{ message, conversationId? }` | `{ response, conversationId, suggestions }` | Send message (enhance existing) |
| 2 | GET | `/api/chatbot/conversations` | `?status=&page=&limit=` | `{ conversations: [...], pagination }` | List user conversations |
| 3 | GET | `/api/chatbot/conversations/:id` | `:id, ?page=&limit=` | `{ conversation, messages: [...] }` | Get conversation history |
| 4 | PUT | `/api/chatbot/conversations/:id/archive` | `:id` | `{ success, status: "archived" }` | Archive conversation |
| 5 | GET | `/api/chatbot/insights` | None | `{ insights: { overview, recommendations } }` | Get quick insights (existing) |
| 6 | POST | `/api/chatbot/generate-report` | `{ reportType, filters? }` | `{ report, metadata }` | Generate report (existing) |

#### 3.3.8 Algorithm Flow — G1: NaturalLanguageProcessingFlow

```
Input: User message M, Conversation history H, User context C, Domain D

Step 1: PRE-PROCESSING
  tokens = tokenize(M)  // Split into words/tokens
  normalized = lowercase(removePunctuation(tokens))
  language = detectLanguage(M)  // Default: 'en'
  Purpose: Clean and standardize input

Step 2: INTENT DETECTION
  // Use same intent classifier as Assistant Engine (A1)
  intent_result = intentClassifier.classify(normalized, C, D)
  // { intent, confidence, entities, sub_intent }
  Purpose: Determine what user wants to do

Step 3: ENTITY EXTRACTION
  entities = []
  // Date extraction
  if containsDatePattern(M): entities.push({ type: 'date', value: extractedDate })
  // Number extraction
  if containsNumberPattern(M): entities.push({ type: 'number', value: extractedNumber })
  // Named entity recognition via Gemini
  llm_entities = callGemini(extractEntitiesPrompt(M))
  entities = merge(rule_entities, llm_entities)
  Purpose: Extract structured data from natural language

Step 4: SENTIMENT ANALYSIS
  sentiment = analyzeSentiment(M)
  // { label: 'positive'|'negative'|'neutral', score: 0-1 }
  urgency = detectUrgency(M)  // Keywords: 'urgent', 'asap', 'immediately'
  Purpose: Understand user's emotional state and urgency

Step 5: QUERY REFORMULATION
  // Resolve pronouns using context
  if containsPronoun(M): M = resolvePronouns(M, H.lastEntities)
  // Resolve ellipsis
  if isIncomplete(M): M = completeQuery(M, H.lastTopic)
  // Add context from history
  M_final = addContext(M, H.lastQuery, H.lastResponse)
  Purpose: Create context-aware query for downstream processing

Step 6: ROUTING
  handler = routeToHandler(intent, domain)
  // answer → AnswerGenerator
  // clarification → askClarification
  // action → executeAction
  // error → apologize
  // chitchat → generalResponse
  Purpose: Route to appropriate response handler

Output: { processed_message, intent, confidence, entities, sentiment, urgency, handler }
```

**Testing approach:**
1. **Unit tests:** Test each NLP component independently
   - Tokenization: 20 test messages, verify correct token count
   - Intent detection: 30 test messages, verify ≥90% accuracy
   - Entity extraction: 20 test messages, verify correct entity types/values
   - Sentiment analysis: 20 test messages, verify correct sentiment label
2. **Integration tests:** Test full pipeline with conversation flows
   - 5-turn conversation: verify context maintained across turns
   - Pronoun resolution: "Show me product X" → "What's its price?" → resolves "its" to X
   - Topic switch: "Show sales" → "Now show products" → detects topic switch
3. **Edge cases:**
   - Empty message → return error
   - Single word message → attempt intent detection
   - Very long message (>1000 chars) → truncate with warning
   - Non-English message → attempt detection, fallback to English

---

## 4. DEVELOPMENT ORDER & DEPENDENCIES

### 4.1 Complete Dependency Graph

```
PHASE 0 (Week 1)
═══════════════════════════════════════════════════════════════════

P0-6 (.env fix + env validation) ─────────────────┐
P0-5 (CORS config)                                │
    │                                              │
    ├── P0-1 (Password policy) ────────────────────┤
    │       │                                      │
    │       └── P0-3 (JWT hardening) ──────────────┤
    │               │                              │
    │               └── P0-10 (Auth audit) ────────┤
    │                                              │
    ├── P0-4 (Input sanitization) ─────────────────┤
    │       │                                      │
    │       └── P0-7 (Error sanitization) ─────────┤
    │                                              │
    ├── P0-2 (Auth rate limiting) ─────────────────┤
    │                                              │
    ├── P0-8 (File upload security) ───────────────┤
    │                                              │
    └── P0-9 (API key rotation) ───────────────────┘
                                                    │
                                                    ▼
                                           SECURITY COMPLETE
                                                    │
                                                    ▼
PHASE 1 (Weeks 2-4)
═══════════════════════════════════════════════════════════════════

WEEK 2: AI INFRASTRUCTURE
──────────────────────────

AI Infrastructure (no dependencies on Phase 1 engines)
    │
    ├── Create folder structure ───────────────────┐
    │   backend/services/ai/                        │
    │   ├── orchestrator/                           │
    │   ├── clients/                                │
    │   ├── engines/                                │
    │   ├── ml/                                     │
    │   ├── utils/                                  │
    │   └── cache/                                  │
    │                                               │
    ├── Refactor Gemini client ─────────────────────┤
    │   aiService.js → clients/geminiClient.js       │
    │   Add: rate limiting, retry, caching           │
    │                                               │
    ├── Refactor OpenAI client ─────────────────────┤
    │   openaiService.js → clients/openaiClient.js   │
    │   Add: client pattern, fallback                │
    │                                               │
    ├── Build Embedding client ─────────────────────┤
    │   clients/embeddingClient.js                   │
    │   Gemini + OpenAI embedding support            │
    │                                               │
    ├── Build Orchestrator core ────────────────────┤
    │   orchestrator/index.js — main entry point     │
    │   orchestrator/queryRouter.js — intent routing │
    │   orchestrator/contextManager.js — context     │
    │   orchestrator/memoryManager.js — memory       │
    │   orchestrator/responseBuilder.js — formatting │
    │                                               │
    ├── Build AI middleware stack ──────────────────┤
    │   middleware/aiRateLimiter.js                  │
    │   middleware/aiAuth.js                         │
    │   middleware/contextLoader.js                  │
    │   middleware/auditLogger.js                    │
    │   middleware/costTracker.js                    │
    │   middleware/cacheCheck.js                     │
    │   middleware/safetyFilter.js                   │
    │                                               │
    ├── Create AI database models ──────────────────┤
    │   models/AiConversation.js                     │
    │   models/AiCache.js                            │
    │   models/AiEmbedding.js                        │
    │                                               │
    └── Update config/indexes.js ───────────────────┘
        Add AI collection indexes
                                                    │
                                                    ▼
                                           AI INFRASTRUCTURE READY
                                                    │
                                                    ▼
WEEK 3: ASSISTANT ENGINE
─────────────────────────

Assistant Engine (depends on: AI Infrastructure)
    │
    ├── Build Intent Classifier (A1) ───────────────┐
    │   engines/assistant/intentClassifier.js        │
    │   Depends on: embeddingClient, geminiClient    │
    │                                               │
    ├── Build Context Builder (A2) ─────────────────┤
    │   engines/assistant/contextBuilder.js           │
    │   Depends on: User model, Activity model       │
    │                                               │
    ├── Build Knowledge Retriever (A3) ─────────────┤
    │   engines/assistant/knowledgeRetriever.js       │
    │   Depends on: all entity models, embedding     │
    │                                               │
    ├── Build Response Generator (A4) ──────────────┤
    │   engines/assistant/responseGenerator.js        │
    │   Depends on: geminiClient, promptBuilder      │
    │                                               │
    ├── Build utility modules ──────────────────────┤
    │   utils/promptBuilder.js                       │
    │   utils/responseParser.js                      │
    │   utils/safetyFilter.js                        │
    │                                               │
    ├── Build Model Router ─────────────────────────┤
    │   ml/inference/modelRouter.js                  │
    │   Rule→ML→Embeddings→LLM fallback chain       │
    │                                               │
    ├── Build Assistant Controller + Routes ────────┤
    │   controllers/assistantController.js            │
    │   routes/assistant.js                          │
    │   Depends on: orchestrator                     │
    │                                               │
    ├── Update server.js ───────────────────────────┤
    │   Add: app.use('/api/assistant', ...)          │
    │                                               │
    ├── Update frontend API service ────────────────┤
    │   frontend/src/services/api.js                 │
    │   Add: assistantAPI methods                    │
    │                                               │
    └── Enhance AI Insights page ───────────────────┘
        frontend/src/pages/AIInsights.jsx
        Add: query input, response display, history
                                                    │
                                                    ▼
                                           ASSISTANT ENGINE READY
                                                    │
                                                    ▼
WEEK 4: RECOMMENDATION ENGINE + CHATBOT
─────────────────────────────────────────

Recommendation Engine (depends on: AI Infrastructure, partially on Assistant)
    │
    ├── Build Behavior Analyzer (B1) ───────────────┐
    │   engines/recommendation/behaviorAnalyzer.js   │
    │   Depends on: Activity model                   │
    │                                               │
    ├── Build Need Analyzer (B2) ───────────────────┤
    │   engines/recommendation/needAnalyzer.js        │
    │   Depends on: Business, Product models         │
    │                                               │
    ├── Build Recommendation Scorer (B3) ───────────┤
    │   engines/recommendation/recommendationScorer.js│
    │   Depends on: B1, B2, Product model            │
    │                                               │
    ├── Build Adaptive Ranker (B4) ─────────────────┤
    │   engines/recommendation/adaptiveRanker.js      │
    │   Depends on: B3, Activity model (feedback)    │
    │                                               │
    ├── Build Controller + Routes ──────────────────┤
    │   controllers/recommendationController.js       │
    │   routes/recommendations.js                    │
    │                                               │
    ├── Update server.js ───────────────────────────┤
    │   Add: app.use('/api/recommendations', ...)    │
    │                                               │
    └── Build Recommendation Widget ────────────────┘
        frontend/src/components/Recommendations.jsx
                                                    │
Chatbot Enhancement (depends on: AI Infrastructure)
    │
    ├── Build NLP Processor (G1) ───────────────────┐
    │   engines/chatbot/nlpProcessor.js               │
    │   Depends on: intentClassifier (reuse from A1) │
    │                                               │
    ├── Build Memory Manager (G2) ──────────────────┤
    │   engines/chatbot/memoryManager.js              │
    │   Depends on: Conversation, Message models     │
    │                                               │
    ├── Build Context Manager (G3) ─────────────────┤
    │   engines/chatbot/contextManager.js             │
    │   Depends on: G2, User model                   │
    │                                               │
    ├── Build Answer Generator (G4) ────────────────┤
    │   engines/chatbot/answerGenerator.js            │
    │   Depends on: G1, G2, G3, geminiClient         │
    │                                               │
    ├── Enhance chatbotService.js ──────────────────┤
    │   Integrate G1→G2→G3→G4 pipeline              │
    │                                               │
    ├── Enhance chatbotController.js ───────────────┤
    │   Add: conversation management endpoints       │
    │                                               │
    ├── Enhance chatbot routes ─────────────────────┤
    │   Add: GET /conversations, GET /:id, PUT /:id  │
    │                                               │
    └── Enhance Chatbot Panel ──────────────────────┘
        frontend ChatPanel.jsx with streaming, memory
```

### 4.2 Module Dependency Matrix

| Module | Depends On | Required By | Parallelizable With |
|--------|------------|-------------|---------------------|
| P0-1 Password Policy | Nothing | P0-3 (JWT hardening) | P0-5, P0-6 |
| P0-2 Rate Limiting | Nothing | Nothing | P0-1, P0-5, P0-6 |
| P0-3 JWT Hardening | P0-1 | P0-10 (Audit) | P0-2, P0-4 |
| P0-4 Input Sanitization | Nothing | P0-7 (Error sanitization) | P0-1, P0-2, P0-5 |
| P0-5 CORS Config | Nothing | Nothing | All P0 items |
| P0-6 Env Validation | Nothing | Nothing | All P0 items |
| P0-7 Error Sanitization | P0-4 | Nothing | P0-2, P0-3 |
| P0-8 File Upload Security | Nothing | Nothing | P0-1, P0-2, P0-5 |
| P0-9 API Key Rotation | Nothing | Nothing | P0-1, P0-2, P0-5 |
| P0-10 Auth Audit | P0-3 | Nothing | P0-2, P0-4, P0-7 |
| AI Folder Structure | Nothing | All AI modules | All P0 items |
| Gemini Client | AI Folder | All Engines | P0-8, P0-9 |
| OpenAI Client | AI Folder | All Engines (fallback) | P0-8, P0-9 |
| Embedding Client | AI Folder | Assistant, Recommendation | P0-8, P0-9 |
| Orchestrator Core | Gemini, OpenAI Clients | Assistant, Chatbot | P0-8, P0-9 |
| AI Middleware | AI Folder | All AI routes | P0-8, P0-9 |
| AI DB Models | AI Folder | Assistant, Chatbot | P0-8, P0-9 |
| Intent Classifier (A1) | Embedding, Gemini Clients | Assistant, Chatbot | Recommendation Engines |
| Context Builder (A2) | User, Activity models | Assistant | Recommendation Engines |
| Knowledge Retriever (A3) | A2, all entity models | Assistant | Recommendation Engines |
| Response Generator (A4) | A3, Gemini Client | Assistant | Recommendation Engines |
| Behavior Analyzer (B1) | Activity model | Recommendation Scorer | Assistant Engines |
| Need Analyzer (B2) | Business, Product models | Recommendation Scorer | Assistant Engines |
| Recommendation Scorer (B3) | B1, B2, Product model | Adaptive Ranker | Assistant Engines |
| Adaptive Ranker (B4) | B3, Activity model | Recommendation Controller | Chatbot Engines |
| NLP Processor (G1) | Intent Classifier (A1) | Chatbot Pipeline | Recommendation Engines |
| Memory Manager (G2) | Conversation, Message models | Chatbot Pipeline | Recommendation Engines |
| Context Manager (G3) | G2, User model | Chatbot Pipeline | Recommendation Engines |
| Answer Generator (G4) | G1, G2, G3, Gemini Client | Chatbot Controller | Recommendation Engines |

### 4.3 Estimated Implementation Sequence

```
WEEK 1 — SECURITY FOUNDATION (5 days)
═══════════════════════════════════════

Day 1 (Mon): P0-6 (.env fix + env validation) — 30 min
             P0-5 (CORS config) — 15 min
             P0-1 (Password policy) — 20 min
             Total: ~1 hour

Day 2 (Tue): P0-3 (JWT hardening) — 2 hours
             P0-10 (Auth audit logging) — 1 hour
             Total: ~3 hours

Day 3 (Wed): P0-4 (Input sanitization) — 2 hours
             P0-7 (Error sanitization) — 1 hour
             Total: ~3 hours

Day 4 (Thu): P0-2 (Auth rate limiting) — 1 hour
             P0-8 (File upload security) — 1.5 hours
             Total: ~2.5 hours

Day 5 (Fri): P0-9 (API key rotation) — 2 hours
             Security testing + verification — 2 hours
             Total: ~4 hours

Week 1 Total: ~13.5 hours of implementation
═══════════════════════════════════════════════════════

WEEK 2 — AI INFRASTRUCTURE (5 days)
═══════════════════════════════════════

Day 1 (Mon): Create AI folder structure — 30 min
             Refactor Gemini client (aiService.js → geminiClient.js) — 3 hours
             Total: ~3.5 hours

Day 2 (Tue): Refactor OpenAI client (openaiService.js → openaiClient.js) — 2 hours
             Build Embedding client — 1.5 hours
             Total: ~3.5 hours

Day 3 (Wed): Build Orchestrator core (index.js, queryRouter.js) — 3 hours
             Build Context Manager — 1.5 hours
             Total: ~4.5 hours

Day 4 (Thu): Build Memory Manager — 1.5 hours
             Build Response Builder — 1.5 hours
             Build AI middleware stack (6 middleware files) — 2 hours
             Total: ~5 hours

Day 5 (Fri): Create AI database models (AiConversation, AiCache, AiEmbedding) — 2 hours
             Update config/indexes.js — 30 min
             Update server.js with new routes — 30 min
             Integration testing — 2 hours
             Total: ~5 hours

Week 2 Total: ~21.5 hours of implementation
═══════════════════════════════════════════════════════

WEEK 3 — ASSISTANT ENGINE (5 days)
═══════════════════════════════════════

Day 1 (Mon): Build Intent Classifier (A1) — 4 hours
             Build Context Builder (A2) — 3 hours
             Total: ~7 hours

Day 2 (Tue): Build Knowledge Retriever (A3) — 4 hours
             Build Response Generator (A4) — 3 hours
             Total: ~7 hours

Day 3 (Wed): Build utility modules (promptBuilder, responseParser, safetyFilter) — 3 hours
             Build Model Router (fallback chain) — 2 hours
             Total: ~5 hours

Day 4 (Thu): Build Assistant Controller — 1.5 hours
             Build Assistant Routes — 30 min
             Update server.js — 15 min
             Update frontend API service — 30 min
             Total: ~2.75 hours

Day 5 (Fri): Enhance AI Insights page (query interface) — 3 hours
             Integration testing — 2 hours
             Bug fixes — 1 hour
             Total: ~6 hours

Week 3 Total: ~27.75 hours of implementation
═══════════════════════════════════════════════════════

WEEK 4 — RECOMMENDATION ENGINE + CHATBOT (5 days)
═══════════════════════════════════════

Day 1 (Mon): Build Behavior Analyzer (B1) — 3 hours
             Build Need Analyzer (B2) — 2.5 hours
             Total: ~5.5 hours

Day 2 (Tue): Build Recommendation Scorer (B3) — 4 hours
             Build Adaptive Ranker (B4) — 3 hours
             Total: ~7 hours

Day 3 (Wed): Build Recommendation Controller + Routes — 1.5 hours
             Update server.js — 15 min
             Build Recommendation Widget (frontend) — 3 hours
             Total: ~4.75 hours

Day 4 (Thu): Build NLP Processor (G1) — 3 hours
             Build Memory Manager (G2) — 2.5 hours
             Total: ~5.5 hours

Day 5 (Fri): Build Context Manager (G3) — 2.5 hours
             Build Answer Generator (G4) — 3 hours
             Enhance chatbotService.js with pipeline — 1.5 hours
             Enhance chatbotController.js + routes — 1 hour
             Total: ~8 hours

Week 4 Total: ~30.75 hours of implementation
═══════════════════════════════════════════════════════

TOTAL: ~93.5 hours of implementation over 4 weeks
```

---

## 5. CHECKLISTS

### 5.1 Phase 0 Completion Checklist

**P0-1: Password Policy Enforcement**
- [ ] `backend/validators/auth.js` — Change `min: 6` to `min: 8`
- [ ] `backend/validators/auth.js` — Add `(?=.*[!@#$%^&*])` special character requirement
- [ ] `backend/validators/auth.js` — Update error message to list all requirements
- [ ] Test: Register with `Pass1!` (too short) → should fail
- [ ] Test: Register with `password1!` (no uppercase) → should fail
- [ ] Test: Register with `PASSWORD1!` (no lowercase) → should fail
- [ ] Test: Register with `Password!` (no number) → should fail
- [ ] Test: Register with `Password1` (no special char) → should fail
- [ ] Test: Register with `Passw0rd!` (valid) → should succeed

**P0-2: Rate Limiting on Auth Routes**
- [ ] `backend/server.js` — Add `authLimiter`: 5 requests/min on `/api/auth/login`
- [ ] `backend/server.js` — Add `registerLimiter`: 3 requests/hour on `/api/auth/register`
- [ ] `backend/server.js` — Apply auth limiters BEFORE global limiter
- [ ] Test: Hit login 6 times in 1 minute → 6th request should be blocked
- [ ] Test: Hit register 4 times in 1 hour → 4th request should be blocked
- [ ] Test: Other API routes still use global 100/15min limit

**P0-3: JWT Token Hardening**
- [ ] `backend/controllers/authController.js` — Change `generateToken` expiry from `'30d'` to `'15m'`
- [ ] `backend/controllers/authController.js` — Add refresh token generation on login (use existing `generateRefreshToken` from helpers.js)
- [ ] `backend/controllers/authController.js` — Add `logout` handler that adds token to blacklist
- [ ] `backend/controllers/authController.js` — Add `refreshToken` handler that validates refresh token and issues new access token
- [ ] `backend/middleware/auth.js` — Add blacklist check before token verification
- [ ] `backend/routes/auth.js` — Add `POST /logout` route
- [ ] `backend/routes/auth.js` — Add `POST /refresh` route
- [ ] Test: Login → get access token (15min) + refresh token (7d)
- [ ] Test: Use access token after 15min → should fail
- [ ] Test: Use refresh token → get new access token
- [ ] Test: Logout → old token should be blacklisted
- [ ] Test: Use blacklisted token → should fail

**P0-4: Input Sanitization & Validation**
- [ ] `backend/middleware/validate.js` — Add `sanitizeInput()` function that strips `$` and `.` from object keys
- [ ] `backend/middleware/validate.js` — Add `xssSanitize()` function that HTML-encodes string values
- [ ] `backend/middleware/validate.js` — Apply sanitization after validation passes, before `next()`
- [ ] `backend/validators/generic.js` — Add `.isLength({ max: 200 })` to all string fields
- [ ] `backend/validators/generic.js` — Add `.isIn()` for enum fields where applicable
- [ ] Test: Send `{ "email": { "$gt": "" } }` → `$gt` should be stripped
- [ ] Test: Send `{ "name": "<script>alert('xss')</script>" }` → should be HTML-encoded
- [ ] Test: Send string >200 chars → should be rejected

**P0-5: CORS Configuration**
- [ ] `backend/server.js` — Replace `app.use(cors())` with restricted `corsOptions`
- [ ] `backend/server.js` — Add `CORS_ORIGINS` env var support (comma-separated)
- [ ] `backend/.env` — Add `CORS_ORIGINS=http://localhost:5173,http://localhost:3000`
- [ ] Test: Request from allowed origin → should succeed
- [ ] Test: Request from disallowed origin → should be blocked
- [ ] Test: Preflight OPTIONS request → should return correct CORS headers

**P0-6: Environment Variable Validation**
- [ ] `backend/.env` — Fix `MONGO_URI:` to `MONGO_URI=`
- [ ] `backend/server.js` — Add `validateEnv()` function that checks required vars
- [ ] `backend/server.js` — Call `validateEnv()` before `connectDB()`
- [ ] `backend/server.js` — Exit process with clear error message if vars missing
- [ ] Test: Remove MONGO_URI → server should fail to start with clear message
- [ ] Test: All vars present → server should start normally

**P0-7: Error Message Sanitization**
- [ ] `backend/middleware/errorHandler.js` — Add `sanitizeMessage()` function for production mode
- [ ] `backend/middleware/errorHandler.js` — Strip file paths, connection strings, API keys from error messages
- [ ] `backend/middleware/errorHandler.js` — Add generic fallback messages for 500 errors
- [ ] `backend/middleware/errorHandler.js` — Keep full error in `console.error` for debugging
- [ ] Test: Trigger error in development mode → should show full stack trace
- [ ] Test: Set `NODE_ENV=production` → error should show sanitized message

**P0-8: File Upload Security**
- [ ] `backend/middleware/upload.js` — Create new file with multer configuration
- [ ] `backend/middleware/upload.js` — Add file type whitelist: `['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain']`
- [ ] `backend/middleware/upload.js` — Add file size limit: 10MB
- [ ] `backend/middleware/upload.js` — Add filename sanitization (remove special chars, path traversal)
- [ ] `backend/middleware/upload.js` — Add virus scanning placeholder with console warning
- [ ] Test: Upload valid PDF → should succeed
- [ ] Test: Upload `.exe` file → should be rejected
- [ ] Test: Upload file >10MB → should be rejected
- [ ] Test: Upload file with path traversal name (`../../etc/passwd`) → should be sanitized

**P0-9: API Key Rotation Mechanism**
- [ ] `backend/services/aiService.js` — Parse comma-separated `GEMINI_API_KEY` values
- [ ] `backend/services/aiService.js` — Add key rotation on 429 (rate limit) and 401 (auth) errors
- [ ] `backend/services/aiService.js` — Add fallback chain: primary → secondary → mock
- [ ] `backend/services/ai/openaiService.js` — Same key rotation pattern
- [ ] `backend/.env` — Add secondary key vars (commented out)
- [ ] Test: Primary key returns 429 → should rotate to secondary key
- [ ] Test: All keys exhausted → should fall back to mock data

**P0-10: Audit Logging for Auth Events**
- [ ] `backend/controllers/authController.js` — Add `logActivity` call on successful register
- [ ] `backend/controllers/authController.js` — Add `logActivity` call on successful login
- [ ] `backend/controllers/authController.js` — Add `logActivity` call on failed login (before error throw)
- [ ] `backend/controllers/authController.js` — Add `logActivity` call on logout
- [ ] `backend/controllers/authController.js` — Add `logActivity` call on profile update
- [ ] Test: Register → check Activity collection for `action: 'create'`, `resource: 'user'`
- [ ] Test: Login → check Activity collection for `action: 'login'`, `resource: 'auth'`
- [ ] Test: Failed login → check Activity collection for failed login record
- [ ] Test: Logout → check Activity collection for `action: 'logout'`

### 5.2 Phase 1 Module Checklist

**AI Infrastructure (Week 2)**

- [ ] `backend/services/ai/orchestrator/index.js` — Main orchestrator entry point
- [ ] `backend/services/ai/orchestrator/queryRouter.js` — Intent-based query routing
- [ ] `backend/services/ai/orchestrator/contextManager.js` — Session & user context
- [ ] `backend/services/ai/orchestrator/memoryManager.js` — Short/long-term memory
- [ ] `backend/services/ai/orchestrator/responseBuilder.js` — Response formatting
- [ ] `backend/services/ai/clients/geminiClient.js` — Gemini API client (refactored)
- [ ] `backend/services/ai/clients/openaiClient.js` — OpenAI API client (refactored)
- [ ] `backend/services/ai/clients/embeddingClient.js` — Embedding generation
- [ ] `backend/services/ai/middleware/aiRateLimiter.js` — AI-specific rate limiting
- [ ] `backend/services/ai/middleware/aiAuth.js` — AI feature access control
- [ ] `backend/services/ai/middleware/contextLoader.js` — Session context loading
- [ ] `backend/services/ai/middleware/auditLogger.js` — AI interaction logging
- [ ] `backend/services/ai/middleware/costTracker.js` — Token usage tracking
- [ ] `backend/services/ai/middleware/cacheCheck.js` — Redis cache check
- [ ] `backend/services/ai/middleware/safetyFilter.js` — Content safety
- [ ] `backend/models/AiConversation.js` — AI conversation model
- [ ] `backend/models/AiCache.js` — AI cache model
- [ ] `backend/models/AiEmbedding.js` — AI embedding model
- [ ] `backend/config/indexes.js` — Updated with AI collection indexes

**Assistant Engine (Week 3)**

- [ ] `backend/services/ai/engines/assistant/intentClassifier.js` — A1: MultiLayerIntentClassifier
- [ ] `backend/services/ai/engines/assistant/contextBuilder.js` — A2: TemporalContextBuilder
- [ ] `backend/services/ai/engines/assistant/knowledgeRetriever.js` — A3: HybridKnowledgeRetriever
- [ ] `backend/services/ai/engines/assistant/responseGenerator.js` — A4: ContextAwareResponseGenerator
- [ ] `backend/services/ai/utils/promptBuilder.js` — Dynamic prompt construction
- [ ] `backend/services/ai/utils/responseParser.js` — LLM response parsing
- [ ] `backend/services/ai/utils/safetyFilter.js` — Content safety filter
- [ ] `backend/services/ai/ml/inference/modelRouter.js` — Model routing with fallback chain
- [ ] `backend/controllers/assistantController.js` — Assistant endpoints
- [ ] `backend/routes/assistant.js` — Assistant route definitions
- [ ] `backend/server.js` — Updated with `/api/assistant` route
- [ ] `frontend/src/services/api.js` — Updated with assistant API methods
- [ ] `frontend/src/pages/AIInsights.jsx` — Enhanced with query interface

**Recommendation Engine (Week 4)**

- [ ] `backend/services/ai/engines/recommendation/behaviorAnalyzer.js` — B1: BehavioralProfileAnalyzer
- [ ] `backend/services/ai/engines/recommendation/needAnalyzer.js` — B2: EnterpriseNeedAnalyzer
- [ ] `backend/services/ai/engines/recommendation/recommendationScorer.js` — B3: MultiFactorRecommendationScorer
- [ ] `backend/services/ai/engines/recommendation/adaptiveRanker.js` — B4: AdaptiveRankingOptimizer
- [ ] `backend/controllers/recommendationController.js` — Recommendation endpoints
- [ ] `backend/routes/recommendations.js` — Recommendation route definitions
- [ ] `backend/server.js` — Updated with `/api/recommendations` route
- [ ] `frontend/src/services/api.js` — Updated with recommendation API methods
- [ ] `frontend/src/components/Recommendations.jsx` — Recommendation widget

**Chatbot Engine (Week 4)**

- [ ] `backend/services/ai/engines/chatbot/nlpProcessor.js` — G1: NaturalLanguageProcessingFlow
- [ ] `backend/services/ai/engines/chatbot/memoryManager.js` — G2: ConversationMemoryManager
- [ ] `backend/services/ai/engines/chatbot/contextManager.js` — G3: ContextManager
- [ ] `backend/services/ai/engines/chatbot/answerGenerator.js` — G4: AnswerGenerator
- [ ] `backend/services/ai/chatbotService.js` — Enhanced with full G1→G2→G3→G4 pipeline
- [ ] `backend/controllers/chatbotController.js` — Enhanced with conversation management
- [ ] `backend/routes/chatbot.js` — Enhanced with conversation routes
- [ ] `frontend/src/services/api.js` — Updated with conversation API methods
- [ ] Frontend ChatPanel — Enhanced with streaming, memory, context display

### 5.3 Final Verification Checklist

**Before declaring Phase 0 complete:**
- [ ] All 10 security fixes implemented and tested
- [ ] `.env` syntax fixed (`:` → `=`)
- [ ] Server starts without warnings
- [ ] All existing CRUD endpoints still work
- [ ] All existing auth endpoints still work
- [ ] All existing AI endpoints still work
- [ ] No breaking changes to frontend API contract

**Before declaring Phase 1 complete:**
- [ ] AI folder structure created with all subdirectories
- [ ] Gemini client refactored with rate limiting, retry, caching
- [ ] OpenAI client refactored with client pattern
- [ ] Embedding client working
- [ ] Orchestrator routes queries correctly
- [ ] Assistant Engine: all 4 algorithms implemented
- [ ] Assistant Engine: POST /api/assistant/query returns correct response
- [ ] Recommendation Engine: all 4 algorithms implemented
- [ ] Recommendation Engine: GET /api/recommendations returns personalized results
- [ ] Chatbot Engine: all 4 algorithms implemented
- [ ] Chatbot Engine: POST /api/chatbot/message maintains conversation context
- [ ] All new database collections created with proper indexes
- [ ] All new API endpoints tested and working
- [ ] Frontend updated with new features
- [ ] No breaking changes to existing functionality

---

## APPENDIX: Key Files Reference

### Files to Create (Phase 0)

| # | File | Type | Purpose |
|---|------|------|---------|
| 1 | `backend/middleware/upload.js` | New | File upload security configuration |

### Files to Create (Phase 1)

| # | File | Type | Purpose |
|---|------|------|---------|
| 1 | `backend/services/ai/orchestrator/index.js` | New | Orchestrator entry point |
| 2 | `backend/services/ai/orchestrator/queryRouter.js` | New | Query routing |
| 3 | `backend/services/ai/orchestrator/contextManager.js` | New | Context management |
| 4 | `backend/services/ai/orchestrator/memoryManager.js` | New | Memory management |
| 5 | `backend/services/ai/orchestrator/responseBuilder.js` | New | Response formatting |
| 6 | `backend/services/ai/clients/geminiClient.js` | New | Gemini API client |
| 7 | `backend/services/ai/clients/openaiClient.js` | New | OpenAI API client |
| 8 | `backend/services/ai/clients/embeddingClient.js` | New | Embedding client |
| 9 | `backend/services/ai/engines/assistant/intentClassifier.js` | New | A1 algorithm |
| 10 | `backend/services/ai/engines/assistant/contextBuilder.js` | New | A2 algorithm |
| 11 | `backend/services/ai/engines/assistant/knowledgeRetriever.js` | New | A3 algorithm |
| 12 | `backend/services/ai/engines/assistant/responseGenerator.js` | New | A4 algorithm |
| 13 | `backend/services/ai/engines/recommendation/behaviorAnalyzer.js` | New | B1 algorithm |
| 14 | `backend/services/ai/engines/recommendation/needAnalyzer.js` | New | B2 algorithm |
| 15 | `backend/services/ai/engines/recommendation/recommendationScorer.js` | New | B3 algorithm |
| 16 | `backend/services/ai/engines/recommendation/adaptiveRanker.js` | New | B4 algorithm |
| 17 | `backend/services/ai/engines/chatbot/nlpProcessor.js` | New | G1 algorithm |
| 18 | `backend/services/ai/engines/chatbot/memoryManager.js` | New | G2 algorithm |
| 19 | `backend/services/ai/engines/chatbot/contextManager.js` | New | G3 algorithm |
| 20 | `backend/services/ai/engines/chatbot/answerGenerator.js` | New | G4 algorithm |
| 21 | `backend/services/ai/utils/promptBuilder.js` | New | Prompt construction |
| 22 | `backend/services/ai/utils/responseParser.js` | New | Response parsing |
| 23 | `backend/services/ai/utils/safetyFilter.js` | New | Safety filtering |
| 24 | `backend/services/ai/ml/inference/modelRouter.js` | New | Model routing |
| 25 | `backend/models/AiConversation.js` | New | AI conversation model |
| 26 | `backend/models/AiCache.js` | New | AI cache model |
| 27 | `backend/models/AiEmbedding.js` | New | AI embedding model |
| 28 | `backend/controllers/assistantController.js` | New | Assistant controller |
| 29 | `backend/controllers/recommendationController.js` | New | Recommendation controller |
| 30 | `backend/routes/assistant.js` | New | Assistant routes |
| 31 | `backend/routes/recommendations.js` | New | Recommendation routes |
| 32 | `frontend/src/components/Recommendations.jsx` | New | Recommendation widget |

### Files to Modify (Phase 0)

| # | File | Change |
|---|------|--------|
| 1 | `backend/.env` | Fix `MONGO_URI:` to `MONGO_URI=`, add `CORS_ORIGINS` |
| 2 | `backend/server.js` | Add env validation, CORS config, auth rate limiters |
| 3 | `backend/validators/auth.js` | Password policy: min 8, add special char |
| 4 | `backend/middleware/auth.js` | Add token blacklist check |
| 5 | `backend/middleware/errorHandler.js` | Add production-safe error messages |
| 6 | `backend/middleware/validate.js` | Add input sanitization |
| 7 | `backend/validators/generic.js` | Add max length limits |
| 8 | `backend/controllers/authController.js` | Token expiry, refresh, logout, audit logging |
| 9 | `backend/routes/auth.js` | Add logout + refresh routes |
| 10 | `backend/services/aiService.js` | Add multi-key rotation |
| 11 | `backend/services/ai/openaiService.js` | Add multi-key rotation |

### Files to Modify (Phase 1)

| # | File | Change |
|---|------|--------|
| 1 | `backend/services/aiService.js` | Refactor to orchestrator entry point |
| 2 | `backend/services/ai/openaiService.js` | Refactor to client pattern |
| 3 | `backend/services/ai/chatbotService.js` | Enhance with full G1→G2→G3→G4 pipeline |
| 4 | `backend/controllers/aiController.js` | Route through orchestrator |
| 5 | `backend/controllers/chatbotController.js` | Add conversation management |
| 6 | `backend/routes/ai.js` | Add assistant route registration |
| 7 | `backend/routes/chatbot.js` | Add conversation routes |
| 8 | `backend/server.js` | Add `/api/assistant`, `/api/recommendations` routes |
| 9 | `backend/config/indexes.js` | Add AI collection indexes |
| 10 | `frontend/src/services/api.js` | Add assistant, recommendation, conversation API methods |
| 11 | `frontend/src/pages/AIInsights.jsx` | Add assistant query interface |

---

*End of Implementation Blueprint — Phase 0 & Phase 1*