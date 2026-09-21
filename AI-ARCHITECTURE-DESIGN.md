# AI Enterprise Hub — AI System Architecture

> **Document Version:** 1.0  
> **Status:** Architecture Design Complete  
> **Target Platforms:** Node.js (Backend), MongoDB (Data), React (Frontend), Gemini/OpenAI (LLM APIs)

---

## 1. AI SYSTEM ARCHITECTURE

### 1.1 AI Layer Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION LAYER (React Frontend)                                      │
│  ┌─────────────────┐ ┌──────────────────┐ ┌────────────────┐ ┌───────────────┐ ┌──────────────────┐  │
│  │  AI Insights     │ │  AI Assistant    │ │   Chatbot      │ │  Analytics    │ │  Document Viewer │  │
│  │  Dashboard       │ │   Widget         │ │   Panel        │ │  Dashboard    │ │   Interface      │  │
│  └────────┬────────┘ └────────┬─────────┘ └───────┬────────┘ └──────┬────────┘ └────────┬─────────┘  │
└───────────┼───────────────────┼───────────────────┼────────────────┼───────────────────┼─────────────┘
            │                   │                   │                │                   │
┌───────────┼───────────────────┼───────────────────┼────────────────┼───────────────────┼─────────────┐
│           ▼                   ▼                   ▼                ▼                   ▼             │
│                              API GATEWAY & ROUTER (Express.js)                                      │
│  ┌─────────────────┐ ┌──────────────────┐ ┌────────────────┐ ┌───────────────┐ ┌──────────────────┐  │
│  │  /api/ai         │ │  /api/chatbot    │ │  /api/enter-   │ │  /api/auth    │ │  /api/{entities} │  │
│  │                  │ │                  │ │   prise        │ │               │ │                   │  │
│  └────────┬────────┘ └────────┬─────────┘ └───────┬────────┘ └──────┬────────┘ └────────┬─────────┘  │
└───────────┼───────────────────┼───────────────────┼────────────────┼───────────────────┼─────────────┘
            │                   │                   │                │                   │
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ▼          ▼                   ▼                   ▼                ▼                   ▼             │
│                              AI ORCHESTRATION LAYER                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              AI Service Orchestrator                                              │  │
│  │  ┌──────────────────┐ ┌───────────────────┐ ┌──────────────────┐ ┌────────────────────────┐    │  │
│  │  │  Query Router     │ │  Context Manager  │ │  Memory Manager  │ │  Response Builder      │    │  │
│  │  │  - Intent Routing │ │  - Session State  │ │  - Short-term    │ │  - Template Selection  │    │  │
│  │  │  - Priority Queue │ │  - User Profile   │ │  - Long-term     │ │  - Formatting          │    │  │
│  │  │  - Load Balance   │ │  - Domain Context │ │  - Episodic      │ │  - Confidence Scoring  │    │  │
│  │  └──────────────────┘ └───────────────────┘ └──────────────────┘ └────────────────────────┘    │  │
│  └────────────────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
            │                   │                   │                │                   │
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ▼          ▼                   ▼                   ▼                ▼                   ▼             │
│                              AI ENGINE LAYER (Core Intelligence)                                       │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  ┌──────────────────┐ ┌───────────────────┐ ┌──────────────────┐ ┌────────────────────────┐    │  │
│  │  │  Assistant        │ │  Recommendation   │ │   Document       │ │   Analytics            │    │  │
│  │  │  Engine           │ │  Engine            │ │   Intelligence   │ │   Engine               │    │  │
│  │  │  - Query Underst. │ │  - Behavior Anal. │ │   - Doc Process  │ │   - Data Collection    │    │  │
│  │  │  - Intent Class.  │ │  - Requirement    │ │   - Text Extract │ │   - Pattern Detection  │    │  │
│  │  │  - Context Anal.  │ │  - Scoring        │ │   - Classify     │ │   - Trend Analysis     │    │  │
│  │  │  - Knowledge Ret. │ │  - Ranking        │ │   - Summarize    │ │   - Prediction         │    │  │
│  │  │  - Response Gen.  │ │                   │ │   - Data Extract │ │                        │    │  │
│  │  └──────────────────┘ └───────────────────┘ └──────────────────┘ └────────────────────────┘    │  │
│  │  ┌──────────────────┐ ┌───────────────────┐ ┌──────────────────┐                                │  │
│  │  │  Automation       │ │   Security         │ │   Chatbot        │                                │  │
│  │  │  Engine           │ │   Intelligence     │ │   System         │                                │  │
│  │  │  - Task Identify  │ │   - Behavior Mon.  │ │   - NLP Flow     │                                │  │
│  │  │  - Workflow Create│ │   - Anomaly Detect │ │   - Conv Memory  │                                │  │
│  │  │  - Decision Auto  │ │   - Risk Calc      │ │   - Context Mgmt │                                │  │
│  │  │  - Process Optim. │ │   - Threat Ident.  │ │   - Answer Gen   │                                │  │
│  │  └──────────────────┘ └───────────────────┘ └──────────────────┘                                │  │
│  └────────────────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
            │                   │                   │                │                   │
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ▼          ▼                   ▼                   ▼                ▼                   ▼             │
│                              AI MODEL & ML INFRASTRUCTURE LAYER                                        │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  ┌──────────────────────────┐ ┌──────────────────────────┐ ┌──────────────────────────┐      │  │
│  │  │     Gemini API            │ │     OpenAI API           │ │   Rule-Based Models      │      │  │
│  │  │  - NLP (text generation)  │ │  - Advanced Reasoning    │ │   - Pattern Matching     │      │  │
│  │  │  - Embeddings (text)      │ │  - Complex Analysis      │ │   - Heuristic Rules      │      │  │
│  │  │  - Vision (image analysis)│ │  - Code Generation       │ │   - Decision Trees       │      │  │
│  │  │  - Classification         │ │  - Fallback LLM          │ │   - Regex Classifiers    │      │  │
│  │  └──────────────────────────┘ └──────────────────────────┘ └──────────────────────────┘      │  │
│  │  ┌──────────────────────────┐ ┌──────────────────────────┐ ┌──────────────────────────┐      │  │
│  │  │  Local ML Models          │ │   Embeddings Store       │ │   Vector Database        │      │  │
│  │  │  - TF-IDF Vectorizer      │ │   - Text Embeddings     │ │   - Semantic Search      │      │  │
│  │  │  - K-Means Clustering     │ │   - User Embeddings     │ │   - Similarity Matching  │      │  │
│  │  │  - Naive Bayes Classifier │ │   - Product Embeddings  │ │   - Nearest Neighbor     │      │  │
│  │  │  - Logistic Regression    │ │   - Document Embeddings │ │   - ANN Index            │      │  │
│  │  └──────────────────────────┘ └──────────────────────────┘ └──────────────────────────┘      │  │
│  └────────────────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
            │                   │                   │                │                   │
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ▼          ▼                   ▼                   ▼                ▼                   ▼             │
│                              DATA & PERSISTENCE LAYER                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  ┌──────────────────────────┐ ┌──────────────────────────┐ ┌──────────────────────────┐      │  │
│  │  │  MongoDB (Primary)        │ │   Redis Cache            │ │   In-Memory Collections  │      │  │
│  │  │  - Users, Businesses      │ │   - Session Data        │ │   - Conversation History  │      │  │
│  │  │  - Products, Customers    │ │   - AI Responses Cache  │ │   - Current Contexts      │      │  │
│  │  │  - Activities, Notif.     │ │   - Rankings Cache      │ │   - Temporary States      │      │  │
│  │  │  - Compliance, Healthcare │ │   - Rate Limits         │ │   - Feature Vectors       │      │  │
│  │  │  - Construction, Skills   │ │   - Token Buckets       │ │                           │      │  │
│  │  │  - Certificates, Reports  │ └──────────────────────────┘ └──────────────────────────┘      │  │
│  │  └──────────────────────────┘                                                               │  │
│  └────────────────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Data Processing Flow

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌───────────────────┐    ┌──────────────────┐
│              │    │                  │    │                  │    │                   │    │                  │
│  RAW DATA    │───▶│  DATA INGEST     │───▶│  DATA PRE-       │───▶│  FEATURE          │───▶│  MODEL INFER     │
│  Source      │    │  Collector       │    │  PROCESSING      │    │  EXTRACTION       │    │  / EXECUTION     │
│              │    │                  │    │                  │    │                   │    │                  │
│  - API Req   │    │  - Validate      │    │  - Clean         │    │  - Vectorize       │    │  - Rule Engine   │
│  - DB Query  │    │  - Sanitize      │    │  - Normalize     │    │  - Embed           │    │  - ML Model      │
│  - File Upld │    │  - Parse         │    │  - Tokenize      │    │  - Encode          │    │  - LLM Call      │
│  - Webhook   │    │  - Enrich        │    │  - Chunk         │    │  - Aggregate       │    │  - Ensemble      │
│  - Stream    │    │  - Classify      │    │  - Annotate      │    │  - Reduce          │    │  - Fusion        │
│              │    │                  │    │                  │    │                   │    │                  │
└──────────────┘    └──────────────────┘    └──────────────────┘    └───────────────────┘    └────────┬─────────┘
                                                                                                      │
                                                                                                      ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌───────────────────┐    ┌──────────────────┐
