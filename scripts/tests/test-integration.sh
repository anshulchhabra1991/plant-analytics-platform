#!/bin/bash

# Integration test script - tests end-to-end functionality

set -e

echo "🧪 Running Integration Tests..."

# Test complete user flow
test_user_flow() {
    echo "Testing complete user authentication flow..."
    
    # Login and get token
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@plantanalytics.com","password":"password123"}')
    
    # Extract access token
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$ACCESS_TOKEN" ]; then
        echo "✅ User login and token generation: OK"
    else
        echo "❌ User login failed or no token received"
        return 1
    fi
    
    # Test authenticated API call
    API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        http://localhost:8000/api/power-plants/states)
    
    if [ "$API_RESPONSE" = "200" ]; then
        echo "✅ Authenticated API access: OK"
    else
        echo "❌ Authenticated API access: FAILED (HTTP $API_RESPONSE)"
        return 1
    fi
}

# Test data pipeline
test_data_pipeline() {
    echo "Testing data pipeline..."
    
    # Check if MinIO has data
    if docker exec plant-analytics-minio mc ls minio/egrid-data/egridData.csv > /dev/null 2>&1; then
        echo "✅ Data available in MinIO: OK"
    else
        echo "❌ No data found in MinIO: FAILED"
        return 1
    fi
    
    # Check if database has egrid data
    RECORD_COUNT=$(docker exec plant-analytics-postgres psql -U plantuser -d plant_analytics -t -c "SELECT COUNT(*) FROM egrid_data;" | tr -d ' ' 2>/dev/null || echo "0")
    
    if [ "$RECORD_COUNT" -gt "0" ]; then
        echo "✅ Database has egrid data: OK ($RECORD_COUNT records)"
    else
        echo "⚠️  Database has no egrid data (this is normal for initial setup)"
    fi
}

# Test system resilience
test_system_resilience() {
    echo "Testing system resilience..."
    
    # Test invalid login
    INVALID_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"invalid@email.com","password":"wrongpassword"}')
    
    if [ "$INVALID_RESPONSE" = "401" ] || [ "$INVALID_RESPONSE" = "400" ]; then
        echo "✅ Invalid login rejection: OK"
    else
        echo "❌ Invalid login handling: FAILED (HTTP $INVALID_RESPONSE)"
        return 1
    fi
    
    # Test unauthorized API access
    UNAUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        http://localhost:8000/api/power-plants/states)
    
    if [ "$UNAUTH_RESPONSE" = "401" ]; then
        echo "✅ Unauthorized access protection: OK"
    else
        echo "❌ Authorization protection: FAILED (HTTP $UNAUTH_RESPONSE)"
        return 1
    fi
}

# Test monitoring endpoints
test_monitoring() {
    echo "Testing monitoring endpoints..."
    
    # Test health check endpoint
    HEALTH_RESPONSE=$(curl -s http://localhost:8000/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "failed")
    
    if [ "$HEALTH_RESPONSE" = "healthy" ] || [ "$HEALTH_RESPONSE" = "ok" ]; then
        echo "✅ Health monitoring: OK"
    else
        echo "❌ Health monitoring: FAILED"
        return 1
    fi
}

# Run all integration tests
main() {
    echo "🚀 Starting Integration Tests..."
    echo ""
    
    test_user_flow || exit 1
    test_data_pipeline || exit 1
    test_system_resilience || exit 1
    test_monitoring || exit 1
    
    echo ""
    echo "🎉 All integration tests passed!"
}

main "$@"