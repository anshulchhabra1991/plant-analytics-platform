#!/bin/bash

# Test script for user seeding functionality

set -e

echo "🧪 Testing User Seeding Script..."

# Test database connection
test_db_connection() {
    echo "Testing database connection..."
    
    if docker exec plant-analytics-postgres pg_isready -U plantuser -d plant_analytics > /dev/null 2>&1; then
        echo "✅ Database connection: OK"
        return 0
    else
        echo "❌ Database connection: FAILED"
        return 1
    fi
}

# Test user insertion
test_user_insertion() {
    echo "Testing user insertion..."
    
    # Run the seeding script
    if ./scripts/seed/seed-user.sh > /dev/null 2>&1; then
        echo "✅ User seeding script: OK"
    else
        echo "❌ User seeding script: FAILED"
        return 1
    fi
    
    # Verify admin user exists
    ADMIN_COUNT=$(docker exec plant-analytics-postgres psql -U plantuser -d plant_analytics -t -c "SELECT COUNT(*) FROM users WHERE email = 'admin@plantanalytics.com';" | tr -d ' ')
    
    if [ "$ADMIN_COUNT" = "1" ]; then
        echo "✅ Admin user created: OK"
    else
        echo "❌ Admin user creation: FAILED (count: $ADMIN_COUNT)"
        return 1
    fi
    
    # Verify regular user exists
    USER_COUNT=$(docker exec plant-analytics-postgres psql -U plantuser -d plant_analytics -t -c "SELECT COUNT(*) FROM users WHERE email = 'user@plantanalytics.com';" | tr -d ' ')
    
    if [ "$USER_COUNT" = "1" ]; then
        echo "✅ Regular user created: OK"
    else
        echo "❌ Regular user creation: FAILED (count: $USER_COUNT)"
        return 1
    fi
}

# Test duplicate prevention
test_duplicate_prevention() {
    echo "Testing duplicate prevention..."
    
    # Run seeding script again
    ./scripts/seed/seed-user.sh > /dev/null 2>&1
    
    # Check counts are still 1
    ADMIN_COUNT=$(docker exec plant-analytics-postgres psql -U plantuser -d plant_analytics -t -c "SELECT COUNT(*) FROM users WHERE email = 'admin@plantanalytics.com';" | tr -d ' ')
    USER_COUNT=$(docker exec plant-analytics-postgres psql -U plantuser -d plant_analytics -t -c "SELECT COUNT(*) FROM users WHERE email = 'user@plantanalytics.com';" | tr -d ' ')
    
    if [ "$ADMIN_COUNT" = "1" ] && [ "$USER_COUNT" = "1" ]; then
        echo "✅ Duplicate prevention: OK"
    else
        echo "❌ Duplicate prevention: FAILED (admin: $ADMIN_COUNT, user: $USER_COUNT)"
        return 1
    fi
}

# Run all tests
main() {
    echo "🚀 Starting User Seeding Tests..."
    echo ""
    
    test_db_connection || exit 1
    test_user_insertion || exit 1
    test_duplicate_prevention || exit 1
    
    echo ""
    echo "🎉 All user seeding tests passed!"
}

main "$@"