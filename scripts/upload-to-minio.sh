#!/bin/sh
set -e

echo "🚀 Starting MinIO data upload process..."

# Wait for MinIO to be up by retrying mc alias set
until mc alias set minio http://minio:9000 minioadmin minioadmin; do
  echo "⏳ Waiting for MinIO to be ready..."
  sleep 2
done

echo "✅ MinIO is ready!"

# Create bucket if not exists
mc mb --ignore-existing minio/minio-bucket
echo "📁 Created/verified bucket: minio-bucket"

# Upload the CSV file (using the actual filename)
if [ -f "/data/egridData.csv" ]; then
  echo "📤 Uploading eGRID data to MinIO..."
mc cp /data/egridData.csv minio/minio-bucket/egrid2023_gen23.csv
  echo "✅ Successfully uploaded egridData.csv as egrid2023_gen23.csv"
  
  # List files to verify
  echo "📋 Files in bucket:"
  mc ls minio/minio-bucket/
else
  echo "❌ Error: /data/egridData.csv not found!"
  exit 1
fi

echo "🎉 MinIO upload completed successfully!"