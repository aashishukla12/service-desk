#!/bin/sh
set -e

# Run Prisma schema push to ensure database schema is up-to-date
echo "Running database schema push (Prisma)..."
npx prisma db push --accept-data-loss

# Seed the database with default organization and admin credentials
echo "Seeding the database..."
npx prisma db seed

# Start the Next.js production server
echo "Starting Next.js application server..."
exec npm run start
