#!/bin/bash

# Test script for overall system health

set -e

echo "🧪 Testing System Health..."

# Test all services are running
test_services_running() {
    echo "Testing if all services are running..."
    
    SERVICES=("plant-analytics-postgres" "plant-analytics-redis" "plant-analytics-rabbitmq" "plant-analytics-minio")
    
    for service in "${SERVICES[@]}"; do
        if docker ps --filter "name=$service" --filter "status=running" | grep -q "$service"; then
            echo "✅ Service $service: RUNNING"
        else
            echo "❌ Service $service: NOT RUNNING"
            return 1
        fi
    done
}

# Test API endpoints
test_api_endpoints() {
    echo "Testing API endpoints..."
    
    # Test API Gateway health
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ API Gateway health: OK"
    else
        echo "❌ API Gateway health: FAILED"
        return 1
    fi
    
    # Test Frontend accessibility
    if curl -s http://localhost:4000 > /dev/null 2>&1; then
        echo "✅ Frontend accessibility: OK"
    else
        echo "❌ Frontend accessibility: FAILED"
        return 1
    fi
    
    # Test Airflow UI
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        echo "✅ Airflow UI: OK"
    else
        echo "❌ Airflow UI: FAILED"
        return 1
    fi
}

# Test database connectivity
test_database_connectivity() {
    echo "Testing database connectivity..."
    
    # Test PostgreSQL
    if docker exec plant-analytics-postgres pg_isready -U plantuser -d plant_analytics > /dev/null 2>&1; then
        echo "✅ PostgreSQL connectivity: OK"
    else
        echo "❌ PostgreSQL connectivity: FAILED"
        return 1
    fi
    
    # Test Redis
    if docker exec plant-analytics-redis redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis connectivity: OK"
    else
        echo "❌ Redis connectivity: FAILED"
        return 1
    fi
}

# Test authentication system
test_authentication() {
    echo "Testing authentication system..."
    
    # Test login endpoint
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@plantanalytics.com","password":"password123"}')
    
    if [ "$RESPONSE" = "200" ]; then
        echo "✅ Authentication endpoint: OK"
    else
        echo "❌ Authentication endpoint: FAILED (HTTP $RESPONSE)"
        return 1
    fi
}

# Run all tests
main() {
    echo "🚀 Starting System Health Tests..."
    echo ""
    
    test_services_running || exit 1
    test_database_connectivity || exit 1
    test_api_endpoints || exit 1
    test_authentication || exit 1
    
    echo ""
    echo "🎉 All system health tests passed!"
}

main "$@"