-- EmployeeDocument — HR-uploaded files attached to an employee profile
-- (resume, certificates, ID cards, contracts, tax docs). File payload is
-- inline BYTEA so deletes / backups are atomic with the row and we don't
-- need a separate storage service. Trade-off: per-file size capped by
-- the API gateway (Vercel ~4 MB).
--
-- Cascade-delete from Employee so removing an employee unwinds their
-- documents in the same transaction. uploadedById SET NULL would be
-- safer for audit trails when a user is removed, but the FK target is
-- never null at insertion, so a SET NULL would silently drop attribution
-- — keeping it required and CASCADE-on-User-delete is consistent with
-- how Notification + authoredAnnouncements already attribute by user.

CREATE TABLE "EmployeeDocument" (
    "id"           TEXT NOT NULL,
    "employeeId"   TEXT NOT NULL,
    "kind"         TEXT NOT NULL,
    "fileName"     TEXT NOT NULL,
    "mimeType"     TEXT NOT NULL,
    "sizeBytes"    INTEGER NOT NULL,
    "data"         BYTEA NOT NULL,
    "description"  TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmployeeDocument_employeeId_idx" ON "EmployeeDocument"("employeeId");

ALTER TABLE "EmployeeDocument"
    ADD CONSTRAINT "EmployeeDocument_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmployeeDocument"
    ADD CONSTRAINT "EmployeeDocument_uploadedById_fkey"
    FOREIGN KEY ("uploadedById") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
