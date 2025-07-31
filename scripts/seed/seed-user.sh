#!/bin/bash

set -e

echo "👥 Seeding default users..."

# Database connection settings (reusing existing env pattern)
DB_USER="${POSTGRES_USER:-plantuser}"
DB_NAME="${POSTGRES_DB:-plant_analytics}"

# Wait for database to be ready
until docker exec plant-analytics-postgres pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; do
  sleep 1
done

# Default users (simple hardcoded for seeding)
ADMIN_EMAIL="admin@plantanalytics.com"
ADMIN_PASSWORD='$2a$12$h6qjBsXz2M0PR/rglz2JC.8aMnSU83uPRk7HmLND9Knlxu88bGcMe'  # password123
ADMIN_FIRST_NAME="Admin"
ADMIN_LAST_NAME="User"

USER_EMAIL="user@plantanalytics.com"
USER_PASSWORD='$2a$12$h6qjBsXz2M0PR/rglz2JC.8aMnSU83uPRk7HmLND9Knlxu88bGcMe'  # password123
USER_FIRST_NAME="Regular"
USER_LAST_NAME="User"

# Insert admin user
ADMIN_EXISTS=$(docker exec plant-analytics-postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users WHERE email = '$ADMIN_EMAIL';" | tr -d ' ')

if [ "$ADMIN_EXISTS" = "0" ]; then
    docker exec plant-analytics-postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
        INSERT INTO users (email, password, first_name, last_name, is_active) 
        VALUES ('$ADMIN_EMAIL', '$ADMIN_PASSWORD', '$ADMIN_FIRST_NAME', '$ADMIN_LAST_NAME', true);
    "
    echo "✅ Admin user inserted: $ADMIN_EMAIL"
else
    echo "👑 Admin user already exists: $ADMIN_EMAIL"
fi

# Insert regular user
USER_EXISTS=$(docker exec plant-analytics-postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users WHERE email = '$USER_EMAIL';" | tr -d ' ')

if [ "$USER_EXISTS" = "0" ]; then
    docker exec plant-analytics-postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
        INSERT INTO users (email, password, first_name, last_name, is_active) 
        VALUES ('$USER_EMAIL', '$USER_PASSWORD', '$USER_FIRST_NAME', '$USER_LAST_NAME', true);
    "
    echo "✅ Regular user inserted: $USER_EMAIL"
else
    echo "👤 Regular user already exists: $USER_EMAIL"
fi

echo "🎉 User seeding complete!" 