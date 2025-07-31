
set -e

# Quick data seeding (simplified)
echo "📦 Seeding sample data..."
if [ -f "infra/db/sample-data/egridData.csv" ]; then
    docker cp infra/db/sample-data/egridData.csv plant-analytics-minio:/tmp/
    docker exec plant-analytics-minio mc alias set minio http://localhost:9000 egriduser egridpass123
    docker exec plant-analytics-minio mc mb minio/egrid-data --ignore-existing
    docker exec plant-analytics-minio mc cp /tmp/egridData.csv minio/egrid-data/
    echo "✅ Sample data uploaded to MinIO"
else
    echo "⚠️  Sample data file not found: infra/db/sample-data/egridData.csv"
fi
