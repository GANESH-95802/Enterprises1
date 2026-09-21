# AI Enterprise Hub — Data Flow Diagram

> **Document Version:** 1.0  
> **Status:** Design Complete

---

## 1. OVERALL SYSTEM DATA FLOW

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                     │
│  USER ──▶ React Frontend ──▶ Express API ──▶ AI Orchestrator ──▶ AI Engine ──▶ Model Layer ──▶ Response │
│                              │                    │               │              │                    │
│                              ▼                    ▼               ▼              ▼                    │
│                         MongoDB              Redis Cache    Activity Log    External APIs             │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. USER QUERY DATA FLOW (Enterprise Assistant)

```
┌──────────┐    ┌──────────────┐    ┌────────────────┐    ┌────────────────┐    ┌──────────────┐
│          │    │              │    │                │    │                │    │              │
│  USER    │───▶│  /api/ai/    │───▶│  AI Orchestrator│───▶│  Intent        │───▶│  Context     │
│  QUERY   │    │  query       │    │  - Auth Check  │    │  Classifier    │    │  Builder     │
│          │    │              │    │  - Rate Limit  │    │  - Rule Match  │    │  - Session   │
└──────────┘    └──────────────┘    └────────────────┘    │  - Embedding   │    │  - Profile   │
                                                          │  - LLM Class   │    │  - Domain    │
                                                          └───────┬────────┘    └──────┬─────────┘
                                                                  │                     │
                                                                  ▼                     ▼
┌──────────┐    ┌──────────────┐    ┌────────────────┐    ┌────────────────┐    ┌──────────────┐
│          │    │              │    │                │    │                │    │              │
│  USER    │◀───│  Response    │◀───│  Response      │◀───│  LLM Response  │◀───│  Knowledge   │
│  RECEIVES│    │  Formatter   │    │  Validator     │    │  Generator     │    │  Retriever   │
│          │    │  - Template  │    │  - Accuracy    │    │  - Gemini Call │    │  - DB Query  │
│          │    │  - Enrich    │    │  - Safety      │    │  - Parse       │    │  - Vector    │
│          │    │  - Format    │    │  - Complete    │    │  - Validate    │    │  - KB Search │
└──────────┘    └──────────────┘    └────────────────┘    └────────────────┘    └──────────────┘
```

---

## 3. RECOMMENDATION ENGINE DATA FLOW

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│              │    │                  │    │                  │    │                  │
│  User        │───▶│  Behavior        │───▶│  Enterprise      │───▶│  Multi-Factor    │
│  Activity    │    │  Analyzer        │    │  Need Analyzer   │    │  Scorer          │
│  Stream      │    │                  │    │                  │    │                  │
│              │    │  - Aggregate     │    │  - Gap Analysis  │    │  - User Fit      │
│  MongoDB:    │    │  - Frequency     │    │  - Budget Check  │    │  - Enterprise    │
│  activities  │    │  - Preferences   │    │  - Vendor Eval   │    │  - Popularity    │
│  users       │    │  - Patterns      │    │  - Trend Align   │    │  - Recency       │
│  products    │    │                  │    │                  │    │                  │
│  businesses  │    └──────────────────┘    └──────────────────┘    └────────┬─────────┘
└──────────────┘                                                             │
                                                                             ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│              │    │                  │    │                  │    │                  │
