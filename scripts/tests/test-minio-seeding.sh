#!/bin/bash

# Test script for MinIO seeding functionality

set -e

echo "🧪 Testing MinIO Seeding Script..."

# Test MinIO connection
test_minio_connection() {
    echo "Testing MinIO connection..."
    
    if curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1; then
        echo "✅ MinIO connection: OK"
        return 0
    else
        echo "❌ MinIO connection: FAILED"
        return 1
    fi
}

# Test sample data file exists
test_sample_data_exists() {
    echo "Testing sample data file..."
    
    if [ -f "infra/db/sample-data/egridData.csv" ]; then
        echo "✅ Sample data file exists: OK"
        return 0
    else
        echo "❌ Sample data file missing: FAILED"
        return 1
    fi
}

# Test MinIO bucket creation and upload
test_minio_upload() {
    echo "Testing MinIO upload..."
    
    # Run the seeding script
    if ./scripts/seed/seed-minio.sh > /dev/null 2>&1; then
        echo "✅ MinIO seeding script: OK"
    else
        echo "❌ MinIO seeding script: FAILED"
        return 1
    fi
    
    # Verify bucket exists and has data
    if docker exec plant-analytics-minio mc ls minio/egrid-data/egridData.csv > /dev/null 2>&1; then
        echo "✅ Data uploaded to MinIO: OK"
    else
        echo "❌ Data upload verification: FAILED"
        return 1
    fi
}

# Test bucket accessibility
test_bucket_accessibility() {
    echo "Testing bucket accessibility..."
    
    # Check if we can list bucket contents
    if docker exec plant-analytics-minio mc ls minio/egrid-data > /dev/null 2>&1; then
        echo "✅ Bucket accessibility: OK"
    else
        echo "❌ Bucket accessibility: FAILED"
        return 1
    fi
}

# Run all tests
main() {
    echo "🚀 Starting MinIO Seeding Tests..."
    echo ""
    
    test_minio_connection || exit 1
    test_sample_data_exists || exit 1
    test_minio_upload || exit 1
    test_bucket_accessibility || exit 1
    
    echo ""
    echo "🎉 All MinIO seeding tests passed!"
}

main "$@"