#!/bin/bash

echo "📦 Starting MinIO Seeding Process..."

# Wait for MinIO to be ready
echo "⏳ Waiting for MinIO to be ready..."
sleep 15

# Configuration
BUCKET_NAME="egrid-data"
CSV_FILE="infra/db/sample-data/egridData.csv"
MINIO_CONTAINER="plant-analytics-minio"

# Check if the actual sample CSV exists
if [ ! -f "$CSV_FILE" ]; then
    echo "❌ Sample CSV file not found at: $CSV_FILE"
    exit 1
fi

echo "📄 Found sample CSV file: $CSV_FILE"

# Configure MinIO client in container
echo "🔧 Configuring MinIO client..."
docker exec $MINIO_CONTAINER mc alias set minio http://localhost:9000 ${MINIO_ROOT_USER:-egriduser} ${MINIO_ROOT_PASSWORD:-egridpass123}

# Create bucket if it doesn't exist
echo "🪣 Creating bucket: $BUCKET_NAME"
docker exec $MINIO_CONTAINER mc mb minio/$BUCKET_NAME --ignore-existing

# Copy CSV file to MinIO container and upload
echo "📤 Uploading sample data to MinIO..."
docker cp "$CSV_FILE" $MINIO_CONTAINER:/tmp/egridData.csv
docker exec $MINIO_CONTAINER mc cp /tmp/egridData.csv minio/$BUCKET_NAME/

# Verify upload
echo "🔍 Verifying upload..."
docker exec $MINIO_CONTAINER mc ls minio/$BUCKET_NAME/

# Clean up temp file in container
docker exec $MINIO_CONTAINER rm -f /tmp/egridData.csv

echo "✅ MinIO seeding complete!"
echo "📊 Uploaded $(wc -l < $CSV_FILE) lines of power plant data" 