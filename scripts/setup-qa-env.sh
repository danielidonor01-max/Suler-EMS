#!/bin/bash

# Suler EMS - QA Environment Isolation
# Provisions an isolated dataset for E2E and Load testing

set -e

ENV_NAME="suler_qa_$(date +%s)"
DB_NAME="suler_ems_qa"

echo "[QA] Initializing isolated environment: ${ENV_NAME}"

# 1. Provision isolated DB (assuming Docker for simulation)
docker exec suler-ems-db psql -U suler -c "CREATE DATABASE ${DB_NAME}_${ENV_NAME};"

# 2. Apply migrations to isolated DB
DATABASE_URL="postgresql://suler:suler_pass@localhost:5432/${DB_NAME}_${ENV_NAME}" npx prisma migrate deploy

# 3. Seed with isolated Test Data (Synthetic employees/roles)
# npx ts-node prisma/seeds/qa-seed.ts --db ${DB_NAME}_${ENV_NAME}

echo "[QA] Environment ready. USE: DATABASE_URL=${DATABASE_URL}"
echo "[QA] Note: This environment will be purged after test completion."