│  User        │◀───│  Response        │◀───│  Adaptive        │◀───│  Ranked          │
│  Receives    │    │  Builder         │    │  Ranker          │    │  Recommendations │
│  Recs        │    │                  │    │                  │    │                  │
│              │    │  - Format        │    │  - Business Rules│    │  - Sorted Items  │
│  Frontend:   │    │  - Explain       │    │  - Signal Boost  │    │  - Scores        │
│  AIInsights  │    │  - Suggest       │    │  - Feedback Adj  │    │  - Diversity     │
│              │    │                  │    │  - Diversity     │    │                  │
└──────────────┘    └──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## 4. DOCUMENT INTELLIGENCE DATA FLOW

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│              │    │                  │    │                  │    │                  │
│  User        │───▶│  Document        │───▶│  Text            │───▶│  Semantic        │
│  Uploads     │    │  Processor       │    │  Extractor       │    │  Classifier      │
│  File        │    │                  │    │                  │    │                  │
│              │    │  - Format Detect │    │  - PDF/DOCX/IMG  │    │  - Entity Recog  │
│  Supported:  │    │  - Validate      │    │  - OCR (Vision)  │    │  - LLM Classify  │
│  PDF, DOCX,  │    │  - Structure ID  │    │  - Normalize     │    │  - Embed Match   │
│  CSV, XLSX,  │    │  - Chunk         │    │  - Tables        │    │  - Importance    │
│  Images, TXT │    │                  │    │                  │    │                  │
└──────────────┘    └──────────────────┘    └──────────────────┘    └────────┬─────────┘
                                                                             │
                                                                             ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│              │    │                  │    │                  │    │                  │
│  User        │◀───│  Response        │◀───│  Summarizer      │◀───│  Critical        │
│  Views       │    │  Builder         │    │  + Extractor     │    │  Data Extractor  │
│  Results     │    │                  │    │                  │    │                  │
│              │    │  - Summary       │    │  - Multi-Level   │    │  - Action Items  │
│  Frontend:   │    │  - Entities      │    │  - Executive     │    │  - Deadlines     │
│  Document    │    │  - Actions       │    │  - Detailed      │    │  - Risks         │
│  Viewer      │    │  - Risks         │    │  - Bullet        │    │  - Decisions     │
│              │    │                  │    │  - Section-wise  │    │                  │
└──────────────┘    └──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## 5. ANALYTICS ENGINE DATA FLOW

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│              │    │                  │    │                  │    │                  │
│  Data        │───▶│  Data            │───▶│  Pattern         │───▶│  Trend           │
│  Sources     │    │  Collector       │    │  Detector        │    │  Analyzer        │
│              │    │                  │    │                  │    │                  │
│  MongoDB:    │    │  - Connect       │    │  - Trend Detect  │    │  - Model Select  │
│  activities  │    │  - Validate      │    │  - Seasonality   │    │  - Train         │
│  orders      │    │  - Normalize     │    │  - Correlation   │    │  - Forecast      │
│  products    │    │  - Aggregate     │    │  - Anomaly       │    │  - Decompose     │
│  customers   │    │  - Time Series   │    │  - Clustering    │    │  - Validate      │
│              │    │                  │    │                  │    │                  │
│  External    │    └──────────────────┘    └──────────────────┘    └────────┬─────────┘
│  APIs        │                                                             │
└──────────────┘                                                             ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│              │    │                  │    │                  │    │                  │
│  User        │◀───│  Dashboard       │◀───│  Business        │◀───│  Forecasts       │
│  Views       │    │  Builder         │    │  Predictor       │    │  + Patterns      │
│  Analytics   │    │                  │    │                  │    │                  │
│              │    │  - Charts        │    │  - Risk Assess   │    │  - Trends        │
│  Frontend:   │    │  - Metrics       │    │  - Opportunity   │    │  - Seasonality   │
│  Dashboard   │    │  - Insights      │    │  - Scenarios     │    │  - Correlations  │
│              │    │  - Alerts        │    │  - Recommend     │    │  - Anomalies     │
└──────────────┘    └──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## 6. AUTOMATION ENGINE DATA FLOW

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│              │    │                  │    │                  │    │                  │
│  Activity    │───▶│  Task            │───▶│  Workflow        │───▶│  Decision        │
│  Logs        │    │  Identifier      │    │  Builder         │    │  Automation      │
│              │    │                  │    │                  │    │                  │
│  MongoDB:    │    │  - Frequency     │    │  - Decompose     │    │  - Type Classify │
│  activities  │    │  - Repetition    │    │  - Dependencies  │    │  - Rule Eval     │
│  processes   │    │  - Eligibility   │    │  - Conditions    │    │  - ML Predict    │
│  workflows   │    │  - ROI Calc      │    │  - Integrations  │    │  - Hybrid Fusion │
│              │    │  - Priority      │    │  - Error Handle  │    │  - Approval Check│
└──────────────┘    └──────────────────┘    └──────────────────┘    └────────┬─────────┘
                                                                             │
                                                                             ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│              │    │                  │    │                  │    │                  │
