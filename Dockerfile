# Multi-stage Dockerfile for Finance Tracker
# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /frontend

# Copy frontend package files
COPY frontend/package.json frontend/yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy frontend source
COPY frontend/ ./

# Build frontend for production with Vite
RUN yarn build

# Stage 2: Backend with Frontend Static Files
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Copy built frontend from previous stage
COPY --from=frontend-builder /frontend/build ./static

# Create .env template (will be overridden by environment variables)
RUN echo 'MONGO_URL=mongodb://mongodb:27017' > .env && \
    echo 'DB_NAME=finance_tracker' >> .env && \
    echo 'CORS_ORIGINS=*' >> .env && \
    echo 'JWT_SECRET_KEY=change-this-in-production' >> .env

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8001/api/')"

# Run the application
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
