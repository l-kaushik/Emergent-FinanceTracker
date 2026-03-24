# Finance Tracker - Docker Setup

## Quick Start (Production)

### Prerequisites
- Docker (20.10 or higher)
- Docker Compose (2.0 or higher)

### Option 1: Run with Docker Compose (Recommended)

```bash
# 1. Clone the repository
cd /app

# 2. Create environment file
cp .env.example .env
# Edit .env and set your JWT_SECRET_KEY

# 3. Build and start services
docker-compose up -d

# 4. View logs
docker-compose logs -f

# 5. Access the application
# Open http://localhost:8001 in your browser
```

### Option 2: Build and Run Single Container

```bash
# Build the image
docker build -t finance-tracker:latest .

# Run with external MongoDB
docker run -d \
  --name finance-tracker \
  -p 8001:8001 \
  -e MONGO_URL=mongodb://your-mongodb-host:27017 \
  -e DB_NAME=finance_tracker \
  -e JWT_SECRET_KEY=your-secret-key \
  finance-tracker:latest
```

## Development Setup

```bash
# Start development environment with hot reload
docker-compose -f docker-compose.dev.yml up

# Backend will be available at http://localhost:8001
# Frontend will be available at http://localhost:3000
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|----------|
| MONGO_URL | MongoDB connection string | mongodb://mongodb:27017 |
| DB_NAME | Database name | finance_tracker |
| JWT_SECRET_KEY | Secret key for JWT tokens | (required) |
| CORS_ORIGINS | Allowed CORS origins | * |
| RESEND_API_KEY | Resend API key for emails | (optional) |
| SENDER_EMAIL | Email sender address | onboarding@resend.dev |

## Common Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend

# Restart a service
docker-compose restart backend

# Rebuild after code changes
docker-compose up -d --build

# Remove all data (CAUTION: deletes database)
docker-compose down -v

# Check service health
docker-compose ps
```

## Production Deployment

### 1. Update Environment Variables

Edit `.env` file:
```bash
JWT_SECRET_KEY=generate-a-strong-32-char-secret-key
CORS_ORIGINS=https://yourdomain.com
```

### 2. Use Production MongoDB

```yaml
# In docker-compose.yml, update MongoDB or use external service:
environment:
  - MONGO_URL=mongodb://your-production-db:27017
```

### 3. Enable HTTPS

Add nginx reverse proxy:
```bash
# Add nginx service to docker-compose.yml
# Configure SSL certificates
# Redirect HTTP to HTTPS
```

### 4. Deploy

```bash
docker-compose up -d --build
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs backend

# Check MongoDB connection
docker-compose exec mongodb mongosh
```

### Frontend not loading
```bash
# Verify static files are built
docker-compose exec backend ls -la /app/static

# Rebuild container
docker-compose up -d --build
```

### Database connection issues
```bash
# Check MongoDB is running
docker-compose ps mongodb

# Test connection
docker-compose exec backend python -c "from pymongo import MongoClient; print(MongoClient('mongodb://mongodb:27017').server_info())"
```

## Performance Optimization

### For Production:
1. Use production-grade MongoDB (MongoDB Atlas recommended)
2. Set up Redis for session management
3. Enable Gunicorn with multiple workers
4. Add nginx for static file caching
5. Configure proper logging and monitoring

### Resource Limits

Add to docker-compose.yml:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Backup and Restore

### Backup MongoDB
```bash
docker-compose exec mongodb mongodump --out /data/backup
docker cp finance-tracker-mongodb:/data/backup ./backup
```

### Restore MongoDB
```bash
docker cp ./backup finance-tracker-mongodb:/data/backup
docker-compose exec mongodb mongorestore /data/backup
```

## Security Best Practices

1. ✅ Change default JWT_SECRET_KEY
2. ✅ Use environment variables for secrets
3. ✅ Enable HTTPS in production
4. ✅ Restrict CORS_ORIGINS to your domain
5. ✅ Use MongoDB authentication
6. ✅ Regular security updates: `docker-compose pull`
7. ✅ Monitor logs for suspicious activity

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Verify environment variables
- Ensure ports 8001 and 27017 are available
