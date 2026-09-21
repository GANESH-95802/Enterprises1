# Phase 7: AI Intelligence Layer - API Documentation

## Overview

Phase 7 transforms AI Enterprise Hub into an Enterprise AI Operating System with AI Agents and RAG Knowledge Base. This document covers the AI Agent Framework APIs.

## Base URL

```
/api/agents
```

All endpoints require authentication via `Authorization: Bearer <token>`.

---

## AI Agent Management

### List AI Agents

```
GET /api/agents
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| type | string | Filter by agent type: `business`, `compliance`, `hr`, `customer-support`, `custom` |
| status | string | Filter by status: `active`, `inactive`, `paused`, `error` |
| limit | number | Max results (1-100, default 50) |

**Response:**
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "agent_id",
        "name": "Business AI Agent",
        "type": "business",
        "description": "Business analysis...",
        "status": "active",
        "version": "1.0.0",
        "configuration": {
          "provider": "auto",
          "temperature": 0.7,
          "maxTokens": 2048,
          "useKnowledge": true,
          "knowledgeLimit": 3,
          "capabilities": ["business-analysis", "market-suggestions"]
        },
        "permissions": {
          "roles": ["admin", "manager", "user"],
          "canReadDocuments": true,
          "canQueryKnowledge": true
        },
        "stats": {
          "totalRuns": 0,
          "totalTokens": 0,
          "totalErrors": 0,
          "avgLatencyMs": 0
        },
        "isSystem": true,
        "createdAt": "2026-01-01T00:00:00.000Z"
      }
    ],
    "total": 4
  }
}
```

### Get AI Agent

```
GET /api/agents/:agentId
```

**Response:** Single agent object (same structure as above).

### Create AI Agent

```
POST /api/agents/create
```

**Request Body:**
```json
{
  "name": "Sales Analysis Agent",
  "type": "custom",
  "description": "Analyzes sales data and provides insights",
  "configuration": {
    "provider": "auto",
    "temperature": 0.5,
    "maxTokens": 2048,
    "useKnowledge": true,
    "knowledgeLimit": 3
  },
  "permissions": {
    "roles": ["admin", "manager"],
    "canReadDocuments": true,
    "canQueryKnowledge": true,
    "canRunReports": true
  }
}
```

**Response:** `201 Created` with created agent.

### Update AI Agent

```
PATCH /api/agents/:agentId
```

**Request Body:** Partial update of `name`, `description`, `status`, `configuration`, `permissions`.

### Delete AI Agent

```
DELETE /api/agents/:agentId
```

**Note:** System agents cannot be deleted.

### Seed System Agents

```
POST /api/agents/seed
```

Creates the 4 default system agents (Business, Compliance, HR, Customer Support) for the current user.

### Get Agent Types

```
GET /api/agents/types
```

**Response:**
```json
{
  "success": true,
  "data": {
    "types": [
      {
        "type": "business",
        "name": "Business AI Agent",
        "description": "Business analysis, market suggestions, report generation, and decision support.",
        "capabilities": ["business-analysis", "market-suggestions", "report-generation", "decision-support"]
      }
    ],
    "implementations": [...]
  }
}
```

### Get Agent Stats

```
GET /api/agents/stats
```

---

## AI Agent Execution

### Run AI Agent

```
POST /api/agents/:agentId/run
```

**Request Body:**
```json
{
  "message": "Analyze our Q1 sales performance",
  "sessionId": "optional-session-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Based on the analysis...",
    "conversationId": "conv_id",
    "sessionId": "sess_123",
    "agentId": "agent_id",
    "agentType": "business",
    "agentName": "Business AI Agent",
    "provider": "openai",
    "model": "gpt-4",
    "knowledgeUsed": true,
    "knowledgeResults": [
      {
        "documentTitle": "Q1 Report.pdf",
        "score": 0.87,
        "snippet": "Revenue grew 15%..."
      }
    ],
    "usage": { "totalTokens": 500 },
    "latencyMs": 1200,
    "timestamp": "2026-01-01T00:00:00.000Z"
  }
}
```

---

## Agent Conversations

### List Conversations

```
GET /api/agents/conversations
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| agentId | string | Filter by agent |
| status | string | `active`, `archived`, `completed` |
| limit | number | Max results (1-50) |
| skip | number | Pagination offset |

### Get Conversation

```
GET /api/agents/conversations/:conversationId
```

**Response:** Full conversation with messages array.

### Archive Conversation

```
DELETE /api/agents/conversations/:conversationId
```

### Delete Conversation

```
DELETE /api/agents/conversations/:conversationId/permanent
```

---

## Security

- All endpoints require JWT authentication
- Role-based access control via agent permissions
- Organization-level data isolation
- AI middleware: safety filter, audit logging, cost tracking, rate limiting
- Input validation via express-validator
- Audit logging for create/delete/run operations

## Rate Limiting

- AI agent run endpoints: 30 requests/minute/user
- Global API: 100 requests/15 minutes/IP