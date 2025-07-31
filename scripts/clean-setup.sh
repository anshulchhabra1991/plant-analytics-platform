#!/bin/bash

echo "🧹 Starting Clean Setup Process..."

# Stop and remove all containers
echo "🛑 Stopping all containers..."
docker compose -f docker-compose.yml down -v --remove-orphans

# Remove all related Docker images
echo "🗑️ Removing Docker images..."
docker images | grep -E "(docker-|egrid|aiq2)" | awk '{print $3}' | xargs -r docker rmi -f

# Remove any dangling images and volumes
echo "🧽 Cleaning up Docker system..."
docker system prune -f
docker volume prune -f

# Build all services fresh
echo "🔨 Building all services..."
docker compose -f docker-compose.yml build --no-cache

# Start all services
echo "🚀 Starting all services..."
docker compose -f docker-compose.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🔍 Checking service health..."
docker compose -f docker-compose.yml ps

echo "✅ Clean setup complete!"
echo "🌐 Frontend: http://localhost:4000"
echo "🔗 API Gateway: http://localhost:8000" 
echo "⚡ Backend: http://localhost:3000 (internal only)" 