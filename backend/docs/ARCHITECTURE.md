# AI Enterprise Hub — Architecture Documentation

## System Overview

The AI Enterprise Hub is a modular enterprise AI platform built on Node.js, Express, MongoDB, and multiple AI providers (OpenAI, Gemini). It follows SOLID principles with strict separation of concerns across AI engines and services.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                        HTTP Layer                                │
│  Routes → Validators → Controllers → AI Middleware (safety,      │
│  audit, rate-limit, cost-tracking)                               │
├─────────────────────────────────────────────────────────────────┤
│                        AI Engine Layer                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │  Assistant    │ │  RAG & KB    │ │  Recommendation Engine   │ │
│  │  Engine       │ │  Engine      │ │  (Phase 3B)              │ │
│  │  (Phase 2)    │ │  (Phase 3A)  │ │                          │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │      Document Intelligence Engine (Phase 3C)                │ │
│  │  Analyzer │ OCR │ Classification │ Summarization │          │ │
│  │  Extraction │ Metadata │ Comparison                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │        Analytics Engine (Phase 4)                           │ │
│  │  Metrics Collector │ Insight Generator │ Prediction         │ │
│  │  Service │ ML Service Layer                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                  AI Infrastructure Layer (Phase 1)               │
│  Orchestrator │ Context Manager │ Memory Manager │ Query Router │
│  Response Builder │ AI Middleware Stack                          │
│  (SafetyFilter, AuditLogger, CostTracker, RateLimiter, Cache)    │
├─────────────────────────────────────────────────────────────────┤
│                  Provider Layer                                  │
│  OpenAI Client (with key rotation & retry) │ Gemini Client       │
│  Embedding Client (with fallback)                                 │
├─────────────────────────────────────────────────────────────────┤
│                  Data Layer                                      │
│  MongoDB Models: User, Business, Product, Customer, Compliance,  │
│  AiConversation, AiEmbedding, AiCache, AiKnowledgeDocument,      │
│  Recommendation, DocumentAnalysis, AnalyticsEvent, AiMetric     │
├─────────────────────────────────────────────────────────────────┤
│                  Monitoring Layer (Phase 5)                      │
│  Health Service │ Security Audit │ Docker │ CI/CD │ Docs          │
└─────────────────────────────────────────────────────────────────┘
```

## Phase Breakdown

### Phase 0 — Security Foundation ✅
- JWT authentication, bcrypt password hashing, token blacklist
- Input sanitization (NoSQL injection & XSS protection)
- Rate limiting, Helmet security headers, CORS

### Phase 1 — AI Infrastructure ✅
- Orchestrator pipeline: query routing, context building, memory management, response building
- AI middleware stack: safety filter, audit logging, cost tracking, rate limiting, caching, authorization
- Provider clients with key rotation and fallback support
- AI models: AiConversation, AiCache, AiEmbedding, AiConversationSession, AiToolCall

### Phase 2 — Assistant Engine ✅
- Session management with enterprise profiles
- Tool registry with enterprise tools (knowledge, computation)
- Template system for general, business, education, healthcare
- Streaming support

### Phase 3A — Enterprise RAG & Knowledge Base ✅
- Document ingestion pipeline: parse → chunk → embed → persist
- Semantic search with vector similarity scoring
- Retrieval service with augmented context for assistants
- Citation generation

### Phase 3B — Recommendation Engine ✅
- Candidate sourcing across multiple data sources
- Weighted ranking with scoring breakdown
- Personalization with user profile and category affinity
- Feedback management and caching

### Phase 3C — Document Intelligence ✅ *(New in this implementation)*
- **Document Intelligence Engine:** Central orchestrator for all document AI operations
- **OCR Service:** Image preprocessing with sharp, external provider support (Tesseract, API), metadata fallback
- **Document Analyzer:** Full pipeline coordinating parse → OCR → classify → summarize → extract → analyze
- **Extraction Service:** Entity, table, field, form data, and structured data extraction
- **Classification Service:** 15 document types with pattern-based scoring and confidence estimation
- **Summarization Service:** AI-powered and extractive (SentenceRank) summarization
- **Document Comparison Service:** Hybrid semantic (embedding) + keyword similarity with difference detection
- **Metadata Extractor:** PDF/DOCX/TXT metadata, language detection, readability scoring

### Phase 4 — ML & AI Analytics ✅ *(New in this implementation)*
- **Analytics Engine:** Central orchestrator for analytics and ML services
- **Metrics Collector:** Event tracking, batch processing, metric aggregation
- **Insight Generator:** Usage patterns, anomaly detection (statistical), recommendations
- **Prediction Service:** Linear regression forecasting, user engagement prediction, confidence scoring
- **ML Service Layer:** Feature extraction, feature vector building, model registry

### Phase 5 — Production Readiness ✅ *(New in this implementation)*
- **Monitoring:** Health checks (DB, memory, uptime), performance metrics, error tracking
- **Security Audit:** JWT strength, env config, rate limiting, upload security, dependency checks
- **Docker:** Multi-stage build, non-root user, healthcheck, resource limits
- **CI/CD:** GitHub Actions with test → build → deploy pipeline
- **Tests:** Integration test structure and module loading validation
- **Documentation:** API reference, deployment guide, architecture overview

## Key Design Patterns

1. **Singleton Pattern:** All engines and services export singletons for consistent state
2. **SOLID Principles:** Each module has a single responsibility
3. **Orchestration Pattern:** Engines orchestrate and delegate to specialized services
4. **Middleware Pipeline:** Reusable AI middleware chain for safety, audit, cost tracking
5. **Fallback Pattern:** AI providers degrade gracefully to mock/fallback responses
6. **Caching Pattern:** Multi-level caching (in-memory, Mongo TTL) with invalidation
7. **Module Registry:** Engine registry for capability discovery and availability checks

## Data Flow

1. **HTTP Request** → Route → Validator → Controller
2. Controller calls **Engine** (single entry point)
3. Engine delegates to **specialized services**
4. Services use **models** for persistence and **clients** for AI provider calls
5. All AI requests pass through **AI middleware** (safety, audit, cost, rate limit)
6. **Response Builder** assembles the final response

## New Database Collections (Phase 3C & 4)

| Collection | Model | Purpose |
|-----------|-------|---------|
| `documentanalyses` | DocumentAnalysis | Document intelligence results |
| `analyticsevents` | AnalyticsEvent | User/AI/recommendation events |
| `aimetrics` | AiMetric | Aggregated performance metrics |