
#!/bin/bash

# --- IMPORTANT PRE-CHECKS ---
# 1. Ensure the PostgreSQL service is running.
#    On Windows: Check `services.msc` and ensure 'PostgreSQL Server <version>' is running.
#    On Linux: `sudo systemctl status postgresql` or `sudo service postgresql status`
# 2. Ensure `psql` is in your system's PATH.

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

echo "Connecting to PostgreSQL as user postgres to execute SQL commands..."

# Correct way to invoke psql and feed it commands
# -h localhost: Explicitly connect to localhost (good practice)
# -p 5432: Explicitly connect to port 5432 (default, but good to be explicit)
# -U postgres: Connect as the 'postgres' superuser
# -w: (Optional, but recommended) Forces psql to prompt for a password if not supplied by other means (like .pgpass)
export PGPASSWORD="yosi1234"
psql -h localhost -p 5432 -U postgres -w <<EOF
    -- Drop database if it exists (for clean re-runs)
    DROP DATABASE IF EXISTS skmei_db;
    -- Drop user if it exists (for clean re-runs)
    DROP USER IF EXISTS skmei_user;

    -- Create the new user (skmei_user) with a password
    CREATE USER skmei_user WITH PASSWORD 'skmei_password';

    -- Create the database and assign skmei_user as its owner
    CREATE DATABASE skmei_db
        OWNER skmei_user
        ENCODING 'UTF8'
        LC_COLLATE 'en_US.UTF-8'
        LC_CTYPE 'en_US.UTF-8'
        TEMPLATE template0; -- Using template0 for a pristine database

    -- Grant all privileges on the new database to the new user
    GRANT ALL PRIVILEGES ON DATABASE skmei_db TO skmei_user;
EOF

# Check the exit status of the psql command
if [ $? -eq 0 ]; then
    echo "PostgreSQL user and database created successfully."
else
    echo "Error: Failed to create PostgreSQL user and database."
    echo "Please check the PostgreSQL server status, user permissions, and connection details."
    exit 1
fi
unset PGPASSWORD


