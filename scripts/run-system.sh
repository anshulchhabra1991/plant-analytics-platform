#!/bin/bash

echo "🚀 Starting Complete Plant Analytics System..."

# Clean everything first
echo "🧹 Cleaning previous setup..."
./scripts/clean-setup.sh

# Start all services
echo "🐳 Starting Docker services..."
docker compose up -d --build

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to initialize..."
timeout=60
counter=0
until docker compose exec postgres pg_isready -U plantuser > /dev/null 2>&1; do
  sleep 2
  counter=$((counter + 2))
  if [ $counter -ge $timeout ]; then
    echo "❌ PostgreSQL failed to start within $timeout seconds"
    exit 1
  fi
done
echo "✅ PostgreSQL is ready!"

# Initialize database schema (create egrid_data table)
echo "🗄️ Initializing database schema..."
docker compose exec postgres psql -U plantuser -d plant_analytics -f /docker-entrypoint-initdb.d/01_create_egrid_table.sql
echo "✅ Database schema initialized!"

# Wait for MinIO to be ready
echo "⏳ Waiting for MinIO to be ready..."
timeout=60
counter=0
until docker compose exec minio curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; do
  sleep 2
  counter=$((counter + 2))
  if [ $counter -ge $timeout ]; then
    echo "❌ MinIO failed to start within $timeout seconds"
    exit 1
  fi
done
echo "✅ MinIO is ready!"

# Wait for backend API to be ready
echo "⏳ Waiting for Backend API to be ready..."
timeout=60
counter=0
until curl -f http://localhost:3000/health > /dev/null 2>&1; do
  sleep 2
  counter=$((counter + 2))
  if [ $counter -ge $timeout ]; then
    echo "⚠️ Backend API not responding, continuing anyway..."
    break
  fi
done
echo "✅ Backend API is ready!"

# Seed MinIO with sample data
echo "📦 Seeding MinIO with sample data..."
./scripts/seed-minio.sh

# Wait for Airflow to be ready and process data
echo "⏳ Waiting for Airflow to be ready..."
sleep 30
echo "✅ Airflow should be processing the data now!"

# Wait for 5 seconds to ensure containers are ready
echo "⏳ Waiting 5 seconds for containers to start..."
sleep 5

# Trigger the data processing DAG manually
echo "🚀 Triggering data processing DAG..."
docker exec -it plant-analytics-airflow-webserver-1 airflow dags trigger process_csv_data_pipeline

echo "✅ DAG triggered successfully!" 


# Verify system status
echo ""
echo "🔍 System Status Summary:"
echo "===================="
echo "🌐 Frontend:       http://localhost:4000"
echo "📊 Backend API:    http://localhost:3000"
echo "🌐 API Gateway:    http://localhost:8000"  
echo "💨 Airflow:        http://localhost:8080 (admin/admin)"
echo "📁 MinIO Console:  http://localhost:9001 (egriduser/egridpass123)"
echo "🗄️ PostgreSQL:     localhost:5432 (plantuser/plantpassword123)"
echo ""

# Test API endpoints
echo "🧪 Testing API endpoints..."
echo "Testing backend health..."
curl -s "http://localhost:3000/health" > /dev/null && echo "✅ Backend API: OK" || echo "❌ Backend API: Failed"

echo "Testing power plants states..."  
curl -s "http://localhost:3000/power-plants/states" > /dev/null && echo "✅ States API: OK" || echo "❌ States API: Failed"

echo "Testing top power plants..."
curl -s "http://localhost:3000/power-plants/top?limit=5" > /dev/null && echo "✅ Top Plants API: OK" || echo "❌ Top Plants API: Failed"

echo ""
echo "✅ System startup complete!"
echo "🎉 Your Plant Analytics System is ready!"
echo ""
echo "📖 Next Steps:"
echo "   1. 🌐 Open Frontend: http://localhost:4000"
echo "   2. 💨 Check Airflow UI: http://localhost:8080"
echo "   3. 📁 View MinIO data: http://localhost:9001" 
echo "   4. 🧪 Test APIs: http://localhost:3000/power-plants/top" 