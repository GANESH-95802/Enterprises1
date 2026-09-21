# ============================================
# AI Enterprise Hub - Production Dockerfile
# ============================================
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies only (cached layer)
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# Build stage
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Production stage
FROM node:20-alpine AS production
ENV NODE_ENV=production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy application files
COPY --from=build --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodejs:nodejs /app .

# Create upload directories
RUN mkdir -p uploads/knowledge uploads/documents && \
    chown -R nodejs:nodejs uploads

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]