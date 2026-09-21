# AI Enterprise Hub — Deployment Guide

## Overview

This guide covers production deployment of the AI Enterprise Hub backend API.

## Prerequisites

- Node.js 18+ or Docker
- MongoDB (Atlas or self-hosted)
- API keys: OpenAI, Gemini (optional)
- HTTPS domain (recommended)

## 1. Local Production Deployment

### 1.1 Environment Configuration

```bash
cd backend
cp .env.production.example .env
# Edit .env with your production values
# Generate JWT_SECRET:
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### 1.2 Install Dependencies

```bash
npm ci --production
```

### 1.3 Start the Server

```bash
NODE_ENV=production node server.js
```

Or with PM2 for process management:

```bash
npm install -g pm2
pm2 start server.js --name ai-enterprise-hub --env production
pm2 save
pm2 startup
```

## 2. Docker Deployment

### 2.1 Build

```bash
cd backend
docker build -t ai-enterprise-hub:latest .
```

### 2.2 Run with Docker Compose

```bash
# Configure your .env file first
docker-compose up -d
```

### 2.3 Verify Health

```bash
curl http://localhost:5000/api/monitoring/health
# Expected: {"success":true,"data":{"status":"healthy","healthy":true,...}}
```

## 3. CI/CD Pipeline

The included GitHub Actions workflow (`.github/workflows/ci-cd.yml`) provides:

1. **Test job:** Runs on Node 18/20, installs dependencies, runs `npm audit`, validates module loading
2. **Build job:** Builds Docker image with caching
3. **Deploy job:** Placeholder for production deployment

## 4. Nginx Reverse Proxy Configuration

```nginx
server {
    listen 443 ssl;
    server_name api.your-domain.com;

    ssl_certificate /etc/ssl/your-cert.pem;
    ssl_certificate_key /etc/ssl/your-key.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        client_max_body_size 25m;
    }
}
```

## 5. MongoDB Production Checklist

- Use MongoDB Atlas or a managed service
- Enable authentication
- Restrict network access (VPC / IP whitelist)
- Enable encryption at rest
- Set up automated backups
- Create a dedicated application user with least-privilege access

## 6. Performance Considerations

### Database Indexes

Indexes are created automatically on startup:
- AnalyticsEvent: user+eventType+timestamp, category+timestamp
- DocumentAnalysis: user+status+createdAt, classification+createdAt
- AiMetric: metricType+period+startTime

### Environment Variables for Performance

```bash
# Adjust RAG limits for scale
KNOWLEDGE_MAX_CANDIDATES=100
KNOWLEDGE_MIN_SCORE=0.25

# Memory limits
# Docker: 512MB recommend
```

### Monitoring

- Health endpoint: `GET /api/monitoring/health`
- Performance: `GET /api/monitoring/performance`
- Security audit: `POST /api/monitoring/security-audit`
- Error tracking: `GET /api/monitoring/errors`

## 7. Security Checklist

- [x] JWT_SECRET is cryptographically random (48+ bytes)
- [x] CORS origins restricted to known domains
- [x] Rate limiting applied (100 req/15min global, 30 req/min AI)
- [x] Helmet security headers enabled
- [x] Input sanitization prevents NoSQL injection
- [x] File upload MIME type validation
- [x] Non-root Docker user
- [ ] TLS/HTTPS configured behind proxy
- [ ] MongoDB authenticated with strong credentials
- [ ] Backup and restore procedures tested

## 8. Scaling Strategy

### Horizontal Scaling

1. Deploy multiple API instances behind a load balancer
2. Use MongoDB Atlas for managed scalability
3. Upload files to S3-compatible object storage (future)

### Vertical Scaling

- Increase container memory to 1GB for heavy document processing
- Use `cluster` module for multi-core Node.js

## 9. Troubleshooting

### Server won't start
- Verify all required env vars are set (`MONGO_URI`, `JWT_SECRET`, `NODE_ENV`)
- Check MongoDB connection string

### Document upload fails
- Check `DOCUMENT_MAX_FILE_SIZE` (default 20MB)
- Verify `uploads/documents` directory exists and is writable

### AI features use mock data
- Set `OPENAI_API_KEY` and/or `GEMINI_API_KEY`

### Rate limited unexpectedly
- Default limit is 100 req/15min per IP
- Adjust `RATE_LIMIT_MAX` if needed