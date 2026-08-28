# Docker Deployment Guide

## Building the Image

```bash
docker build -t aimdl-proposal-manager:latest .
```

## Running the Container

### Basic Run

```bash
docker run -p 8080:8080 aimdl-proposal-manager:latest
```

### With Environment Variables

```bash
docker run -p 8080:8080 \
  -e VITE_API_BASE_URL=https://api.example.com \
  -e VITE_API_TIMEOUT=60000 \
  aimdl-proposal-manager:latest
```

### Using Docker Compose

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "8080:8080"
    environment:
      - VITE_API_BASE_URL=http://backend:3000
      - VITE_API_TIMEOUT=30000
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
```

## Using Runtime Environment Variables

The application loads environment configuration from `/env-config.js` at runtime. 

### In Your Vue Application

Add this script tag to your `index.html` **before** the main app script:

```html
<script src="/env-config.js"></script>
```

Then access variables in your code:

```typescript
// src/services/api.ts or wherever you need it
const API_BASE_URL = (window as any).ENV?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
```

## Security Features

- Runs as non-root user (uid: 1001)
- Minimal nginx:alpine base image
- Security headers enabled
- Health checks configured

## Image Size Optimization

- Multi-stage build (build artifacts not included in final image)
- Alpine-based images
- Only production dependencies in runtime
- Nginx for efficient static file serving
- Gzip compression enabled

## Ports

- Application runs on port 8080 (non-privileged port for non-root user)

## Health Check

The container includes a health check that verifies nginx is serving content:
```bash
docker ps  # Shows health status
```
