# Phase 7: AI Intelligence Layer - Architecture

## Overview

Phase 7 transforms AI Enterprise Hub into an Enterprise AI Operating System with AI Agents and RAG Knowledge Base integration.

## Architecture Components

### 1. AI Agent Framework

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Agent Framework                       │
├─────────────────────────────────────────────────────────────┤
│  Agent Manager (Facade)                                     │
│  ├── Agent Registry ──── CRUD + System Agent Seeding        │
│  ├── Agent Execution Engine ── Prompt Building + AI Routing  │
│  └── Agent Memory ──── Conversation Persistence + Context    │
├─────────────────────────────────────────────────────────────┤
│  Agent Implementations                                      │
│  ├── Business AI Agent                                      │
│  ├── Compliance AI Agent                                    │
│  ├── HR AI Agent                                            │
│  └── Customer Support AI Agent                              │
└─────────────────────────────────────────────────────────────┘
```

### 2. Agent Execution Flow

```
User Message
    ↓
Agent Registry (validate agent)
    ↓
Agent Memory (get/create conversation)
    ↓
Context Manager (enterprise context)
    ↓
RAG Retrieval (knowledge base context)
    ↓
Agent Implementation (build prompt)
    ↓
Query Router (Gemini/OpenAI fallback)
    ↓
Save response to memory
    ↓
Record run stats
```

### 3. Database Models

| Model | Purpose |
|-------|---------|
| Organization | Multi-tenant organization entity with settings and subscription |
| AiAgent | Agent registry entry with configuration, permissions, stats |
| AgentConversation | Multi-turn conversation storage with messages and context |

### 4. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/agents | List AI agents |
| GET | /api/agents/types | Get available agent types |
| GET | /api/agents/stats | Get agent framework stats |
| POST | /api/agents/seed | Seed system agents |
| POST | /api/agents/create | Create custom agent |
| GET | /api/agents/:agentId | Get agent details |
| PATCH | /api/agents/:agentId | Update agent |
| DELETE | /api/agents/:agentId | Delete agent |
| POST | /api/agents/:agentId/run | Run agent with message |
| GET | /api/agents/conversations | List conversations |
| GET | /api/agents/conversations/:id | Get conversation |
| DELETE | /api/agents/conversations/:id | Archive conversation |
| DELETE | /api/agents/conversations/:id/permanent | Delete conversation |

### 5. Security

- JWT authentication on all endpoints
- Role-based access control via agent permissions
- Organization-level data isolation
- AI middleware: safety filter, audit logging, cost tracking, rate limiting
- Input validation via express-validator
- Audit logging for create/delete/run operations

### 6. Frontend Pages

| Route | Page | Description |
|-------|------|-------------|
| /agents | Agents Dashboard | View all agents, create custom agents, start chats |
| /agents/:agentId/chat | Agent Chat | Real-time conversation with AI agent |

### 7. RAG Integration

The AI Agent framework integrates with the existing RAG Knowledge Base:
- Agents automatically retrieve relevant knowledge context
- Knowledge results are included in agent responses
- Citations show which documents informed the answer
- Knowledge usage is tracked per conversation

### 8. File Structure

```
backend/
├── models/
│   ├── Organization.js
│   ├── AiAgent.js
│   └── AgentConversation.js
├── services/ai/agents/
│   ├── index.js (Agent Manager)
│   ├── agentRegistry.js
│   ├── agentMemory.js
│   ├── agentExecutionEngine.js
│   └── implementations/
│       ├── businessAgent.js
│       ├── complianceAgent.js
│       ├── hrAgent.js
│       └── customerSupportAgent.js
├── controllers/agentController.js
├── routes/agents.js
├── validators/agents.js
└── docs/PHASE7-API.md

frontend/
├── src/
│   ├── services/agentService.js
│   ├── pages/Agents.jsx
│   └── pages/AgentChat.jsx
└── docs/PHASE7-ARCHITECTURE.md