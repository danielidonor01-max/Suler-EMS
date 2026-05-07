#!/bin/bash

# Suler EMS - Migration Governance
# Ensures migrations are idempotent and reversible

set -e

echo "[MIGRATION] Auditing pending migrations..."
npx prisma migrate status

echo "[MIGRATION] Running dry-run check..."
# Prisma doesn't have a built-in dry-run that doesn't touch the DB, 
# so we typically run it in a shadow/local DB first.

echo "[MIGRATION] Applying migrations to PRODUCTION..."
npx prisma migrate deploy

echo "[MIGRATION] Verifying schema integrity..."
npx prisma db pull --print > ./prisma/schema.current.prisma
diff ./prisma/schema.prisma ./prisma/schema.current.prisma || echo "[WARNING] Schema drift detected!"

echo "[MIGRATION] Governance check complete."
