#!/bin/bash

# Database configuration
# DB_NAME="skmei_db"
# DB_USER="skmei_user"
# DB_PASSWORD="skmei_password"

# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=registration
# DB_USER=postgres
# DB_PASSWORD=yosi1234

# # Update .env file with database credentials
# sed -i "s/DB_NAME=.*/DB_NAME=$DB_NAME/" .env
# sed -i "s/DB_USER=.*/DB_USER=$DB_USER/" .env
# sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env

# # Create database and user
# echo "Creating database and user..."
# sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
# sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
# sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# echo "Database setup completed successfully!"
# Update .env file
if [ -f .env ]; then
  # If .env file exists, update the variables if they exist, or append them if they don't
  grep -q '^DB_NAME=' .env && sed -i 's/^DB_NAME=.*/DB_NAME=skmei_db/' .env || echo 'DB_NAME=skmei_db' >> .env
  grep -q '^DB_USER=' .env && sed -i 's/^DB_USER=.*/DB_USER=skmei_user/' .env || echo 'DB_USER=skmei_user' >> .env
  grep -q '^DB_PASSWORD=' .env && sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD=skmei_password/' .env || echo 'DB_PASSWORD=skmei_password' >> .env
else
  # If .env file does not exist, create it with the variables
  echo "DB_NAME=skmei_db" > .env
  echo "DB_USER=skmei_user" >> .env
  echo "DB_PASSWORD=skmei_password" >> .env
fi

echo ".env file updated successfully."

# Ensure PostgreSQL service is running
echo "Attempting to start PostgreSQL service..."
service postgresql start

# Give the service a moment to start up
sleep 5

# Connect to PostgreSQL and execute SQL commands as the postgres Linux user
echo "Connecting to PostgreSQL as user postgres to execute SQL commands..."
postgres psql <<EOF
DROP DATABASE IF EXISTS skmei_db;
DROP USER IF EXISTS skmei_user;
CREATE USER skmei_user WITH PASSWORD 'skmei_password';
CREATE DATABASE skmei_db OWNER skmei_user;
GRANT ALL PRIVILEGES ON DATABASE skmei_db TO skmei_user;
EOF

echo "PostgreSQL user and database created successfully."