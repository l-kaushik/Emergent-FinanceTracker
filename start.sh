#!/bin/bash

# Finance Tracker - Quick Start Script

set -e

echo "🚀 Finance Tracker - Docker Setup"
echo "=================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    
    # Generate a random JWT secret
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "please-change-this-secret-key-$(date +%s)")
    
    # Update .env with generated secret
    if command -v sed &> /dev/null; then
        sed -i.bak "s/your-super-secret-key-change-this-in-production-min-32-chars/$JWT_SECRET/g" .env
        rm -f .env.bak
    fi
    
    echo "✅ .env file created with auto-generated JWT secret"
    echo ""
    echo "⚠️  IMPORTANT: Review and update .env file with your settings:"
    echo "   - MongoDB URL (if using external database)"
    echo "   - RESEND_API_KEY (if you want email reports)"
    echo ""
else
    echo "✅ .env file already exists"
fi

echo ""
echo "Choose deployment option:"
echo "1) Production (docker-compose with MongoDB)"
echo "2) Development (with hot reload)"
echo "3) Build single container only"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo ""
        echo "🏗️  Building and starting production services..."
        docker-compose up -d --build
        
        echo ""
        echo "⏳ Waiting for services to be healthy..."
        sleep 10
        
        echo ""
        echo "✅ Services started successfully!"
        echo ""
        echo "📱 Access your Finance Tracker:"
        echo "   🌐 Web App: http://localhost:8001"
        echo "   📊 API Docs: http://localhost:8001/docs"
        echo ""
        echo "📋 Useful commands:"
        echo "   View logs: docker-compose logs -f"
        echo "   Stop services: docker-compose down"
        echo "   Restart: docker-compose restart"
        echo ""
        ;;
    2)
        echo ""
        echo "🏗️  Building and starting development services..."
        docker-compose -f docker-compose.dev.yml up -d --build
        
        echo ""
        echo "⏳ Waiting for services to start..."
        sleep 10
        
        echo ""
        echo "✅ Development services started!"
        echo ""
        echo "📱 Access your Finance Tracker:"
        echo "   🌐 Frontend: http://localhost:3000"
        echo "   ⚙️  Backend: http://localhost:8001"
        echo "   📊 API Docs: http://localhost:8001/docs"
        echo ""
        echo "🔥 Hot reload is enabled for both frontend and backend"
        echo ""
        echo "📋 Useful commands:"
        echo "   View logs: docker-compose -f docker-compose.dev.yml logs -f"
        echo "   Stop: docker-compose -f docker-compose.dev.yml down"
        echo ""
        ;;
    3)
        echo ""
        echo "🏗️  Building single container image..."
        docker build -t finance-tracker:latest .
        
        echo ""
        echo "✅ Container built successfully!"
        echo ""
        echo "🚀 To run the container:"
        echo ""
        echo "docker run -d \\"
        echo "  --name finance-tracker \\"
        echo "  -p 8001:8001 \\"
        echo "  -e MONGO_URL=mongodb://your-mongodb-host:27017 \\"
        echo "  -e DB_NAME=finance_tracker \\"
        echo "  -e JWT_SECRET_KEY=your-secret-key \\"
        echo "  finance-tracker:latest"
        echo ""
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📚 For more information, see README.docker.md"