│  User        │◀───│  Execution       │◀───│  Process         │◀───│  Executable      │
│  Monitors    │    │  Engine          │    │  Optimizer       │    │  Workflow        │
│              │    │                  │    │                  │    │                  │
│  Frontend:   │    │  - Run Steps     │    │  - Metric Collect│    │  - Validated     │
│  Automation  │    │  - Handle Errors │    │  - Bottleneck ID │    │  - Steps         │
│  Dashboard   │    │  - Notify        │    │  - Parallelize   │    │  - Integrations  │
│              │    │  - Log Results   │    │  - A/B Test      │    │  - Error Handling│
└──────────────┘    └──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## 7. SECURITY INTELLIGENCE DATA FLOW

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│              │    │                  │    │                  │    │                  │
│  Activity    │───▶│  User Behavior   │───▶│  Anomaly         │───▶│  Risk            │
│  Stream      │    │  Monitor         │    │  Detection       │    │  Calculator      │
│              │    │                  │    │                  │    │                  │
│  MongoDB:    │    │  - Baseline      │    │  - Z-Score       │    │  - User Risk     │
│  activities  │    │  - Profile       │    │  - Isolation     │    │  - Action Risk   │
│  users       │    │  - Real-time     │    │  - Sequence      │    │  - Resource Risk │
│  sessions    │    │  - Deviation     │    │  - Temporal      │    │  - Session Risk  │
│              │    │  - Scoring       │    │  - Ensemble      │    │  - Mitigation    │
└──────────────┘    └──────────────────┘    └──────────────────┘    └────────┬─────────┘
                                                                             │
                                                                             ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│              │    │                  │    │                  │    │                  │
│  Security    │◀───│  Alert           │◀───│  Threat          │◀───│  Risk Scores     │
│  Team        │    │  System          │    │  Identifier      │    │  + Anomalies     │
│  Notified    │    │                  │    │                  │    │                  │
│              │    │  - Severity      │    │  - Signature     │    │  - User Scores   │
│  Actions:    │    │  - Escalate      │    │  - Behavioral    │    │  - Event Scores  │
│  Block       │    │  - Notify        │    │  - Intel Feed    │    │  - Threat Scores │
│  MFA         │    │  - Log           │    │  - ML Classify   │    │  - Anomaly Scores│
│  Investigate │    │  - Auto-respond  │    │  - Score         │    │                  │
└──────────────┘    └──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## 8. CHATBOT SYSTEM DATA FLOW

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│              │    │                  │    │                  │    │                  │
│  User        │───▶│  NLP Processor   │───▶│  Conversation    │───▶│  Context         │
│  Message     │    │                  │    │  Memory          │    │  Manager         │
│              │    │  - Tokenize      │    │                  │    │                  │
│  WebSocket   │    │  - Intent Detect │    │  - Short-term    │    │  - Topic Track   │
│  /api/chat   │    │  - Entity Extract│    │  - Long-term     │    │  - Switch Detect │
│              │    │  - Sentiment     │    │  - Merge         │    │  - Pronoun Res   │
│              │    │  - Reformulate   │    │  - Summarize     │    │  - Ellipsis Res  │
└──────────────┘    └──────────────────┘    └──────────────────┘    └────────┬─────────┘
                                                                             │
                                                                             ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│              │    │                  │    │                  │    │                  │
