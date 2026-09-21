# AI Enterprise Hub — AI Implementation Planning Document

> **Document Version:** 1.0  
> **Status:** Implementation Planning Complete  
> **Prepared For:** Phase 1-6 Development  
> **Based On:** Architecture Design, Algorithm Design, Model Strategy, Data Flow Diagrams

---

## TABLE OF CONTENTS

1. [AI Backend Architecture Plan](#1-ai-backend-architecture-plan)
2. [AI Feature Implementation Mapping](#2-ai-feature-implementation-mapping)
3. [API Design Document](#3-api-design-document)
4. [Database Design Update](#4-database-design-update)
5. [Development Roadmap](#5-development-roadmap)

---

## 1. AI BACKEND ARCHITECTURE PLAN

### 1.1 AI Services Folder Structure

The current `backend/services/ai/` directory will be expanded into a comprehensive AI services architecture:

```
backend/services/ai/
├── index.js                          # AI service aggregator & exports
├── orchestrator/
│   ├── index.js                      # AI Orchestrator - main entry point
│   ├── queryRouter.js                # Intent-based query routing
│   ├── contextManager.js             # Session & user context management
│   ├── memoryManager.js              # Short-term & long-term memory
│   └── responseBuilder.js            # Response formatting & enrichment
├── clients/
│   ├── geminiClient.js               # Gemini API client (primary LLM)
│   ├── openaiClient.js               # OpenAI API client (fallback LLM)
│   ├── embeddingClient.js            # Embedding generation (Gemini + OpenAI)
│   └── visionClient.js               # Vision/OCR client (Gemini Pro Vision)
├── engines/
│   ├── assistant/
│   │   ├── intentClassifier.js       # MultiLayerIntentClassifier (A1)
│   │   ├── contextBuilder.js         # TemporalContextBuilder (A2)
│   │   ├── knowledgeRetriever.js     # HybridKnowledgeRetriever (A3)
│   │   └── responseGenerator.js      # ContextAwareResponseGenerator (A4)
│   ├── recommendation/
│   │   ├── behaviorAnalyzer.js       # BehavioralProfileAnalyzer (B1)
│   │   ├── needAnalyzer.js           # EnterpriseNeedAnalyzer (B2)
│   │   ├── recommendationScorer.js   # MultiFactorRecommendationScorer (B3)
│   │   └── adaptiveRanker.js         # AdaptiveRankingOptimizer (B4)
│   ├── document/
│   │   ├── documentProcessor.js      # IntelligentDocumentProcessor (C1)
│   │   ├── entityClassifier.js       # SemanticEntityClassifier (C2)
│   │   ├── documentSummarizer.js     # MultiLevelDocumentSummarizer (C3)
│   │   └── criticalDataExtractor.js  # CriticalDataExtractor (C4)
│   ├── analytics/
│   │   ├── dataCollector.js          # IntelligentDataCollector (D1)
│   │   ├── patternDetector.js        # MultiPatternDetector (D2)
│   │   ├── trendAnalyzer.js          # PredictiveTrendAnalyzer (D3)
│   │   └── businessPredictor.js      # EnterprisePredictionEngine (D4)
│   ├── automation/
│   │   ├── taskIdentifier.js         # AutomationTaskIdentifier (E1)
│   │   ├── workflowBuilder.js        # DynamicWorkflowBuilder (E2)
│   │   ├── decisionAutomator.js      # DecisionAutomationEngine (E3)
│   │   └── processOptimizer.js       # ProcessOptimizationEngine (E4)
│   ├── security/
│   │   ├── behaviorMonitor.js        # UserBehaviorMonitor (F1)
│   │   ├── anomalyDetector.js        # AnomalyDetectionEngine (F2)
│   │   ├── riskCalculator.js         # RiskCalculator (F3)
│   │   └── threatIdentifier.js       # ThreatIdentifier (F4)
│   └── chatbot/
│       ├── nlpProcessor.js           # NaturalLanguageProcessingFlow (G1)
│       ├── memoryManager.js          # ConversationMemoryManager (G2)
│       ├── contextManager.js         # ContextManager (G3)
│       └── answerGenerator.js        # AnswerGenerator (G4)
├── ml/
│   ├── models/
│   │   ├── tfidfVectorizer.js        # TF-IDF for text features
│   │   ├── naiveBayesClassifier.js   # Fast intent classification
│   │   ├── kmeansClusterer.js        # Customer/user segmentation
│   │   ├── logisticRegression.js     # Risk scoring
│   │   ├── isolationForest.js        # Anomaly detection
│   │   ├── linearRegression.js       # Trend prediction
│   │   ├── decisionTree.js           # Rule extraction
│   │   └── knnClassifier.js          # Similarity-based recommendations
│   ├── training/
│   │   ├── modelTrainer.js           # Training pipeline
│   │   ├── modelEvaluator.js         # Evaluation & validation
│   │   └── modelRegistry.js          # Version control & storage
│   └── inference/
│       ├── modelRouter.js            # Route to best model
│       └── ensembleFusion.js         # Multi-model result fusion
├── cache/
│   ├── responseCache.js              # AI response caching (Redis)
│   ├── embeddingCache.js             # Embedding cache
│   └── modelCache.js                 # Model prediction cache
├── pipeline/
│   ├── dataIngestion.js              # Data collection & validation
│   ├── dataPreprocessing.js          # Cleaning & normalization
│   ├── featureExtraction.js          # Feature engineering
│   └── postProcessing.js             # Result validation & formatting
└── utils/
    ├── promptBuilder.js              # Dynamic prompt construction
    ├── responseParser.js             # LLM response parsing
    ├── safetyFilter.js               # Content safety checks
    ├── rateLimiter.js                # API rate limiting
    ├── tokenTracker.js               # Token usage monitoring
    └── costOptimizer.js              # Cost optimization strategies
```

### 1.2 AI Controller Structure

Controllers will be organized by AI engine domain:

```
backend/controllers/
├── aiController.js                   # Existing - refactored to route to orchestrator
├── assistantController.js            # Enterprise Assistant endpoints
├── recommendationController.js       # Recommendation Engine endpoints
├── documentController.js             # Document Intelligence endpoints
├── analyticsController.js            # Analytics Engine endpoints
├── automationController.js           # Automation Engine endpoints
├── securityController.js             # Security Intelligence endpoints
├── chatbotController.js              # Existing - enhanced chatbot endpoints
└── enterpriseController.js           # Existing - enterprise operations
```

**Controller Responsibilities:**

| Controller | Key Methods | Purpose |
|------------|-------------|---------|
| `assistantController` | `query`, `getContext`, `getSuggestions` | Handle AI assistant queries |
| `recommendationController` | `getRecommendations`, `getPersonalized`, `getTrending` | Generate recommendations |
| `documentController` | `upload`, `analyze`, `summarize`, `extract` | Document processing |
| `analyticsController` | `getAnalytics`, `getTrends`, `getPredictions`, `getInsights` | Analytics & forecasting |
| `automationController` | `identifyTasks`, `createWorkflow`, `executeWorkflow`, `optimize` | Workflow automation |
| `securityController` | `getRiskScore`, `getAnomalies`, `getThreats`, `getAlerts` | Security monitoring |
| `chatbotController` | `sendMessage`, `getHistory`, `clearContext` | Chatbot interactions |

### 1.3 AI Routes Structure

```
backend/routes/
├── ai.js                             # Existing - refactored to use orchestrator
├── assistant.js                      # /api/assistant/*
├── recommendations.js                # /api/recommendations/*
├── documents.js                      # /api/documents/*
├── analytics.js                      # /api/analytics/*
├── automation.js                     # /api/automation/*
├── security.js                       # /api/security/*
├── chatbot.js                        # Existing - /api/chatbot/*
└── enterprise.js                     # Existing - /api/enterprise/*
```

**Route Registration in server.js:**
```javascript
app.use('/api/ai', require('./routes/ai'));                    // General AI (refactored)
app.use('/api/assistant', require('./routes/assistant'));      // Enterprise Assistant
app.use('/api/recommendations', require('./routes/recommendations')); // Recommendations
app.use('/api/documents', require('./routes/documents'));      // Document Intelligence
app.use('/api/analytics', require('./routes/analytics'));      // Analytics Engine
app.use('/api/automation', require('./routes/automation'));    // Automation Engine
app.use('/api/security', require('./routes/security'));        // Security Intelligence
app.use('/api/chatbot', require('./routes/chatbot'));          // Chatbot (enhanced)
app.use('/api/enterprise', require('./routes/enterprise'));    // Enterprise (existing)
```

### 1.4 AI Middleware Requirements

| Middleware | Purpose | Applied To |
|-----------|---------|------------|
| `auth` (existing) | JWT verification, user identification | All AI routes |
| `rateLimiter` | AI-specific rate limiting (stricter) | All AI routes |
| `validateRequest` | Input validation & sanitization | Per-endpoint |
| `aiAuth` | AI feature access control (RBAC) | Per-engine routes |
| `contextLoader` | Load user context & session data | Assistant, Chatbot |
| `auditLogger` | Log AI interactions for compliance | All AI routes |
| `costTracker` | Track API token usage & costs | All LLM calls |
| `cacheCheck` | Check Redis cache before AI processing | All AI routes |
| `safetyFilter` | Content safety & PII detection | All AI routes |

**New Middleware Files:**
```
backend/middleware/
├── auth.js                          # Existing
├── errorHandler.js                  # Existing
├── validate.js                      # Existing
├── aiRateLimiter.js                 # AI-specific rate limiting
├── aiAuth.js                        # AI feature access control
├── contextLoader.js                 # Session & user context
├── auditLogger.js                   # AI interaction logging
├── costTracker.js                   # Token usage tracking
├── cacheCheck.js                    # Redis cache middleware
└── safetyFilter.js                  # Content safety
```

### 1.5 Database Integration Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATABASE INTEGRATION FLOW                              │
│                                                                               │
│  AI Engine ──▶ Data Requirements ──▶ MongoDB Queries ──▶ Results ──▶ AI Process│
│       │                │                    │                    │            │
│       │                ▼                    ▼                    ▼            │
│       │         Collection Name      Query Pattern           Output Format    │
│       │                                                                       │
│       ├── Assistant:  users, businesses, products, activities, notifications  │
│       │   Pattern:    findById, find(filter), aggregate(pipeline)             │
│       │                                                                       │
│       ├── Recommend:  activities, users, products, businesses, customers      │
│       │   Pattern:    aggregate(group, sort), find(filter).sort().limit()     │
│       │                                                                       │
│       ├── Document:   documents, embeddings, chunks, extractions              │
│       │   Pattern:    findById, insertOne, updateOne, createIndex             │
│       │                                                                       │
│       ├── Analytics:  activities, orders, products, customers, reports        │
│       │   Pattern:    aggregate(match, group, sort, limit), find              │
│       │                                                                       │
│       ├── Automation: activities, workflows, decisions, processes             │
│       │   Pattern:    find, insertOne, updateOne, aggregate                   │
│       │                                                                       │
│       ├── Security:   activities, users, sessions, security_events            │
│       │   Pattern:    find(filter).sort(), aggregate, countDocuments          │
│       │                                                                       │
│       └── Chatbot:    conversations, messages, sessions, users                │
│           Pattern:    find, insertOne, updateOne, aggregate                   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.6 API Communication Flow

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│              │     │                  │     │                  │     │                  │
│  Frontend    │────▶│  Express Router  │────▶│  Controller      │────▶│  AI Orchestrator │
│  (React)     │     │  /api/{engine}   │     │  {engine}Ctrl    │     │  (queryRouter)   │
│              │     │                  │     │                  │     │                  │
│  - REST API  │     │  - Auth Check    │     │  - Validate      │     │  - Intent Route  │
│  - WebSocket │     │  - Rate Limit    │     │  - Parse Input   │     │  - Context Load  │
│  - SSE       │     │  - Cache Check   │     │  - Call Service  │     │  - Memory Load   │
│              │     │                  │     │  - Format Output │     │  - Route to Eng  │
└──────────────┘     └──────────────────┘     └──────────────────┘     └────────┬─────────┘
                                                                                │
                                                                                ▼
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│              │     │                  │     │                  │     │                  │
│  Response    │◀────│  Response        │◀────│  AI Engine       │◀────│  Model Router    │
│  to Client   │     │  Builder         │     │  (Algorithm)     │     │  (LLM/ML/Rules)  │
│              │     │                  │     │                  │     │                  │
│  - JSON      │     │  - Template      │     │  - Execute Algo  │     │  - Rule Check    │
│  - Stream    │     │  - Enrich        │     │  - DB Queries    │     │  - ML Model      │
│  - Markdown  │     │  - Format        │     │  - LLM Calls     │     │  - Embedding     │
│              │     │  - Cache Store   │     │  - ML Inference  │     │  - Gemini/OpenAI │
└──────────────┘     └──────────────────┘     └──────────────────┘     └──────────────────┘
```

---

## 2. AI FEATURE IMPLEMENTATION MAPPING

### A) AI Enterprise Assistant

**Required Backend Modules:**

| Module | File | Algorithm | Purpose |
|--------|------|-----------|---------|
| Intent Classifier | `engines/assistant/intentClassifier.js` | A1: MultiLayerIntentClassifier | Classify user queries into intents |
| Context Builder | `engines/assistant/contextBuilder.js` | A2: TemporalContextBuilder | Build rich contextual understanding |
| Knowledge Retriever | `engines/assistant/knowledgeRetriever.js` | A3: HybridKnowledgeRetriever | Retrieve relevant enterprise data |
| Response Generator | `engines/assistant/responseGenerator.js` | A4: ContextAwareResponseGenerator | Generate natural language responses |

**Required APIs:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/assistant/query` | POST | Process user query and return AI response |
| `/api/assistant/context` | GET | Get current user context |
| `/api/assistant/suggestions` | GET | Get contextual suggestions |
| `/api/assistant/history` | GET | Get query history |

**Required Database Collections:**
- `users` (existing) - User profile & preferences
- `businesses` (existing) - Business context
- `products` (existing) - Product catalog
- `activities` (existing) - User activity stream
- `notifications` (existing) - AI-generated notifications
- `ai_conversations` (new) - Query/response history
- `ai_cache` (new) - Cached AI responses

**Required AI Models:**
- Gemini 1.5 Pro (primary LLM for response generation)
- Gemini 1.5 Flash (intent classification, entity extraction)
- Gemini Embedding API (query embedding for retrieval)
- TF-IDF Vectorizer (local, fast intent classification)
- Naive Bayes Classifier (local, cached intent classification)

---

### B) AI Recommendation Engine

**Data Required:**

| Data Source | Fields Used | Purpose |
|-------------|-------------|---------|
| Activities | user, action, resource, timestamp, metadata | Behavior analysis |
| Users | _id, role, industry, preferences | User profiling |
| Products | _id, name, category, price, features, rating | Item catalog |
| Businesses | _id, industry, size, budget, status | Enterprise context |
| Customers | _id, industry, purchases, interactions | Customer patterns |

**Processing Pipeline:**

```
User Activity ──▶ Behavior Analyzer ──▶ Behavioral Profile
                     │
Enterprise Data ──▶ Need Analyzer ────▶ Enterprise Needs
                     │
                     ▼
              Multi-Factor Scorer ──▶ Scored Items
                     │
                     ▼
              Adaptive Ranker ──────▶ Ranked Recommendations
                     │
                     ▼
              Response Builder ──────▶ Formatted Response
```

**Recommendation Service Design:**

| Service Component | File | Algorithm | Function |
|-------------------|------|-----------|----------|
| Behavior Analyzer | `engines/recommendation/behaviorAnalyzer.js` | B1 | Analyze user actions, build profile |
| Need Analyzer | `engines/recommendation/needAnalyzer.js` | B2 | Identify business needs & gaps |
| Recommendation Scorer | `engines/recommendation/recommendationScorer.js` | B3 | Score items on multiple factors |
| Adaptive Ranker | `engines/recommendation/adaptiveRanker.js` | B4 | Optimize ranking with feedback |

**Required APIs:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/recommendations` | GET | Get personalized recommendations |
| `/api/recommendations/trending` | GET | Get trending items |
| `/api/recommendations/similar/:id` | GET | Get similar items |
| `/api/recommendations/feedback` | POST | Submit recommendation feedback |

---

### C) AI Document Intelligence

**File Processing Flow:**

```
User Upload ──▶ Validate Format ──▶ Extract Content ──▶ Chunk Text ──▶ Generate Embeddings
                    │                    │                    │                │
                    ▼                    ▼                    ▼                ▼
              Supported:           PDF → pdf-parse       Semantic         Gemini Embed
              PDF, DOCX,           DOCX → mammoth        Chunks           API
              Images, CSV,         Image → Gemini Vision  (1000 tokens)
              TXT, XLSX            CSV → csv-parse
                                   TXT → fs.readFile
```

**Document Analysis Pipeline:**

```
Document Chunks ──▶ Entity Classifier ──▶ Entities & Categories
                       │
                       ▼
                Multi-Level Summarizer ──▶ Executive Summary
                       │                       Detailed Summary
                       │                       Bullet Points
                       ▼                       Section-wise
                Critical Data Extractor ──▶ Action Items
                                              Deadlines
                                              Risks
                                              Decisions
```

**Storage Strategy:**

| Data Type | Storage | TTL | Index |
|-----------|---------|-----|-------|
| Original File | MongoDB GridFS / S3 | Permanent | file_id, user_id |
| Extracted Text | MongoDB (documents) | Permanent | user_id, created_at |
| Chunks | MongoDB (doc_chunks) | Permanent | document_id, chunk_index |
| Embeddings | MongoDB (embeddings) | 24h refresh | document_id, chunk_id |
| Analysis Results | MongoDB (doc_analyses) | Permanent | document_id, analysis_type |
| Summaries | MongoDB (doc_summaries) | Permanent | document_id, level |

**Required APIs:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/documents/upload` | POST | Upload document for processing |
| `/api/documents/:id/analyze` | GET | Get document analysis |
| `/api/documents/:id/summarize` | POST | Generate summary (level param) |
| `/api/documents/:id/extract` | GET | Extract critical data |
| `/api/documents/:id/entities` | GET | Get extracted entities |
| `/api/documents` | GET | List user's documents |

---

### D) AI Analytics Engine

**Data Collection:**

| Source | Collection Method | Frequency | Data Points |
|--------|-------------------|-----------|-------------|
| MongoDB Collections | Aggregation Pipeline | On-demand / Scheduled | Counts, sums, averages |
| Activity Logs | Real-time stream | Continuous | Actions, timestamps, users |
| External APIs | HTTP fetch | Configurable | Market data, benchmarks |
| User Feedback | Direct input | On interaction | Ratings, comments |

**Processing:**

```
Data Sources ──▶ Data Collector ──▶ Validate ──▶ Normalize ──▶ Aggregate ──▶ Time Series
                    │                                                              │
                    ▼                                                              ▼
              Pattern Detector ──▶ Trend Analysis ──▶ Seasonality ──▶ Correlations
                    │                                                              │
                    ▼                                                              ▼
              Anomaly Detection ──▶ Clustering ──▶ Pattern Summary
                    │                                                              │
                    ▼                                                              ▼
              Trend Analyzer ──▶ Model Selection ──▶ Forecast ──▶ Confidence Intervals
                    │                                                              │
                    ▼                                                              ▼
              Business Predictor ──▶ Risk Assessment ──▶ Opportunities ──▶ Recommendations
```

**Dashboard Integration:**

| Dashboard Component | Data Source | Update Frequency | Visualization |
|--------------------|-------------|------------------|---------------|
| Key Metrics | Data Collector | Real-time | Cards / Stat boxes |
| Trends | Pattern Detector | Daily | Line charts |
| Seasonality | Pattern Detector | Weekly | Heatmap / Calendar |
| Correlations | Pattern Detector | On-demand | Scatter plot / Matrix |
| Anomalies | Pattern Detector | Real-time | Alert badges / Timeline |
| Forecasts | Trend Analyzer | Daily | Line chart with CI bands |
| Predictions | Business Predictor | Weekly | Gauge / Score cards |

**Required APIs:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/analytics/overview` | GET | Get analytics overview |
| `/api/analytics/trends` | GET | Get trend analysis |
| `/api/analytics/patterns` | GET | Get detected patterns |
| `/api/analytics/forecast` | GET | Get predictions/forecasts |
| `/api/analytics/anomalies` | GET | Get detected anomalies |
| `/api/analytics/insights` | GET | Get business insights |

---

### E) AI Automation Engine

**Workflow Engine Design:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        WORKFLOW ENGINE ARCHITECTURE                           │
│                                                                               │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐            │
│  │  Task         │───▶│  Workflow        │───▶│  Workflow        │            │
│  │  Identifier   │    │  Builder         │    │  Validator       │            │
│  │               │    │                  │    │                  │            │
│  │  - Frequency  │    │  - Decompose     │    │  - Circular Dep  │            │
│  │  - Eligibility│    │  - Dependencies  │    │  - Completeness  │            │
│  │  - ROI Calc   │    │  - Conditions    │    │  - Integration   │            │
│  │  - Priority   │    │  - Error Handle  │    │  - Syntax Check  │            │
│  └──────────────┘    └──────────────────┘    └──────────────────┘            │
│                                                           │                   │
│                                                           ▼                   │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐            │
│  │  Process      │◀───│  Execution       │◀───│  Decision        │            │
│  │  Optimizer    │    │  Engine          │    │  Automator       │            │
│  │               │    │                  │    │                  │            │
│  │  - Metrics    │    │  - Run Steps     │    │  - Type Classify │            │
│  │  - Bottleneck │    │  - Handle Errors │    │  - Rule Eval     │            │
│  │  - Parallelize│    │  - Notify        │    │  - ML Predict    │            │
│  │  - A/B Test   │    │  - Log Results   │    │  - Approval Gate │            │
│  └──────────────┘    └──────────────────┘    └──────────────────┘            │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Task Execution Flow:**

```
1. Trigger (Schedule / Event / Manual)
       │
2. Load Workflow Definition
       │
3. Initialize Execution Context
       │
4. For Each Step (in dependency order):
       │
       ├── Check Conditions
       │       │
       ├── Execute Action (API call / DB op / Notification / Approval)
       │       │
       ├── Handle Result
       │       │
       ├── If Error → Retry (3x) → Fallback → Notify
       │       │
       └── Log Step Result
       │
5. Aggregate Results
       │
6. Trigger Post-Execution Actions (Notifications, Reports)
       │
7. Update Workflow Status (Completed / Failed / Partial)
```

**Required APIs:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/automation/tasks` | GET | Identify automatable tasks |
| `/api/automation/workflows` | POST | Create new workflow |
| `/api/automation/workflows/:id` | GET | Get workflow details |
| `/api/automation/workflows/:id/execute` | POST | Execute workflow |
| `/api/automation/workflows/:id/optimize` | POST | Optimize workflow |
| `/api/automation/decisions` | POST | Execute automated decision |
| `/api/automation/decisions/:id` | GET | Get decision result |

---

### F) AI Security Intelligence

**Monitoring System:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SECURITY MONITORING SYSTEM                             │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                      ACTIVITY STREAM (Real-time)                       │    │
│  │  User Actions │ API Calls │ File Access │ Auth Events │ System Events │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                    │                                          │
│                                    ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                      BEHAVIOR MONITOR                                  │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │    │
│  │  │  Baseline     │  │  Profile     │  │  Real-time   │  │ Deviation│  │    │
│  │  │  Establish    │  │  Build       │  │  Monitor     │  │ Score    │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘  │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                    │                                          │
│                                    ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                      ANOMALY DETECTION                                 │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │    │
│  │  │  Z-Score      │  │  Isolation   │  │  Sequence    │  │ Ensemble │  │    │
│  │  │  Detection    │  │  Forest      │  │  Analysis    │  │ Score    │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘  │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                    │                                          │
│                                    ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                      RISK CALCULATOR                                   │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │    │
│  │  │  User Risk    │  │  Action Risk │  │  Resource    │  │  Total   │  │    │
│  │  │  Score        │  │  Score       │  │  Risk Score  │  │  Risk    │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘  │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                    │                                          │
│                                    ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                      THREAT IDENTIFIER                                 │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │    │
│  │  │  Signature    │  │  Behavioral  │  │  Threat Intel│  │  Threat  │  │    │
│  │  │  Match        │  │  Detection   │  │  Correlation │  │  Score   │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘  │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                    │                                          │
│                                    ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                      ALERT SYSTEM                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │    │
│  │  │  Severity     │  │  Escalation  │  │  Auto-       │  │  Log &   │  │    │
│  │  │  Assessment   │  │  Rules       │  │  Response    │  │  Notify  │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘  │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Risk Detection Flow:**

```
Event Occurs ──▶ Log Activity ──▶ Check Baseline ──▶ Calculate Deviation
                                                          │
                                                     < 0.4 ──▶ Normal (Log only)
                                                    0.4-0.6 ──▶ Monitor (Flag)
                                                    0.6-0.8 ──▶ Suspicious (Alert)
                                                     > 0.8 ──▶ Critical (Immediate Action)
                                                          │
                                                     ┌────┴────┐
                                                     ▼         ▼
                                               Risk Calc    Threat ID
                                                     │         │
                                                     └────┬────┘
                                                          ▼
                                                    Response Action
                                                          │
                                              ┌───────────┼───────────┐
                                              ▼           ▼           ▼
                                          Block MFA    Notify      Log
```

**Required APIs:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/security/risk-score` | GET | Get current risk score |
| `/api/security/anomalies` | GET | Get detected anomalies |
| `/api/security/threats` | GET | Get identified threats |
| `/api/security/alerts` | GET | Get security alerts |
| `/api/security/events` | GET | Get security events log |
| `/api/security/events/:id/mitigate` | POST | Mitigate security event |

---

### G) AI Chatbot

**Conversation Storage:**

```
Collection: conversations
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  sessionId: String,
  title: String,
  status: "active" | "archived" | "closed",
  metadata: {
    startTime: Date,
    endTime: Date,
    messageCount: Number,
    topics: [String],
    sentiment: String
  },
  createdAt: Date,
  updatedAt: Date
}

Collection: messages
{
  _id: ObjectId,
  conversation: ObjectId (ref: Conversation),
  role: "user" | "assistant" | "system",
  content: String,
  intent: String,
  entities: [{
    type: String,
    value: String
  }],
  sentiment: {
    label: String,
    score: Number
  },
  metadata: {
    tokensUsed: Number,
    latency: Number,
    modelUsed: String
  },
  timestamp: Date
}
```

**Memory Management:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MEMORY MANAGEMENT SYSTEM                               │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                      MEMORY HIERARCHY                                  │    │
│  │                                                                         │    │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │    │
│  │  │  SHORT-TERM MEMORY (In-Memory Cache)                             │  │    │
│  │  │  - Last 10 exchanges per session                                  │  │    │
│  │  │  - TTL: Session duration (max 1 hour idle)                       │  │    │
│  │  │  - Storage: Redis / In-memory Map                                │  │    │
│  │  └─────────────────────────────────────────────────────────────────┘  │    │
│  │                                    │                                    │    │
│  │                                    ▼                                    │    │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │    │
│  │  │  LONG-TERM MEMORY (MongoDB)                                      │  │    │
│  │  │  - Summarized conversation history per user                       │  │    │
│  │  │  - Key entities, decisions, preferences extracted                 │  │    │
│  │  │  - TTL: 90 days (configurable)                                   │  │    │
│  │  │  - Storage: conversations + messages collections                 │  │    │
│  │  └─────────────────────────────────────────────────────────────────┘  │    │
│  │                                    │                                    │    │
│  │                                    ▼                                    │    │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │    │
│  │  │  EPISODIC MEMORY (MongoDB)                                       │  │    │
│  │  │  - Key decisions and outcomes for pattern learning                │  │    │
│  │  │  - User feedback and corrections                                  │  │    │
│  │  │  - TTL: Permanent (for model training)                           │  │    │
│  │  │  - Storage: ai_episodic_memory collection                        │  │    │
│  │  └─────────────────────────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Response Generation Flow:**

```
User Message ──▶ NLP Processor
                    │
                    ├── Pre-process (tokenize, normalize)
                    ├── Intent Detection (classifyIntent)
                    ├── Entity Extraction (extractEntities)
                    ├── Sentiment Analysis (analyzeSentiment)
                    └── Query Reformulation (context-aware)
                    │
                    ▼
              Memory Manager
                    │
                    ├── Load Short-term Memory (last 10 exchanges)
                    ├── Load Long-term Memory (summarized history)
                    └── Merge & Prioritize
                    │
                    ▼
              Context Manager
                    │
                    ├── Topic Tracking
                    ├── Pronoun Resolution
                    ├── Ellipsis Resolution
                    └── Context Weighting
                    │
                    ▼
              Knowledge Retrieval
                    │
                    ├── DB Lookup (entities)
                    ├── Vector Search (semantic)
                    └── KB Search (domain knowledge)
                    │
                    ▼
              Answer Generator
                    │
                    ├── Knowledge Selection (top 3)
                    ├── Response Type Detection
                    ├── Template Selection
                    ├── Gemini Call (temperature=0.4)
                    ├── Response Validation
                    └── Response Enrichment (suggestions, actions)
                    │
                    ▼
              Response ──▶ User
```

**Required APIs:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chatbot/message` | POST | Send message (existing, enhanced) |
| `/api/chatbot/conversations` | GET | List user conversations |
| `/api/chatbot/conversations/:id` | GET | Get conversation history |
| `/api/chatbot/conversations/:id/archive` | PUT | Archive conversation |
| `/api/chatbot/insights` | GET | Get quick insights (existing) |
| `/api/chatbot/generate-report` | POST | Generate report (existing) |

---

## 3. API DESIGN DOCUMENT

### 3.1 Enterprise Assistant APIs

| # | API Name | Method | Endpoint | Input | Output | Auth | AI Model |
|---|----------|--------|----------|-------|--------|------|----------|
| 1 | Query Assistant | POST | `/api/assistant/query` | `{ query, context?, domain? }` | `{ response, confidence, sources, suggestions }` | JWT | Gemini 1.5 Pro + Intent Classifier |
| 2 | Get Context | GET | `/api/assistant/context` | Query params: `sessionId?` | `{ context, session, profile, domain }` | JWT | Context Builder |
| 3 | Get Suggestions | GET | `/api/assistant/suggestions` | Query params: `domain?, count?` | `{ suggestions: [{text, intent, confidence}] }` | JWT | Rule-based + ML |
| 4 | Get History | GET | `/api/assistant/history` | Query params: `page, limit` | `{ history: [{query, response, timestamp}], pagination }` | JWT | None (DB query) |

### 3.2 Recommendation Engine APIs

| # | API Name | Method | Endpoint | Input | Output | Auth | AI Model |
|---|----------|--------|----------|-------|--------|------|----------|
| 5 | Get Recommendations | GET | `/api/recommendations` | Query params: `type?, limit?, category?` | `{ recommendations: [{item, score, reason}], metadata }` | JWT | B1+B2+B3+B4 Ensemble |
| 6 | Get Trending | GET | `/api/recommendations/trending` | Query params: `limit?, category?` | `{ trending: [{item, trend_score, reason}] }` | JWT | B3 + Popularity |
| 7 | Get Similar | GET | `/api/recommendations/similar/:id` | Path: `id`, Query: `limit?` | `{ similar: [{item, similarity, reason}] }` | JWT | B3 + Embedding |
| 8 | Submit Feedback | POST | `/api/recommendations/feedback` | `{ itemId, action, rating? }` | `{ success, updated_profile }` | JWT | B4 (feedback loop) |

### 3.3 Document Intelligence APIs

| # | API Name | Method | Endpoint | Input | Output | Auth | AI Model |
|---|----------|--------|----------|-------|--------|------|----------|
| 9 | Upload Document | POST | `/api/documents/upload` | FormData: `file, metadata?` | `{ documentId, status, chunks, pages }` | JWT | C1 (Document Processor) |
| 10 | Analyze Document | GET | `/api/documents/:id/analyze` | Path: `id` | `{ document_type, entities, categories, pii_detected }` | JWT | C2 (Entity Classifier) |
| 11 | Summarize Document | POST | `/api/documents/:id/summarize` | Path: `id`, Body: `{ level, length? }` | `{ summary, quality_score, key_points }` | JWT | C3 (Summarizer) |
| 12 | Extract Critical Data | GET | `/api/documents/:id/extract` | Path: `id` | `{ critical_data, action_items, risks, deadlines }` | JWT | C4 (Critical Extractor) |
| 13 | List Documents | GET | `/api/documents` | Query params: `page, limit, status?` | `{ documents: [{id, name, type, status, date}], pagination }` | JWT | None (DB query) |

### 3.4 Analytics Engine APIs

| # | API Name | Method | Endpoint | Input | Output | Auth | AI Model |
|---|----------|--------|----------|-------|--------|------|----------|
| 14 | Get Overview | GET | `/api/analytics/overview` | Query params: `dateRange?, metrics?` | `{ metrics, totals, trends_summary }` | JWT | D1 (Data Collector) |
| 15 | Get Trends | GET | `/api/analytics/trends` | Query params: `metric, period, interval` | `{ trends: [{date, value, ma}], direction, significance }` | JWT | D2 (Pattern Detector) |
| 16 | Get Forecast | GET | `/api/analytics/forecast` | Query params: `metric, periods, model?` | `{ forecast: [{period, value, ci_lower, ci_upper}], accuracy }` | JWT | D3 (Trend Analyzer) |
| 17 | Get Insights | GET | `/api/analytics/insights` | Query params: `focus?` | `{ insights, risks, opportunities, recommendations }` | JWT | D4 (Business Predictor) |
| 18 | Get Anomalies | GET | `/api/analytics/anomalies` | Query params: `metric?, severity?` | `{ anomalies: [{metric, value, z_score, timestamp}] }` | JWT | D2 (Anomaly Detection) |

### 3.5 Automation Engine APIs

| # | API Name | Method | Endpoint | Input | Output | Auth | AI Model |
|---|----------|--------|----------|-------|--------|------|----------|
| 19 | Identify Tasks | GET | `/api/automation/tasks` | Query params: `process?, limit?` | `{ tasks: [{task, frequency, eligibility, roi, priority}] }` | JWT | E1 (Task Identifier) |
| 20 | Create Workflow | POST | `/api/automation/workflows` | `{ name, steps, triggers, conditions }` | `{ workflowId, steps, validation_status }` | JWT | E2 (Workflow Builder) |
| 21 | Execute Workflow | POST | `/api/automation/workflows/:id/execute` | Path: `id`, Body: `{ params? }` | `{ executionId, status, results, logs }` | JWT | E3 (Decision Automator) |
| 22 | Optimize Workflow | POST | `/api/automation/workflows/:id/optimize` | Path: `id` | `{ bottlenecks, optimizations, expected_gain }` | JWT | E4 (Process Optimizer) |
| 23 | List Workflows | GET | `/api/automation/workflows` | Query params: `status?, page, limit` | `{ workflows: [{id, name, status, stats}], pagination }` | JWT | None (DB query) |

### 3.6 Security Intelligence APIs

| # | API Name | Method | Endpoint | Input | Output | Auth | AI Model |
|---|----------|--------|----------|-------|--------|------|----------|
| 24 | Get Risk Score | GET | `/api/security/risk-score` | Query params: `userId?, resource?` | `{ risk_score, components, severity, recommended_action }` | JWT + Admin | F3 (Risk Calculator) |
| 25 | Get Anomalies | GET | `/api/security/anomalies` | Query params: `severity?, page, limit` | `{ anomalies: [{type, severity, score, timestamp}], pagination }` | JWT + Admin | F2 (Anomaly Detector) |
| 26 | Get Threats | GET | `/api/security/threats` | Query params: `status?, severity?, page, limit` | `{ threats: [{type, category, severity, confidence}], pagination }` | JWT + Admin | F4 (Threat Identifier) |
| 27 | Get Alerts | GET | `/api/security/alerts` | Query params: `severity?, read?, page, limit` | `{ alerts: [{type, severity, message, timestamp}], pagination }` | JWT | F1+F2+F3+F4 |
| 28 | Mitigate Event | POST | `/api/security/events/:id/mitigate` | Path: `id`, Body: `{ action }` | `{ success, mitigation_result, new_risk_score }` | JWT + Admin | F3 (Mitigation) |

### 3.7 Chatbot APIs

| # | API Name | Method | Endpoint | Input | Output | Auth | AI Model |
|---|----------|--------|----------|-------|--------|------|----------|
| 29 | Send Message | POST | `/api/chatbot/message` | `{ message, conversationId? }` | `{ response, conversationId, suggestions }` | JWT | G1+G2+G3+G4 |
| 30 | Get Conversations | GET | `/api/chatbot/conversations` | Query params: `status?, page, limit` | `{ conversations: [{id, title, messageCount, lastMessage}], pagination }` | JWT | None (DB query) |
| 31 | Get Conversation | GET | `/api/chatbot/conversations/:id` | Path: `id`, Query: `page, limit` | `{ conversation, messages: [{role, content, timestamp}] }` | JWT | None (DB query) |
| 32 | Archive Conversation | PUT | `/api/chatbot/conversations/:id/archive` | Path: `id` | `{ success, status: "archived" }` | JWT | None (DB update) |
| 33 | Get Insights | GET | `/api/chatbot/insights` | None | `{ insights: { overview, recommendations } }` | JWT | None (DB aggregation) |
| 34 | Generate Report | POST | `/api/chatbot/generate-report` | `{ reportType, filters? }` | `{ report, metadata }` | JWT | Gemini 1.5 Pro |

### 3.8 General AI APIs (Existing - Refactored)

| # | API Name | Method | Endpoint | Input | Output | Auth | AI Model |
|---|----------|--------|----------|-------|--------|------|----------|
| 35 | Predict Sales | POST | `/api/ai/predict-sales` | `{ salesHistory }` | `{ predictedRevenue, growthRate, trend, confidence }` | JWT | Gemini 1.5 Pro |
| 36 | Generate Document | POST | `/api/ai/generate-document` | `{ type, data }` | `{ document (HTML) }` | JWT | Gemini 1.5 Pro |
| 37 | Explain Medical | POST | `/api/ai/explain-medical` | `{ reportData }` | `{ summary, keyFindings, recommendations }` | JWT | Gemini 1.5 Pro |
| 38 | Analyze Image | POST | `/api/ai/analyze-image` | `{ image (base64), mimeType }` | `{ description, objects, text, tags }` | JWT | Gemini Pro Vision |
| 39 | Evaluate Skill | POST | `/api/ai/evaluate-skill` | `{ skillData }` | `{ proficiencyScore, strengths, recommendations }` | JWT | Gemini 1.5 Pro |
| 40 | Get Recommendations | POST | `/api/ai/recommendations` | `{ userData }` | `{ recommendedSkills, courses, careerPaths }` | JWT | Gemini 1.5 Pro |

---

## 4. DATABASE DESIGN UPDATE

### 4.1 New Collections

| # | Collection Name | Purpose | Engine | Estimated Size |
|---|-----------------|---------|--------|----------------|
| 1 | `ai_conversations` | Store AI assistant query/response history | Assistant | 100 docs/user/month |
| 2 | `ai_cache` | Cache AI responses for performance | All Engines | 10K docs (rotating) |
| 3 | `ai_embeddings` | Store text embeddings for vector search | All Engines | 50K docs (rotating) |
| 4 | `documents` | Store uploaded document metadata & text | Document Intel | 100 docs/user/month |
| 5 | `doc_chunks` | Store document text chunks | Document Intel | 1000 chunks/doc |
| 6 | `doc_analyses` | Store document analysis results | Document Intel | 1 doc/analysis |
| 7 | `doc_summaries` | Store generated summaries | Document Intel | 4 summaries/doc |
| 8 | `analytics_cache` | Cache analytics results | Analytics | 1K docs (rotating) |
| 9 | `workflows` | Store workflow definitions | Automation | 50 workflows/user |
| 10 | `workflow_executions` | Store workflow execution logs | Automation | 100 executions/workflow |
| 11 | `decisions` | Store automated decision logs | Automation | 1K decisions/month |
| 12 | `security_events` | Store security events & alerts | Security | 10K events/month |
| 13 | `security_baselines` | Store user behavior baselines | Security | 1 baseline/user |
| 14 | `conversations` | Store chatbot conversations | Chatbot | 50 convs/user/month |
| 15 | `messages` | Store individual chat messages | Chatbot | 100 msgs/conv |
| 16 | `model_registry` | Store ML model versions & metrics | ML Pipeline | 50 models (total) |
| 17 | `training_data` | Store labeled training data | ML Pipeline | 10K docs (growing) |

### 4.2 Schema Changes to Existing Collections

**User Collection - Additions:**
```javascript
// Add to existing User schema
{
  aiPreferences: {
    assistantEnabled: { type: Boolean, default: true },
    recommendationEnabled: { type: Boolean, default: true },
    analyticsAccess: { type: String, enum: ['basic', 'advanced', 'admin'], default: 'basic' },
    chatbotEnabled: { type: Boolean, default: true },
    securityLevel: { type: String, enum: ['standard', 'elevated', 'high'], default: 'standard' }
  },
  behavioralProfile: {
    engagementScore: { type: Number, default: 0 },
    topCategories: [String],
    commonPatterns: [String],
    lastUpdated: Date
  },
  securityBaseline: {
    typicalHours: { start: Number, end: Number },
    typicalResources: [String],
    typicalFrequency: Number,
    typicalIpRange: [String],
    lastUpdated: Date
  }
}
```

**Activity Collection - Additions:**
```javascript
// Add to existing Activity schema
{
  metadata: {
    duration: Number,           // Action duration in ms
    result: String,             // success / failure / pending
    riskScore: Number,          // 0-1 security risk score
    aiProcessed: Boolean,       // Whether AI processed this activity
    aiInsights: {               // AI-generated insights
      anomalyScore: Number,
      patternMatch: String,
      recommendation: String
    }
  },
  sessionId: String,            // Link to user session
  source: {                     // Activity source
    type: { type: String, enum: ['api', 'web', 'mobile', 'system', 'automation'] },
    ip: String,
    userAgent: String
  }
}
```

### 4.3 New Collection Schemas

**ai_conversations:**
```javascript
{
  user: { type: ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true },
  query: { type: String, required: true },
  response: { type: String, required: true },
  intent: { type: String },
  confidence: { type: Number },
  entities: [{ type: String, value: String }],
  sources: [{ source: String, collection: String, id: ObjectId, score: Number }],
  metadata: {
    tokensUsed: Number,
    latency: Number,
    modelUsed: String,
    cacheHit: Boolean
  },
  feedback: {
    rating: Number,
    comment: String,
    corrected: Boolean
  },
  createdAt: { type: Date, default: Date.now }
}
```

**documents:**
```javascript
{
  user: { type: ObjectId, ref: 'User', required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  format: { type: String, enum: ['pdf', 'docx', 'csv', 'xlsx', 'image', 'txt'] },
  storagePath: { type: String },
  gridFsId: { type: ObjectId },
  status: { type: String, enum: ['uploaded', 'processing', 'processed', 'failed'], default: 'uploaded' },
  stats: {
    pageCount: Number,
    wordCount: Number,
    chunkCount: Number
  },
  structure: {
    hasHeadings: Boolean,
    hasTables: Boolean,
    hasImages: Boolean,
    sections: [{ title: String, level: Number }]
  },
  metadata: { type: Map, of: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

**workflows:**
```javascript
{
  user: { type: ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['draft', 'active', 'paused', 'archived'], default: 'draft' },
  trigger: {
    type: { type: String, enum: ['schedule', 'event', 'manual'] },
    config: {
      schedule: String,       // Cron expression
      event: String,          // Event type
      conditions: [String]
    }
  },
  steps: [{
    stepId: String,
    name: String,
    type: { type: String, enum: ['action', 'decision', 'wait', 'notification', 'approval'] },
    action: {
      service: String,
      endpoint: String,
      method: String,
      input: Object,
      output: Object
    },
    dependencies: [String],
    conditions: {
      if: Object,
      else: Object
    },
    errorHandling: {
      retryCount: { type: Number, default: 3 },
      retryDelay: { type: Number, default: 5000 },
      fallbackAction: String,
      notifyOnFailure: Boolean
    }
  }],
  stats: {
    totalExecutions: { type: Number, default: 0 },
    successfulExecutions: { type: Number, default: 0 },
    failedExecutions: { type: Number, default: 0 },
    avgDuration: Number,
    lastExecution: Date
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

**security_events:**
```javascript
{
  type: { type: String, enum: ['anomaly', 'threat', 'risk', 'alert', 'incident'] },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
  status: { type: String, enum: ['open', 'investigating', 'mitigated', 'resolved', 'false_positive'] },
  user: { type: ObjectId, ref: 'User' },
  source: {
    ip: String,
    userAgent: String,
    resource: String,
    action: String
  },
  scores: {
    anomalyScore: Number,
    riskScore: Number,
    threatScore: Number,
    ensembleScore: Number
  },
  details: {
    description: String,
    deviation: Object,
    indicators: [String],
    affectedResources: [String]
  },
  mitigation: {
    action: String,
    autoResponded: Boolean,
    respondedAt: Date,
    resolvedBy: ObjectId
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

### 4.4 Relationships

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COLLECTION RELATIONSHIPS                               │
│                                                                               │
│  users ──1:N──▶ ai_conversations     (User's AI query history)               │
│  users ──1:N──▶ documents            (User's uploaded documents)             │
│  users ──1:N──▶ workflows            (User's created workflows)              │
│  users ──1:N──▶ conversations        (User's chatbot conversations)          │
│  users ──1:N──▶ security_events      (Security events involving user)        │
│  users ──1:1──▶ security_baselines   (User's behavior baseline)              │
│                                                                               │
│  documents ──1:N──▶ doc_chunks       (Document text chunks)                  │
│  documents ──1:N──▶ doc_analyses     (Document analysis results)             │
│  documents ──1:N──▶ doc_summaries    (Generated summaries)                   │
│                                                                               │
│  conversations ──1:N──▶ messages     (Chat messages in conversation)         │
│                                                                               │
│  workflows ──1:N──▶ workflow_executions  (Workflow execution logs)           │
│  workflows ──1:N──▶ decisions        (Automated decisions from workflow)     │
│                                                                               │
│  ai_cache ──N:1──▶ users            (Cached responses by user)               │
│  ai_embeddings ──N:1──▶ documents   (Embeddings linked to documents)         │
│                                                                               │
│  model_registry ──N:N──▶ training_data  (Models trained on data)             │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.5 Index Requirements

| Collection | Index | Type | Purpose |
|------------|-------|------|---------|
| `ai_conversations` | `{ user: 1, createdAt: -1 }` | Compound | User query history |
| `ai_conversations` | `{ sessionId: 1 }` | Single | Session lookup |
| `ai_conversations` | `{ intent: 1, confidence: -1 }` | Compound | Intent analytics |
| `ai_cache` | `{ queryHash: 1, userId: 1 }` | Compound | Cache lookup |
| `ai_cache` | `{ createdAt: 1 }` | Single | TTL cleanup |
| `ai_embeddings` | `{ documentId: 1, chunkId: 1 }` | Compound | Document embeddings |
| `ai_embeddings` | `{ embedding: "2dsphere" }` | Geospatial | Vector search (if using 2d) |
| `documents` | `{ user: 1, createdAt: -1 }` | Compound | User documents list |
| `documents` | `{ status: 1 }` | Single | Processing queue |
| `documents` | `{ mimeType: 1 }` | Single | Format analytics |
| `doc_chunks` | `{ documentId: 1, chunkIndex: 1 }` | Compound | Chunk retrieval |
| `doc_chunks` | `{ embedding: "2dsphere" }` | Geospatial | Semantic search |
| `doc_analyses` | `{ documentId: 1 }` | Single | Analysis lookup |
| `doc_analyses` | `{ documentType: 1 }` | Single | Type analytics |
| `doc_summaries` | `{ documentId: 1, level: 1 }` | Compound | Summary retrieval |
| `analytics_cache` | `{ cacheKey: 1 }` | Single | Cache lookup |
| `analytics_cache` | `{ createdAt: 1 }` | Single | TTL cleanup |
| `workflows` | `{ user: 1, status: 1 }` | Compound | User workflows |
| `workflows` | `{ status: 1, "stats.lastExecution": -1 }` | Compound | Active workflows |
| `workflow_executions` | `{ workflowId: 1, createdAt: -1 }` | Compound | Execution history |
| `workflow_executions` | `{ status: 1 }` | Single | Execution status |
| `decisions` | `{ workflowId: 1 }` | Single | Workflow decisions |
| `decisions` | `{ userId: 1, createdAt: -1 }` | Compound | User decisions |
| `security_events` | `{ user: 1, createdAt: -1 }` | Compound | User events |
| `security_events` | `{ severity: 1, status: 1 }` | Compound | Alert queue |
| `security_events` | `{ type: 1, createdAt: -1 }` | Compound | Event type analysis |
| `security_events` | `{ "scores.ensembleScore": -1 }` | Single | High-score events |
| `security_baselines` | `{ user: 1 }` | Unique | User baseline |
| `conversations` | `{ user: 1, updatedAt: -1 }` | Compound | User conversations |
| `conversations` | `{ status: 1 }` | Single | Active conversations |
| `messages` | `{ conversationId: 1, timestamp: 1 }` | Compound | Message history |
| `messages` | `{ role: 1, timestamp: -1 }` | Compound | Message analytics |
| `model_registry` | `{ modelType: 1, status: 1 }` | Compound | Active models |
| `model_registry` | `{ "metrics.f1_score": -1 }` | Single | Best models |
| `training_data` | `{ label: 1 }` | Single | Labeled data |
| `training_data` | `{ createdAt: -1 }` | Single | Recent data |

---

## 5. DEVELOPMENT ROADMAP

### Phase 1: AI Core Setup (Weeks 1-2)

**Objective:** Establish AI infrastructure, LLM integrations, and core orchestration layer.

| Task ID | Task | Files to Create/Modify | Dependencies | Estimated Effort |
|---------|------|----------------------|--------------|------------------|
| 1.1 | Gemini API Client | `services/ai/clients/geminiClient.js` | None | 2 days |
| 1.2 | OpenAI API Client (refactor) | `services/ai/clients/openaiClient.js` (refactor from openaiService.js) | None | 1 day |
| 1.3 | Embedding Client | `services/ai/clients/embeddingClient.js` | 1.1, 1.2 | 1 day |
| 1.4 | Vision Client | `services/ai/clients/visionClient.js` | 1.1 | 1 day |
| 1.5 | AI Orchestrator - Query Router | `services/ai/orchestrator/queryRouter.js` | 1.1, 1.2 | 2 days |
| 1.6 | AI Orchestrator - Context Manager | `services/ai/orchestrator/contextManager.js` | None | 1 day |
| 1.7 | AI Orchestrator - Memory Manager | `services/ai/orchestrator/memoryManager.js` | None | 1 day |
| 1.8 | AI Orchestrator - Response Builder | `services/ai/orchestrator/responseBuilder.js` | 1.5, 1.6, 1.7 | 1 day |
| 1.9 | Response Cache (Redis) | `services/ai/cache/responseCache.js` | Redis setup | 1 day |
| 1.10 | AI Middleware - Rate Limiter | `middleware/aiRateLimiter.js` | None | 0.5 day |
| 1.11 | AI Middleware - Context Loader | `middleware/contextLoader.js` | 1.6 | 0.5 day |
| 1.12 | AI Middleware - Audit Logger | `middleware/auditLogger.js` | None | 0.5 day |
| 1.13 | AI Middleware - Cost Tracker | `middleware/costTracker.js` | 1.1, 1.2 | 0.5 day |
| 1.14 | AI Service Index | `services/ai/index.js` | All above | 0.5 day |
| 1.15 | Database: New Collections | Create models for ai_conversations, ai_cache, ai_embeddings | None | 1 day |
| 1.16 | Database: Indexes Update | Update `config/indexes.js` | 1.15 | 0.5 day |
| 1.17 | Server.js Route Registration | Update `server.js` | All above | 0.5 day |

**Phase 1 Deliverables:**
- ✅ Gemini + OpenAI API clients with rate limiting, retry, caching
- ✅ Embedding generation pipeline
- ✅ AI Orchestrator (Query Router, Context Manager, Memory Manager, Response Builder)
- ✅ Redis cache for AI responses
- ✅ AI middleware stack (rate limiter, context loader, audit logger, cost tracker)
- ✅ New database collections and indexes
- ✅ All AI routes registered in server.js

---

### Phase 2: Gemini/OpenAI Integration (Weeks 3-4)

**Objective:** Build prompt engineering system, safety filters, model routing, and fallback chain.

| Task ID | Task | Files to Create/Modify | Dependencies | Estimated Effort |
|---------|------|----------------------|--------------|------------------|
| 2.1 | Prompt Builder | `services/ai/utils/promptBuilder.js` | 1.1, 1.2 | 2 days |
| 2.2 | Response Parser | `services/ai/utils/responseParser.js` | 2.1 | 1 day |
| 2.3 | Safety Filter | `services/ai/utils/safetyFilter.js` | None | 1 day |
| 2.4 | Rate Limiter Utility | `services/ai/utils/rateLimiter.js` | None | 0.5 day |
| 2.5 | Token Tracker | `services/ai/utils/tokenTracker.js` | 1.1, 1.2 | 0.5 day |
| 2.6 | Cost Optimizer | `services/ai/utils/costOptimizer.js` | 2.5 | 1 day |
| 2.7 | Model Router | `services/ai/ml/inference/modelRouter.js` | 1.1, 1.2, 2.1 | 2 days |
| 2.8 | Ensemble Fusion | `services/ai/ml/inference/ensembleFusion.js` | 2.7 | 1 day |
| 2.9 | Fallback Chain Implementation | Update `queryRouter.js` | 2.7, 2.8 | 1 day |
| 2.10 | Embedding Cache | `services/ai/cache/embeddingCache.js` | 1.3, 1.9 | 1 day |
| 2.11 | Model Cache | `services/ai/cache/modelCache.js` | 1.9, 2.7 | 0.5 day |
| 2.12 | Data Ingestion Pipeline | `services/ai/pipeline/dataIngestion.js` | None | 1 day |
| 2.13 | Data Preprocessing | `services/ai/pipeline/dataPreprocessing.js` | 2.12 | 1 day |
| 2.14 | Feature Extraction | `services/ai/pipeline/featureExtraction.js` | 2.13 | 1 day |
| 2.15 | Post Processing | `services/ai/pipeline/postProcessing.js` | 2.2, 2.3 | 1 day |
| 2.16 | Safety Filter Middleware | `middleware/safetyFilter.js` | 2.3 | 0.5 day |

**Phase 2 Deliverables:**
- ✅ Dynamic prompt construction system
- ✅ LLM response parsing with validation
- ✅ Content safety filtering (PII, harmful content)
- ✅ Model routing with fallback chain (Rule → ML → Embeddings → Gemini → OpenAI)
- ✅ Ensemble fusion for multi-model results
- ✅ Token usage tracking and cost optimization
- ✅ Data processing pipeline (ingestion → preprocessing → features → post-processing)
- ✅ Complete caching strategy (responses, embeddings, models)

---

### Phase 3: AI Features Development (Weeks 5-12)

**Objective:** Implement all 7 AI engines with their algorithms.

#### Sprint 3.1: Enterprise Assistant (Week 5-6)

| Task ID | Task | Files to Create/Modify | Dependencies | Estimated Effort |
|---------|------|----------------------|--------------|------------------|
| 3.1.1 | Intent Classifier (A1) | `services/ai/engines/assistant/intentClassifier.js` | Phase 2 | 2 days |
| 3.1.2 | Context Builder (A2) | `services/ai/engines/assistant/contextBuilder.js` | 3.1.1 | 1 day |
| 3.1.3 | Knowledge Retriever (A3) | `services/ai/engines/assistant/knowledgeRetriever.js` | 1.3, 3.1.2 | 2 days |
| 3.1.4 | Response Generator (A4) | `services/ai/engines/assistant/responseGenerator.js` | 3.1.3, 2.1 | 2 days |
| 3.1.5 | Assistant Controller | `controllers/assistantController.js` | 3.1.1-3.1.4 | 1 day |
| 3.1.6 | Assistant Routes | `routes/assistant.js` | 3.1.5 | 0.5 day |
| 3.1.7 | Assistant Validators | `validators/assistant.js` | None | 0.5 day |

#### Sprint 3.2: Recommendation Engine (Week 7-8)

| Task ID | Task | Files to Create/Modify | Dependencies | Estimated Effort |
|---------|------|----------------------|--------------|------------------|
| 3.2.1 | Behavior Analyzer (B1) | `services/ai/engines/recommendation/behaviorAnalyzer.js` | Activity model | 2 days |
| 3.2.2 | Need Analyzer (B2) | `services/ai/engines/recommendation/needAnalyzer.js` | Business model | 2 days |
| 3.2.3 | Recommendation Scorer (B3) | `services/ai/engines/recommendation/recommendationScorer.js` | 3.2.1, 3.2.2 | 2 days |
| 3.2.4 | Adaptive Ranker (B4) | `services/ai/engines/recommendation/adaptiveRanker.js` | 3.2.3 | 1 day |
| 3.2.5 | Recommendation Controller | `controllers/recommendationController.js` | 3.2.1-3.2.4 | 1 day |
| 3.2.6 | Recommendation Routes | `routes/recommendations.js` | 3.2.5 | 0.5 day |
| 3.2.7 | Recommendation Validators | `validators/recommendations.js` | None | 0.5 day |

#### Sprint 3.3: Document Intelligence (Week 9-10)

| Task ID | Task | Files to Create/Modify | Dependencies | Estimated Effort |
|---------|------|----------------------|--------------|------------------|
| 3.3.1 | Document Processor (C1) | `services/ai/engines/document/documentProcessor.js` | 1.4, 2.12 | 3 days |
| 3.3.2 | Entity Classifier (C2) | `services/ai/engines/document/entityClassifier.js` | 3.3.1, 2.1 | 2 days |
| 3.3.3 | Document Summarizer (C3) | `services/ai/engines/document/documentSummarizer.js` | 3.3.2, 2.1 | 2 days |
| 3.3.4 | Critical Data Extractor (C4) | `services/ai/engines/document/criticalDataExtractor.js` | 3.3.2, 2.1 | 2 days |
| 3.3.5 | Document Controller | `controllers/documentController.js` | 3.3.1-3.3.4 | 1 day |
| 3.3.6 | Document Routes | `routes/documents.js` | 3.3.5 | 0.5 day |
| 3.3.7 | Document Validators | `validators/documents.js` | None | 0.5 day |
| 3.3.8 | Database: Document Models | Create document, doc_chunks, doc_analyses, doc_summaries models | None | 1 day |

#### Sprint 3.4: Analytics Engine (Week 11-12)

| Task ID | Task | Files to Create/Modify | Dependencies | Estimated Effort |
|---------|------|----------------------|--------------|------------------|
| 3.4.1 | Data Collector (D1) | `services/ai/engines/analytics/dataCollector.js` | 2.12 | 2 days |
| 3.4.2 | Pattern Detector (D2) | `services/ai/engines/analytics/patternDetector.js` | 3.4.1 | 3 days |
| 3.4.3 | Trend Analyzer (D3) | `services/ai/engines/analytics/trendAnalyzer.js` | 3.4.2 | 2 days |
| 3.4.4 | Business Predictor (D4) | `services/ai/engines/analytics/businessPredictor.js` | 3.4.3 | 2 days |
| 3.4.5 | Analytics Controller | `controllers/analyticsController.js` | 3.4.1-3.4.4 | 1 day |
| 3.4.6 | Analytics Routes | `routes/analytics.js` | 3.4.5 | 0.5 day |
| 3.4.7 | Analytics Validators | `validators/analytics.js` | None | 0.5 day |
| 3.4.8 | Database: Analytics Models | Create analytics_cache model | None | 0.5 day |

#### Sprint 3.5: Automation Engine (Week 13-14)

| Task ID | Task | Files to Create/Modify | Dependencies | Estimated Effort |
|---------|------|----------------------|--------------|------------------|
| 3.5.1 | Task Identifier (E1) | `services/ai/engines/automation/taskIdentifier.js` | Activity model | 2 days |
| 3.5.2 | Workflow Builder (E2) | `services/ai/engines/automation/workflowBuilder.js` | 3.5.1 | 3 days |
| 3.5.3 | Decision Automator (E3) | `services/ai/engines/automation/decisionAutomator.js` | 3.5.2 | 2 days |
| 3.5.4 | Process Optimizer (E4) | `services/ai/engines/automation/processOptimizer.js` | 3.5.3 | 2 days |
| 3.5.5 | Automation Controller | `controllers/automationController.js` | 3.5.1-3.5.4 | 1 day |
| 3.5.6 | Automation Routes | `routes/automation.js` | 3.5.5 | 0.5 day |
| 3.5.7 | Automation Validators | `validators/automation.js` | None | 0.5 day |
| 3.5.8 | Database: Workflow Models | Create workflows, workflow_executions, decisions models | None | 1 day |

#### Sprint 3.6: Security Intelligence (Week 15-16)

| Task ID | Task | Files to Create/Modify | Dependencies | Estimated Effort |
|---------|------|----------------------|--------------|------------------|
| 3.6.1 | Behavior Monitor (F1) | `services/ai/engines/security/behaviorMonitor.js` | Activity model | 2 days |
| 3.6.2 | Anomaly Detector (F2) | `services/ai/engines/security/anomalyDetector.js` | 3.6.1 | 2 days |
| 3.6.3 | Risk Calculator (F3) | `services/ai/engines/security/riskCalculator.js` | 3.6.2 | 2 days |
| 3.6.4 | Threat Identifier (F4) | `services/ai/engines/security/threatIdentifier.js` | 3.6.3 | 2 days |
| 3.6.5 | Security Controller | `controllers/securityController.js` | 3.6.1-3.6.4 | 1 day |
| 3.6.6 | Security Routes | `routes/security.js` | 3.6.5 | 0.5 day |
| 3.6.7 | Security Validators | `validators/security.js` | None | 0.5 day |
| 3.6.8 | Database: Security Models | Create security_events, security_baselines models | None | 1 day |

#### Sprint 3.7: Chatbot System (Week 17-18)

| Task ID | Task | Files to Create/Modify | Dependencies | Estimated Effort |
|---------|------|----------------------|--------------|------------------|
| 3.7.1 | NLP Processor (G1) | `services/ai/engines/chatbot/nlpProcessor.js` | 1.1, 2.1 | 2 days |
| 3.7.2 | Memory Manager (G2) | `services/ai/engines/chatbot/memoryManager.js` | 1.7 | 2 days |
| 3.7.3 | Context Manager (G3) | `services/ai/engines/chatbot/contextManager.js` | 3.7.2 | 1 day |
| 3.7.4 | Answer Generator (G4) | `services/ai/engines/chatbot/answerGenerator.js` | 3.7.3, 2.1 | 2 days |
| 3.7.5 | Chatbot Controller (enhance) | `controllers/chatbotController.js` (enhance) | 3.7.1-3.7.4 | 1 day |
| 3.7.6 | Chatbot Routes (enhance) | `routes/chatbot.js` (enhance) | 3.7.5 | 0.5 day |
| 3.7.7 | Chatbot Validators | `validators/chatbot.js` | None | 0.5 day |
| 3.7.8 | Database: Chat Models | Create conversations, messages models | None | 1 day |

#### Sprint 3.8: ML Models (Week 19-20)

| Task ID | Task | Files to Create/Modify | Dependencies | Estimated Effort |
|---------|------|----------------------|--------------|------------------|
| 3.8.1 | TF-IDF Vectorizer | `services/ai/ml/models/tfidfVectorizer.js` | 2.13 | 1 day |
| 3.8.2 | Naive Bayes Classifier | `services/ai/ml/models/naiveBayesClassifier.js` | 3.8.1 | 1 day |
| 3.8.3 | K-Means Clusterer | `services/ai/ml/models/kmeansClusterer.js` | 2.14 | 1 day |
| 3.8.4 | Logistic Regression | `services/ai/ml/models/logisticRegression.js` | 2.14 | 1 day |
| 3.8.5 | Isolation Forest | `services/ai/ml/models/isolationForest.js` | 2.14 | 1 day |
| 3.8.6 | Linear Regression | `services/ai/ml/models/linearRegression.js` | 2.14 | 1 day |
| 3.8.7 | Decision Tree | `services/ai/ml/models/decisionTree.js` | 2.14 | 1 day |
| 3.8.8 | KNN Classifier | `services/ai/ml/models/knnClassifier.js` | 2.14 | 1 day |
| 3.8.9 | Model Trainer | `services/ai/ml/training/modelTrainer.js` | 3.8.1-3.8.8 | 2 days |
| 3.8.10 | Model Evaluator | `services/ai/ml/training/modelEvaluator.js` | 3.8.9 | 1 day |
| 3.8.11 | Model Registry | `services/ai/ml/training/modelRegistry.js` | 3.8.10 | 1 day |
| 3.8.12 | Database: ML Models | Create model_registry, training_data models | None | 0.5 day |

**Phase 3 Deliverables:**
- ✅ Enterprise Assistant with intent classification, context building, knowledge retrieval, response generation
- ✅ Recommendation Engine with behavior analysis, need analysis, multi-factor scoring, adaptive ranking
- ✅ Document Intelligence with processing, entity classification, summarization, critical data extraction
- ✅ Analytics Engine with data collection, pattern detection, trend analysis, business prediction
- ✅ Automation Engine with task identification, workflow building, decision automation, process optimization
- ✅ Security Intelligence with behavior monitoring, anomaly detection, risk calculation, threat identification
- ✅ Chatbot System with NLP processing, memory management, context management, answer generation
- ✅ Local ML Models (TF-IDF, Naive Bayes, K-Means, Logistic Regression, Isolation Forest, Linear Regression, Decision Tree, KNN)
- ✅ Model training, evaluation, and registry pipeline

---

### Phase 4: Frontend AI Integration (Weeks 21-24)

**Objective:** Build React frontend components for all AI features.

| Task ID | Task | Files to Create/Modify | Estimated Effort |
|---------|------|----------------------|------------------|
| 4.1 | AI API Service (enhance) | `frontend/src/services/api.js` (enhance) | 1 day |
| 4.2 | AI Insights Dashboard (enhance) | `frontend/src/pages/AIInsights.jsx` (enhance) | 3 days |
| 4.3 | AI Assistant Widget | `frontend/src/components/AIAssistant.jsx` | 3 days |
| 4.4 | Recommendation Widget | `frontend/src/components/Recommendations.jsx` | 2 days |
| 4.5 | Document Upload & Viewer | `frontend/src/pages/Documents.jsx` | 3 days |
| 4.6 | Analytics Dashboard | `frontend/src/pages/Analytics.jsx` | 3 days |
| 4.7 | Automation Workflow UI | `frontend/src/pages/Automation.jsx` | 3 days |
| 4.8 | Security Dashboard | `frontend/src/pages/Security.jsx` | 3 days |
| 4.9 | Chatbot Panel (enhance) | `frontend/src/components/ChatPanel.jsx` | 2 days |
| 4.10 | AI Context Provider | `frontend/src/context/AIContext.jsx` | 1 day |
| 4.11 | AI Hooks | `frontend/src/hooks/useAI.js` | 1 day |
| 4.12 | Navigation Updates | `frontend/src/App.jsx`, `frontend/src/components/Sidebar.jsx` | 1 day |

**Phase 4 Deliverables:**
- ✅ Enhanced AI Insights Dashboard with all engine data
- ✅ AI Assistant Widget for contextual queries
- ✅ Recommendation Widget for personalized suggestions
- ✅ Document Upload & Viewer with analysis results
- ✅ Analytics Dashboard with charts and forecasts
- ✅ Automation Workflow Management UI
- ✅ Security Monitoring Dashboard
- ✅ Enhanced Chatbot Panel with streaming
- ✅ AI Context Provider and custom hooks

---

### Phase 5: Testing (Weeks 25-26)

**Objective:** Comprehensive testing of all AI features.

| Task ID | Task | Description | Estimated Effort |
|---------|------|-------------|------------------|
| 5.1 | Unit Tests - AI Services | Test all engine services with mock data | 3 days |
| 5.2 | Unit Tests - ML Models | Test all ML model implementations | 2 days |
| 5.3 | Unit Tests - Controllers | Test all AI controllers | 2 days |
| 5.4 | Integration Tests - API | Test all AI API endpoints end-to-end | 3 days |
| 5.5 | Integration Tests - Database | Test database operations for new collections | 1 day |
| 5.6 | Integration Tests - LLM | Test Gemini/OpenAI integration with mocks | 2 days |
| 5.7 | Performance Tests | Load test AI endpoints, measure latency | 2 days |
| 5.8 | Accuracy Tests | Validate algorithm accuracy against targets | 2 days |
| 5.9 | Security Tests | Test auth, rate limiting, safety filters | 1 day |
| 5.10 | Frontend Tests | Test all AI UI components | 2 days |
| 5.11 | E2E Tests | Full user flow testing | 2 days |
| 5.12 | Bug Fixes & Optimization | Address all issues found | 3 days |

**Phase 5 Deliverables:**
- ✅ Unit test suite for all AI services, ML models, and controllers
- ✅ Integration test suite for API endpoints, database, and LLM integration
- ✅ Performance benchmarks meeting latency targets (<200ms real-time, <5s batch)
- ✅ Algorithm accuracy meeting targets (F1 > 0.90, NDCG > 0.75, AUC > 0.95)
- ✅ Security validation (auth, rate limiting, content safety)
- ✅ Frontend component tests
- ✅ End-to-end test scenarios
- ✅ All critical bugs fixed

---

### Phase 6: Production Deployment (Weeks 27-28)

**Objective:** Deploy AI system to production with monitoring and optimization.

| Task ID | Task | Description | Estimated Effort |
|---------|------|-------------|------------------|
| 6.1 | Environment Setup | Configure production .env, API keys, Redis | 1 day |
| 6.2 | Database Migration | Run indexes, seed initial data | 1 day |
| 6.3 | CI/CD Pipeline Update | Add AI service deployment steps | 1 day |
| 6.4 | Monitoring Setup | Configure AI-specific monitoring (latency, cost, accuracy) | 2 days |
| 6.5 | Logging & Alerting | Set up AI error logging, cost alerts, performance alerts | 1 day |
| 6.6 | Gradual Rollout | Deploy engines one by one with feature flags | 2 days |
| 6.7 | A/B Testing Setup | Configure A/B testing for AI improvements | 1 day |
| 6.8 | Documentation | API docs, deployment guide, runbook | 2 days |
| 6.9 | Performance Tuning | Optimize based on production metrics | 2 days |
| 6.10 | Post-Launch Monitoring | Monitor for 1 week, fix issues | 3 days |

**Phase 6 Deliverables:**
- ✅ Production environment with all API keys configured
- ✅ Database indexes and seed data in production
- ✅ CI/CD pipeline updated for AI services
- ✅ Monitoring dashboards for AI latency, cost, accuracy
- ✅ Alerting for AI errors, cost overruns, performance degradation
- ✅ Gradual rollout with feature flags
- ✅ A/B testing framework for continuous improvement
- ✅ Complete API documentation
- ✅ Production performance optimized
- ✅ Post-launch stability confirmed

---

## SUMMARY: TOTAL EFFORT ESTIMATE

| Phase | Duration | Tasks | Key Deliverables |
|-------|----------|-------|------------------|
| Phase 1: AI Core Setup | 2 weeks | 17 | LLM clients, orchestrator, cache, middleware, DB |
| Phase 2: Gemini/OpenAI Integration | 2 weeks | 16 | Prompt system, safety, model routing, pipeline |
| Phase 3: AI Features Development | 16 weeks | 56 | 7 AI engines, 22 algorithms, 8 ML models |
| Phase 4: Frontend AI Integration | 4 weeks | 12 | UI components for all AI features |
| Phase 5: Testing | 2 weeks | 12 | Unit, integration, performance, E2E tests |
| Phase 6: Production Deployment | 2 weeks | 10 | Production setup, monitoring, rollout |
| **Total** | **28 weeks** | **123** | **Complete AI Enterprise Hub** |

---

## APPENDIX: FILE CREATION SUMMARY

### New Backend Files to Create: ~85 files

```
services/ai/index.js                              # AI service aggregator
services/ai/orchestrator/queryRouter.js            # Query routing
services/ai/orchestrator/contextManager.js         # Context management
services/ai/orchestrator/memoryManager.js          # Memory management
services/ai/orchestrator/responseBuilder.js        # Response building
services/ai/clients/geminiClient.js                # Gemini API client
services/ai/clients/openaiClient.js                # OpenAI API client (refactor)
services/ai/clients/embeddingClient.js             # Embedding client
services/ai/clients/visionClient.js                # Vision client
services/ai/engines/assistant/intentClassifier.js  # A1
services/ai/engines/assistant/contextBuilder.js    # A2
services/ai/engines/assistant/knowledgeRetriever.js # A3
services/ai/engines/assistant/responseGenerator.js # A4
services/ai/engines/recommendation/behaviorAnalyzer.js    # B1
services/ai/engines/recommendation/needAnalyzer.js        # B2
services/ai/engines/recommendation/recommendationScorer.js # B3
services/ai/engines/recommendation/adaptiveRanker.js      # B4
services/ai/engines/document/documentProcessor.js         # C1
services/ai/engines/document/entityClassifier.js          # C2
services/ai/engines/document/documentSummarizer.js        # C3
services/ai/engines/document/criticalDataExtractor.js     # C4
services/ai/engines/analytics/dataCollector.js            # D1
services/ai/engines/analytics/patternDetector.js          # D2
services/ai/engines/analytics/trendAnalyzer.js            # D3
services/ai/engines/analytics/businessPredictor.js        # D4
services/ai/engines/automation/taskIdentifier.js          # E1
services/ai/engines/automation/workflowBuilder.js         # E2
services/ai/engines/automation/decisionAutomator.js       # E3
services/ai/engines/automation/processOptimizer.js        # E4
services/ai/engines/security/behaviorMonitor.js           # F1
services/ai/engines/security/anomalyDetector.js           # F2
services/ai/engines/security/riskCalculator.js            # F3
services/ai/engines/security/threatIdentifier.js          # F4
services/ai/engines/chatbot/nlpProcessor.js               # G1
services/ai/engines/chatbot/memoryManager.js              # G2
services/ai/engines/chatbot/contextManager.js             # G3
services/ai/engines/chatbot/answerGenerator.js            # G4
services/ai/ml/models/tfidfVectorizer.js
services/ai/ml/models/naiveBayesClassifier.js
services/ai/ml/models/kmeansClusterer.js
services/ai/ml/models/logisticRegression.js
services/ai/ml/models/isolationForest.js
services/ai/ml/models/linearRegression.js
services/ai/ml/models/decisionTree.js
services/ai/ml/models/knnClassifier.js
services/ai/ml/training/modelTrainer.js
services/ai/ml/training/modelEvaluator.js
services/ai/ml/training/modelRegistry.js
services/ai/ml/inference/modelRouter.js
services/ai/ml/inference/ensembleFusion.js
services/ai/cache/responseCache.js
services/ai/cache/embeddingCache.js
services/ai/cache/modelCache.js
services/ai/pipeline/dataIngestion.js
services/ai/pipeline/dataPreprocessing.js
services/ai/pipeline/featureExtraction.js
services/ai/pipeline/postProcessing.js
services/ai/utils/promptBuilder.js
services/ai/utils/responseParser.js
services/ai/utils/safetyFilter.js
services/ai/utils/rateLimiter.js
services/ai/utils/tokenTracker.js
services/ai/utils/costOptimizer.js
controllers/assistantController.js
controllers/recommendationController.js
controllers/documentController.js
controllers/analyticsController.js
controllers/automationController.js
controllers/securityController.js
routes/assistant.js
routes/recommendations.js
routes/documents.js
routes/analytics.js
routes/automation.js
routes/security.js
middleware/aiRateLimiter.js
middleware/aiAuth.js
middleware/contextLoader.js
middleware/auditLogger.js
middleware/costTracker.js
middleware/cacheCheck.js
middleware/safetyFilter.js
validators/assistant.js
validators/recommendations.js
validators/documents.js
validators/analytics.js
validators/automation.js
validators/security.js
validators/chatbot.js
models/AiConversation.js
models/AiCache.js
models/AiEmbedding.js
models/Document.js
models/DocChunk.js
models/DocAnalysis.js
models/DocSummary.js
models/AnalyticsCache.js
models/Workflow.js
models/WorkflowExecution.js
models/Decision.js
models/SecurityEvent.js
models/SecurityBaseline.js
models/Conversation.js
models/Message.js
models/ModelRegistry.js
models/TrainingData.js
```

### New Frontend Files to Create: ~10 files

```
frontend/src/components/AIAssistant.jsx
frontend/src/components/Recommendations.jsx
frontend/src/pages/Documents.jsx
frontend/src/pages/Analytics.jsx
frontend/src/pages/Automation.jsx
frontend/src/pages/Security.jsx
frontend/src/components/ChatPanel.jsx
frontend/src/context/AIContext.jsx
frontend/src/hooks/useAI.js
```

### Files to Modify: ~10 files

```
backend/server.js                    # Add new routes
backend/config/indexes.js            # Add new collection indexes
backend/models/User.js               # Add AI preferences fields
backend/models/Activity.js           # Add metadata fields
backend/services/aiService.js        # Refactor to use orchestrator
backend/controllers/aiController.js  # Refactor to use orchestrator
backend/routes/ai.js                 # Refactor to use orchestrator
backend/controllers/chatbotController.js  # Enhance with new features
backend/routes/chatbot.js            # Enhance with new routes
frontend/src/services/api.js         # Add new API endpoints
frontend/src/App.jsx                 # Add new routes
frontend/src/components/Sidebar.jsx  # Add navigation links
frontend/src/pages/AIInsights.jsx    # Enhance with all engine data
```

---

*End of AI Implementation Planning Document*