│              │    │                  │    │                  │    │                   │    │                  │
│  UI/CLIENT   │◀───│  RESPONSE        │◀───│  POST-PROCESSING │◀───│  RANKING &        │◀───│  RESULT          │
│  RENDER      │    │  FORMATTER       │    │                  │    │  SCORING          │    │  AGGREGATION     │
│              │    │                  │    │                  │    │                   │    │                  │
│  - Dashboard │    │  - JSON Build    │    │  - Validate      │    │  - Score Calc      │    │  - Merge Results │
│  - Chat UI   │    │  - Template Fill │    │  - Filter        │    │  - Rank Sort       │    │  - Deduplicate   │
│  - Widget    │    │  - Stream        │    │  - Translate     │    │  - Threshold       │    │  - Weight        │
│  - Report    │    │  - Markdown      │    │  - Summarize     │    │  - Diversity       │    │  - Combine       │
│              │    │                  │    │                  │    │                   │    │                  │
└──────────────┘    └──────────────────┘    └──────────────────┘    └───────────────────┘    └──────────────────┘
```

### 1.3 User Interaction Flow

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                      │
│  USER ACTION FLOW                                                                                    │
│                                                                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│  │   User     │  │   Auth     │  │  Request   │  │    AI      │  │  Response  │  │    UI      │    │
│  │   Action   │─▶│   Check    │─▶│  Parsing   │─▶│  Process   │─▶│   Build    │─▶│   Show     │    │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘  └────────────┘  └────────────┘    │
│       │               │               │               │               │               │             │
│       ▼               ▼               ▼               ▼               ▼               ▼             │
│  Click/Type    JWT Verify     Extract        Route to      Format        Render                    │
│  Submit        Session Check  Intent         Engine        JSON/Template  Component                 │
│  Voice Input   RBAC Check     Entities       Execute Logic  Confidence    Update State              │
│  File Upload   Rate Limit     Parameters     Get Results    Score         Notify User               │
│                                                                                                      │
│  INTENT-BASED ROUTING:                                                                               │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  User Input ──▶ Intent Classifier ──▶ Route to Engine                                          │  │
│  │       │                                                                                        │  │
│  │       ├─ "help me find..." ──▶ Recommendation Engine                                           │  │
│  │       ├─ "analyze this..." ──▶ Analytics Engine                                                │  │
│  │       ├─ "summarize doc"  ──▶ Document Intelligence                                            │  │
│  │       ├─ "create workflow" ──▶ Automation Engine                                               │  │
│  │       ├─ "check security" ──▶ Security Intelligence                                            │  │
│  │       ├─ "what is..."      ──▶ Enterprise Assistant                                            │  │
│  │       └─ "general chat"   ──▶ Chatbot System                                                   │  │
│  └───────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Model Communication Flow

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                      │
│  AI ENGINE ──▶ Model Router ──▶ Model Execution Pipeline                                             │
│       │                                                                                             │
│       ├──▶ 1. Rule-Based Check                                                                      │
│       │      ├─ If deterministic pattern match → return result                                      │
│       │      └─ If not → continue to next layer                                                     │
│       │                                                                                             │
│       ├──▶ 2. Local ML Model                                                                        │
│       │      ├─ If confidence > 0.85 → return result                                                │
│       │      ├─ If 0.60 <= confidence <= 0.85 → flag for review                                     │
│       │      └─ If confidence < 0.60 → continue to next layer                                       │
│       │                                                                                             │
│       ├──▶ 3. Embedding Store / Vector Search                                                       │
│       │      ├─ Generate query embedding via Gemini Embedding API                                   │
│       │      ├─ Search nearest neighbors in vector store                                            │
│       │      ├─ If relevant docs found (score > 0.75) → augment context                             │
│       │      └─ Continue to next layer with augmented context                                       │
│       │                                                                                             │
│       ├──▶ 4. Gemini API (Primary LLM)                                                              │
│       │      ├─ Build prompt with context, history, domain rules                                    │
│       │      ├─ Call Gemini with temperature=0.3 for factual, 0.7 for creative                      │
│       │      ├─ Parse and validate response                                                         │
│       │      └─ If response valid → return; else → continue                                         │
│       │                                                                                             │
│       ├──▶ 5. OpenAI API (Secondary LLM / Fallback)                                                 │
│       │      ├─ Only called if Gemini fails or for specific complex tasks                           │
│       │      ├─ Used for: advanced reasoning, code generation, complex analysis                     │
│       │      └─ Response fused with Gemini output if both available                                 │
│       │                                                                                             │
│       └──▶ 6. Response Fusion & Confidence Scoring                                                  │
│              ├─ Aggregate all available results                                                     │
│              ├─ Calculate weighted confidence score                                                 │
│              ├─ Select best response or merge multiple                                              │
│              └─ Return final output with confidence metadata                                        │
│                                                                                                      │
│  FALLBACK CHAIN (Priority Order):                                                                    │
│  Rule → Local ML → Embeddings → Gemini → OpenAI → Default Response                                  │
│                                                                                                      │
│  CACHING STRATEGY:                                                                                   │
│  - Cache identical queries (TTL: 5 min for general, 1 hour for static)                              │
│  - Cache embeddings (TTL: 24 hours, invalidate on data change)                                      │
│  - Cache model responses (TTL: 10 min, keyed by query + context hash)                               │
│                                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.5 Database and AI Connection Flow

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                      │
│  DATABASE-AI CONNECTION MATRIX                                                                       │
│                                                                                                      │
│  ┌──────────────────────┬─────────────────────────────┬──────────────────────────────────────────┐  │
│  │  Collection          │  AI Engine Use              │  Access Pattern                          │  │
│  ├──────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤  │
│  │  users               │  Assistant, Security        │  Read for personalization, auth checks   │  │
│  │                      │  Chatbot                    │  Role-based context injection            │  │
│  ├──────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤  │
│  │  businesses          │  Recommendation, Analytics  │  Entity lookup, aggregation pipeline     │  │
│  │                      │  Assistant                  │  Industry-specific knowledge base        │  │
│  ├──────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤  │
│  │  products            │  Recommendation, Chatbot    │  Vector search for similar items         │  │
│  │                      │  Document Intel             │  Product catalog analysis                │  │
│  ├──────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤  │
│  │  customers           │  Analytics, Automation      │  Behavior analysis, segmentation         │  │
│  │                      │  Recommendation             │  Customer 360 view for personalization   │  │
│  ├──────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤  │
│  │  activities          │  All Engines                │  Feed for all AI engines for context     │  │
│  │                      │                             │  Real-time event stream                  │  │
│  ├──────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤  │
│  │  notifications       │  Automation, Assistant      │  Trigger AI-generated notifications      │  │
│  │                      │                             │  Smart alert routing                     │  │
│  ├──────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤  │
│  │  compliance          │  Document Intel, Security   │  Regulatory analysis, risk calculations  │  │
│  │                      │                             │  Audit trail generation                  │  │
│  ├──────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤  │
│  │  healthcare_records  │  Document Intel, Analytics  │  PHI analysis, pattern detection         │  │
│  │                      │                             │  De-identified data processing           │  │
│  ├──────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤  │
│  │  construction_       │  Automation, Analytics      │  Project analytics, timeline predictions │  │
│  │  projects            │                             │  Resource optimization                   │  │
│  ├──────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤  │
│  │  skills              │  Recommendation, Assistant  │  Skill gap analysis, career path recs    │  │
│  ├──────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤  │
│  │  certificates        │  Document Intel, Assistant  │  Credential verification, expiry alerts  │  │
│  ├──────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤  │
│  │  reports             │  Analytics, Automation      │  Report generation, trend analysis       │  │
│  └──────────────────────┴─────────────────────────────┴──────────────────────────────────────────┘  │
│                                                                                                      │
│  DATA FLOW PATTERNS:                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │  Pattern 1: READ → ANALYZE → RESPOND                                                         │   │
│  │  DB Query → AI Engine → Process → Format → Return                                            │   │
│  │                                                                                               │   │
│  │  Pattern 2: READ → ENRICH → LLM → WRITE                                                      │   │
│  │  DB Query → Context Build → LLM Call → Parse → Store Result                                  │   │
│  │                                                                                               │   │
│  │  Pattern 3: STREAM → DETECT → ALERT                                                          │   │
│  │  Activity Stream → Pattern Detection → Risk Score → Notification                              │   │
│  │                                                                                               │   │
│  │  Pattern 4: BATCH → ANALYZE → REPORT                                                         │   │
│  │  Scheduled Query → Aggregation → ML Model → Report Generation                                 │   │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. AI ORCHESTRATION LAYER COMPONENTS

### 2.1 Query Router
- **Function:** Routes incoming requests to appropriate AI engine based on intent classification
- **Logic:** Intent → Engine mapping with priority queue and load balancing
- **Fallback:** If no engine matches, route to Chatbot System as default

### 2.2 Context Manager
- **Function:** Maintains session state, user profile, and domain context
- **Storage:** In-memory for active sessions, MongoDB for persistent context
- **Refresh:** Context refreshed every N interactions or on explicit user action

### 2.3 Memory Manager
- **Short-term:** Last 10 exchanges stored in-memory per session
- **Long-term:** Summarized conversation history stored in MongoDB
- **Episodic:** Key decisions and outcomes stored for pattern learning

### 2.4 Response Builder
- **Function:** Formats AI engine output into final response
- **Templates:** Separate templates per intent type (answer, list, comparison, action)
- **Enrichment:** Adds follow-up suggestions, data sources, and confidence scores