│  User        │◀───│  Response        │◀───│  Answer          │◀───│  Knowledge       │
│  Receives    │    │  Sender          │    │  Generator       │    │  + Context       │
│  Reply       │    │                  │    │                  │    │                  │
│              │    │  - Stream        │    │  - Select Knowl. │    │  - Processed Q   │
│  Frontend:   │    │  - Format        │    │  - Response Type │    │  - Entities      │
│  Chat Panel  │    │  - Suggestions   │    │  - Template      │    │  - Sentiment     │
│              │    │  - Actions       │    │  - Gemini Call   │    │  - Memory        │
│              │    │                  │    │  - Validate      │    │  - Context       │
└──────────────┘    └──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## 9. CROSS-ENGINE DATA SHARING

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                     │
│  SHARED DATA FLOW BETWEEN ENGINES                                                                    │
│                                                                                                     │
│  ┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐                    │
│  │  Assistant        │◀───────▶│  Recommendation  │◀───────▶│  Analytics       │                    │
│  │  Engine           │         │  Engine          │         │  Engine          │                    │
│  │                   │         │                  │         │                  │                    │
│  │  Shares:          │         │  Shares:         │         │  Shares:         │                    │
│  │  - User Intent    │         │  - User Prefs    │         │  - Trends        │                    │
│  │  - Context        │         │  - Scores        │         │  - Patterns      │                    │
│  │  - Query History  │         │  - Rankings      │         │  - Forecasts     │                    │
│  └──────────────────┘         └──────────────────┘         └──────────────────┘                    │
│           │                           │                           │                                │
│           ▼                           ▼                           ▼                                │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              SHARED DATA LAYER                                                │   │
│  │  ┌──────────────────────────────────────────────────────────────────────────────────────┐  │   │
│  │  │  Activity Log (MongoDB)  │  User Profiles  │  Session Store  │  Cache (Redis)      │  │   │
│  │  └──────────────────────────────────────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────────────────────────────────────┘   │
│           │                           │                           │                                │
│           ▼                           ▼                           ▼                                │
│  ┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐                    │
│  │  Automation       │◀───────▶│  Security        │◀───────▶│  Chatbot         │                    │
│  │  Engine           │         │  Intelligence    │         │  System          │                    │
│  │                   │         │                  │         │                  │                    │
│  │  Shares:          │         │  Shares:         │         │  Shares:         │                    │
│  │  - Workflows      │         │  - Risk Scores   │         │  - Conv History  │                    │
│  │  - Decisions      │         │  - Anomalies     │         │  - User Intent   │                    │
│  │  - Process Metrics│         │  - Threats       │         │  - Feedback      │                    │
│  └──────────────────┘         └──────────────────┘         └──────────────────┘                    │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. DATA STORAGE & CACHING STRATEGY

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                     │
│  DATA STORAGE MATRIX                                                                                │
│                                                                                                     │
│  ┌──────────────────────┬──────────────────────┬──────────────────────┬──────────────────────────┐  │
│  │  Data Type           │  Primary Storage     │  Cache (Redis)       │  TTL                     │  │
│  ├──────────────────────┼──────────────────────┼──────────────────────┼──────────────────────────┤  │
│  │  User Profiles       │  MongoDB (users)     │  Session data        │  24 hours                │  │
│  │  Business Data       │  MongoDB (businesses)│  Lookup results      │  1 hour                  │  │
│  │  Activity Logs       │  MongoDB (activities) │  Recent activities   │  5 minutes               │  │
│  │  Conversation Hist.  │  MongoDB (sessions)   │  Active sessions     │  Session duration        │  │
│  │  AI Responses        │  MongoDB (ai_cache)   │  Frequent queries    │  10 minutes              │  │
│  │  Embeddings          │  MongoDB (embeddings)  │  Recent embeddings  │  24 hours                │  │
│  │  Recommendations     │  MongoDB (recs_cache)  │  Top recommendations│  30 minutes              │  │
│  │  Analytics Data      │  MongoDB (analytics)   │  Dashboard metrics  │  5 minutes               │  │
│  │  Security Events     │  MongoDB (security)    │  Recent alerts      │  1 hour                  │  │
│  │  Workflow State      │  MongoDB (workflows)   │  Active workflows   │  Until completion        │  │
│  │  Rate Limits         │  Redis                 │  N/A                │  Per window              │  │
│  │  Token Buckets       │  Redis                 │  N/A                │  Per window              │  │
│  └──────────────────────┴──────────────────────┴──────────────────────┴──────────────────────────┘  │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