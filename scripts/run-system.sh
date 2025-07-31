#!/bin/bash

# clean 
echo "🧹 Cleaning previous setup..."
make clean

# Start all services
echo "🚀 Starting Plant Analytics Platform..."
docker compose build --no-cache
docker compose up -d

# Use our existing health check
echo "⏳ Waiting for services to be ready..."
until make health > /dev/null 2>&1; do
    echo "⏳ Services still starting..."
    sleep 5
done
echo "✅ All services are healthy!"

# Seed users
echo "👥 Seeding users..."
./scripts/seed/seed-user.sh

# Quick data seeding (simplified)
if [ -f ./scripts/seed/seed-minio.sh ]; then
    echo "📦 Running MinIO seed script..."
    ./scripts/seed/seed-minio.sh
else
    echo "⚠️  MinIO seed script not found, skipping."
fi

echo ""
echo "🎉 System ready!"
echo "🌐 Frontend:        http://localhost:4000 (admin@plantanalytics.com/password123)"
echo "🚪 API Gateway:     http://localhost:8000"  
echo "💨 Airflow:         http://localhost:8080 (admin/admin)"
echo "📁 MinIO Console:   http://localhost:9001 (egriduser/egridpass123)"
echo "📊 Sample Data Available"
echo ""
echo "💡 Next steps:"
echo "   1. Visit http://localhost:4000 to access the dashboard"
echo "   2. Check http://localhost:8080 for data processing status"
echo "" 
