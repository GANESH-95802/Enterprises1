# AI Enterprise Hub — API Documentation

## Overview

The AI Enterprise Hub API provides a comprehensive enterprise AI platform with authentication, AI infrastructure, assistant engine, enterprise RAG, recommendation engine, document intelligence, ML analytics, and production monitoring.

**Base URL:** `http://localhost:5000/api`

---

## Authentication

All endpoints (except `/api/health` and `/api/monitoring/health`) require a Bearer token in the `Authorization` header.

### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

---

## AI Infrastructure (`/api/ai`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat` | Process an AI chat request |
| GET | `/api/ai/capabilities` | Get AI capabilities |
| GET | `/api/ai/stats` | Get AI infrastructure stats |

## Assistant Engine (`/api/assistant`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/assistant/chat` | Chat with the enterprise assistant |
| POST | `/api/assistant/sessions` | Create a new session |
| GET | `/api/assistant/sessions/:sessionId` | Get session details |
| POST | `/api/assistant/tools/call` | Invoke an assistant tool |

## Knowledge Base / RAG (`/api/knowledge`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/knowledge/documents` | Upload and ingest a document (multipart) |
| POST | `/api/knowledge/search` | Semantic search over knowledge base |
| POST | `/api/knowledge/retrieve` | RAG retrieval with augmented context |
| GET | `/api/knowledge/documents` | List knowledge documents |
| GET | `/api/knowledge/documents/:documentId` | Get document details |
| GET | `/api/knowledge/documents/:documentId/chunks` | Get document chunks |
| PATCH | `/api/knowledge/documents/:documentId` | Update document metadata |
| DELETE | `/api/knowledge/documents/:documentId` | Delete document |
| GET | `/api/knowledge/stats` | Knowledge base statistics |

## Recommendation Engine (`/api/recommendations`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recommendations` | Get recommendations |
| GET | `/api/recommendations/personalized` | Get personalized recommendations |
| POST | `/api/recommendations/feedback` | Submit feedback |
| GET | `/api/recommendations/history` | Get recommendation history |
| GET | `/api/recommendations/stats` | Get recommendation statistics |
| POST | `/api/recommendations/similar` | Find similar content |
| GET | `/api/recommendations/types` | Get available types |

## Document Intelligence (`/api/document-intelligence`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/document-intelligence/upload` | Upload and analyze a document (multipart) |
| POST | `/api/document-intelligence/documents/:analysisId/analyze` | Analyze existing document |
| POST | `/api/document-intelligence/documents/:analysisId/extract` | Extract structured information |
| POST | `/api/document-intelligence/documents/:analysisId/summarize` | Summarize document |
| POST | `/api/document-intelligence/compare` | Compare two documents |
| GET | `/api/document-intelligence/documents/:analysisId/similar` | Find similar documents |
| GET | `/api/document-intelligence/documents/:analysisId` | Get analysis results |
| GET | `/api/document-intelligence/documents` | List analyzed documents |
| DELETE | `/api/document-intelligence/documents/:analysisId` | Delete analysis |
| GET | `/api/document-intelligence/stats` | Engine statistics |
| GET | `/api/document-intelligence/capabilities` | Engine capabilities |

### Document Upload Example
```
POST /api/document-intelligence/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: <binary file>
title: "Quarterly Report"
category: "finance"
tags: ["Q1", "2026"]
```

## ML & AI Analytics (`/api/analytics`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analytics/events` | Track an event |
| POST | `/api/analytics/events/batch` | Track multiple events |
| GET | `/api/analytics/users/:userId/behavior` | User behavior analytics |
| GET | `/api/analytics/users/:userId/predict` | Predict user engagement |
| GET | `/api/analytics/ai/usage` | AI usage analytics |
| GET | `/api/analytics/ai/performance` | AI performance metrics |
| GET | `/api/analytics/recommendations` | Recommendation analytics |
| GET | `/api/analytics/conversations` | Conversation insights |
| GET | `/api/analytics/trends` | Trend detection |
| GET | `/api/analytics/insights` | Generate insights |
| GET | `/api/analytics/predictions` | Generate predictions |
| GET | `/api/analytics/ml/features` | ML feature extraction |
| GET | `/api/analytics/ml/feature-vectors` | Build feature vectors |
| POST | `/api/analytics/aggregate` | Run metric aggregation |
| GET | `/api/analytics/stats` | Engine statistics |
| GET | `/api/analytics/capabilities` | Engine capabilities |

## Monitoring (`/api/monitoring`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/monitoring/health` | System health status (public) |
| GET | `/api/monitoring/performance` | Performance metrics |
| GET | `/api/monitoring/security-audit` | Get last security audit |
| POST | `/api/monitoring/security-audit` | Run security audit |
| GET | `/api/monitoring/errors` | Error tracking statistics |

---

## Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "msg": "Specific validation error",
      "param": "fieldName"
    }
  ]
}
```

## Rate Limiting

- **Global:** 100 requests per 15 minutes per IP
- **Auth login:** 5 attempts per minute per IP
- **Auth register:** 3 accounts per hour per IP
- **AI endpoints:** 30 requests per minute per user