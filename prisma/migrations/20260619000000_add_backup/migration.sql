-- Backup — app-level snapshots of the structured data tables.
-- Bytes are a gzipped JSON manifest produced by the backup service.
-- Documents + Notifications + audit-volume tables are intentionally
-- excluded to keep snapshots manageable; if you need full data
-- recovery, Supabase PITR is the right tool.
--
-- ON DELETE RESTRICT from User: backups outlive their creator's
-- account by default. Reassign or delete the backups first if you
-- need to remove the creating user.

CREATE TABLE "Backup" (
    "id"             TEXT NOT NULL,
    "createdById"    TEXT NOT NULL,
    "data"           BYTEA NOT NULL,
    "sizeBytes"      INTEGER NOT NULL,
    "rowCount"       INTEGER NOT NULL,
    "tablesIncluded" JSONB NOT NULL,
    "schemaVersion"  TEXT NOT NULL DEFAULT '1.0',
    "description"    TEXT,
    "status"         TEXT NOT NULL DEFAULT 'COMPLETED',
    "error"          TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Backup_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Backup_createdAt_idx" ON "Backup"("createdAt");

ALTER TABLE "Backup"
    ADD CONSTRAINT "Backup_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
