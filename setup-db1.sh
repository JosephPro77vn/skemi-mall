#!/bin/bash

# Database configuration
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD="yosi1234"

# Update .env file with database credentials
sed -i "s/DB_NAME=.*/DB_NAME=$DB_NAME/" .env
sed -i "s/DB_USER=.*/DB_USER=$DB_USER/" .env
sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env

# Create database and user
echo "Creating database and user..."
postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo "Database setup completed successfully!"

