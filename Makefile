# System Commands
.PHONY: up start clean stop

# Complete system startup (recommended for new users)
up:
	@echo "🚀 Starting Plant Analytics System..."
	./scripts/run-system.sh

# Quick start with Docker Compose (for development)
start:
	@echo "🐳 Starting services..."
	docker compose up -d

# cleanup - stops containers and removes volumes
clean:
	@echo "🛑 Stopping all services..."
	docker compose down --rmi all -v --remove-orphans
	@echo "🧹 Removing all plant-analytics images..."
	@docker images | grep -E "(plant-analytics|plant_analytics)" | awk '{print $$3}' | xargs -r docker rmi || true
	@echo "🗑️ Removing project volumes..."
	@docker volume ls -q | grep -E "plant-analytics" | xargs -r docker volume rm || true
	@echo "🧹 Pruning Docker system..."
	docker system prune -af --volumes
	@echo "⚠️  All Docker resources cleaned!"
	@echo "✅ System cleanup complete"

# Just stop containers
stop:
	@echo "🛑 Stopping services..."
	docker compose down

# Logs & Monitoring
.PHONY: logs logs-backend logs-gateway logs-frontend logs-airflow status

# View all service logs
logs:
	@echo "📋 Viewing all service logs..."
	docker compose logs -f

# Individual service logs
logs-backend:
	@echo "📋 Backend API logs..."
	docker compose logs -f backend-api

logs-gateway:
	@echo "📋 API Gateway logs..."
	docker compose logs -f api-gateway

logs-frontend:
	@echo "📋 Frontend logs..."
	docker compose logs -f frontend

logs-airflow:
	@echo "📋 Airflow logs..."
	docker compose logs -f airflow-webserver airflow-scheduler

# Service status
status:
	@echo "📊 Service Status:"
	@docker compose ps

# Health & Testing
.PHONY: health test-api test-system test test-user test-minio test-integration

# Check system health
health:
	@echo "🏥 Checking system health..."
	@echo ""
	@echo "🚪 API Gateway:"
	@curl -s http://localhost:8000/health | jq . 2>/dev/null || echo "❌ Gateway not responding"
	@echo ""
	@echo "🌐 Frontend:"
	@curl -s http://localhost:4000 > /dev/null && echo "✅ Frontend OK" || echo "❌ Frontend not responding"
	@echo ""
	@echo "🔐 Auth Service:"
	@curl -s http://localhost:8000/auth/health 2>/dev/null | jq . 2>/dev/null || echo "❌ Auth service not responding"
	@echo ""
	@echo "📊 Backend API:"
	@curl -s http://localhost:8000/api/health 2>/dev/null | jq . 2>/dev/null || echo "❌ Backend API not responding"
	@echo ""
	@echo "🗄️ Database (PostgreSQL):"
	@docker exec plant-analytics-postgres pg_isready -U plantuser -d plant_analytics > /dev/null 2>&1 && echo "✅ PostgreSQL OK" || echo "❌ PostgreSQL not responding"
	@echo ""
	@echo "🔴 Redis:"
	@docker exec plant-analytics-redis redis-cli ping > /dev/null 2>&1 && echo "✅ Redis OK" || echo "❌ Redis not responding"
	@echo ""
	@echo "🐰 RabbitMQ:"
	@docker exec plant-analytics-rabbitmq rabbitmq-diagnostics ping > /dev/null 2>&1 && echo "✅ RabbitMQ OK" || echo "❌ RabbitMQ not responding"
	@echo ""
	@echo "📁 MinIO:"
	@curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1 && echo "✅ MinIO OK" || echo "❌ MinIO not responding"
	@echo ""
	@echo "💨 Airflow:"
	@curl -s http://localhost:8080/health > /dev/null 2>&1 && echo "✅ Airflow OK" || echo "❌ Airflow not responding"

# Test API endpoints
test-api:
	@echo "🧪 Testing API endpoints..."
	@echo "Testing states endpoint:"
	@curl -s "http://localhost:8000/api/power-plants/states" > /dev/null && echo "✅ States API: OK" || echo "❌ States API: Failed"

# Full system test
test-system: health test-api

# Run all test suites
test:
	@echo "🧪 Running all tests..."
	./scripts/tests/run-all-tests.sh

# Individual test suites
test-user:
	@echo "🧪 Running user seeding tests..."
	./scripts/tests/test-user-seeding.sh

test-minio:
	@echo "🧪 Running MinIO seeding tests..."
	./scripts/tests/test-minio-seeding.sh

test-integration:
	@echo "🧪 Running integration tests..."
	./scripts/tests/test-integration.sh

test-health:
	@echo "🧪 Running system health tests..."
	./scripts/tests/test-system-health.sh

# Build & Docker
.PHONY: build rebuild restart

# Build all Docker images
build:
	@echo "🔨 Building Docker images..."
	docker compose build

# Rebuild all images (no cache)
rebuild:
	@echo "🔨 Rebuilding all images (no cache)..."
	docker compose build --no-cache

# Quick restart (useful for development)
restart:
	@echo "🔄 Restarting services..."
	docker compose down
	docker compose up -d
	@echo "✅ Services restarted"

# Quick Access
.PHONY: frontend gateway airflow minio

# Open service URLs
frontend:
	@echo "🌐 Opening frontend..."
	@open http://localhost:4000 2>/dev/null || echo "Frontend: http://localhost:4000"

gateway:
	@echo "🚪 Gateway available at http://localhost:8000"

airflow:
	@echo "💨 Opening Airflow..."
	@open http://localhost:8080 2>/dev/null || echo "Airflow: http://localhost:8080 (admin/admin)"

minio:
	@echo "📁 Opening MinIO Console..."
	@open http://localhost:9001 2>/dev/null || echo "MinIO: http://localhost:9001 (egriduser/egridpass123)"

# Help
.PHONY: help

help:
	@echo "🚀 Plant Analytics System - Available Commands:"
	@echo ""
	@echo "🏁 Getting Started:"
	@echo "  make up           - Complete system startup (recommended)"
	@echo "  make start        - Quick start for development"
	@echo "  make dev          - Development mode with live reload"
	@echo ""
	@echo "🧹 Cleanup:"
	@echo "  make clean        - Basic cleanup (containers + volumes)"
	@echo "  make stop         - Just stop containers"
	@echo ""
	@echo "📋 Monitoring:"
	@echo "  make logs         - View all logs"
	@echo "  make status       - Service status"
	@echo "  make health       - Check all service health"
	@echo "  make test         - Run all test suites"
	@echo "  make test-user    - Test user seeding"
	@echo "  make test-minio   - Test MinIO seeding"  
	@echo "  make test-health  - Test system health"
	@echo "  make test-integration - Test end-to-end functionality"
	@echo ""
	@echo "🔗 Quick Access:"
	@echo "  make frontend     - Open frontend (http://localhost:4000)"
	@echo "  make airflow      - Open Airflow (http://localhost:8080)"
	@echo "  make minio        - Open MinIO (http://localhost:9001)"
	@echo ""

# Make help the default target
.DEFAULT_GOAL := help