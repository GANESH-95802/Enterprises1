# Phase 8: Enterprise Production & SaaS Layer - API Documentation

## Overview

Phase 8 transforms AI Enterprise Hub into a production-ready SaaS platform with multi-tenant organization management, subscription billing, and usage tracking.

## Base URL

```
/api/saas
```

All endpoints require authentication via `Authorization: Bearer <token>`.

---

## Plans & Pricing

### Get Platform Plans

```
GET /api/saas/plans
```

Returns all available subscription plans with pricing and feature details.

---

## Organization Management

### Register Company

```
POST /api/saas/organizations/register
```

**Request Body:**
```json
{
  "companyName": "Acme Corporation",
  "industry": "Technology",
  "description": "AI-powered solutions",
  "size": "small"
}
```

Creates organization, default free subscription, and owner team membership.

### Get My Organizations

```
GET /api/saas/organizations
```

Returns organizations the current user belongs to with membership roles.

### Get Organization

```
GET /api/saas/organizations/:orgId
```

### Update Organization

```
PATCH /api/saas/organizations/:orgId
```

**Request Body:** `companyName`, `industry`, `description`, `size`, `logo`, `settings`

**Permission:** Owner or Admin only.

---

## Team Management

### List Team Members

```
GET /api/saas/organizations/:orgId/team
```

### Invite Team Member

```
POST /api/saas/organizations/:orgId/team/invite
```

**Request Body:**
```json
{
  "email": "colleague@company.com",
  "role": "member"
}
```

**Permission:** Owner or Admin only. Enforces user limits based on subscription plan.

### Update Team Member

```
PATCH /api/saas/organizations/:orgId/team/:memberId
```

**Request Body:** `role`, `status`, `permissions`

### Remove Team Member

```
DELETE /api/saas/organizations/:orgId/team/:memberId
```

---

## Subscription & Billing

### Get Subscription

```
GET /api/saas/organizations/:orgId/subscription
```

### Change Plan

```
POST /api/saas/organizations/:orgId/subscription/change
```

**Request Body:**
```json
{
  "plan": "professional",
  "billingCycle": "monthly"
}
```

Valid plans: `free`, `professional`, `enterprise`
Valid cycles: `monthly`, `yearly`

Automatically generates invoice for paid plan changes.

### Cancel Subscription

```
POST /api/saas/organizations/:orgId/subscription/cancel
```

### List Invoices

```
GET /api/saas/organizations/:orgId/invoices
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | `draft`, `pending`, `paid`, `failed`, `void`, `refunded` |
| limit | number | Max results |
| skip | number | Pagination offset |

---

## Usage Tracking & Analytics

### Get Current Usage

```
GET /api/saas/organizations/:orgId/usage
```

Returns current usage, limits, usage percentages, and warnings.

### Get Usage History

```
GET /api/saas/organizations/:orgId/usage/history
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| months | number | Number of months of history (default 6) |

### Get Platform Usage (Admin)

```
GET /api/saas/admin/platform-usage
```

**Permission:** Admin only.

---

## Subscription Plans

### Free Plan
- 100 AI requests/month
- 100K tokens/month
- 1GB storage
- 3 agents
- 5 users
- 50 documents
- Basic agents only

### Professional Plan ($49/month)
- 5,000 AI requests/month
- 5M tokens/month
- 10GB storage
- 10 agents
- 25 users
- 500 documents
- All AI agents
- Custom agents
- Advanced analytics
- API access

### Enterprise Plan ($199/month)
- 50,000 AI requests/month
- 50M tokens/month
- 100GB storage
- 100 agents
- 1,000 users
- 10,000 documents
- All AI agents
- Custom agents
- Advanced analytics
- API access
- SSO enabled
- Priority support

---

## Security

- JWT authentication on all endpoints
- Organization-level data isolation
- Role-based access control (owner, admin, manager, member, viewer)
- Audit logging for organization operations
- Invitation token validation
- Usage limit enforcement

## Rate Limiting

- Global API: 100 requests/15 minutes/IP
- AI endpoints: 30 requests/minute/user