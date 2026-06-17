-- LeaveType — admin-managed catalogue of leave categories.
-- Replaces the hardcoded LEAVE_TYPES array in the admin UI so HR can
-- add new categories (e.g. "Study Leave"), adjust quotas without a
-- deploy, and disable obsolete ones without breaking historical
-- LeaveRequest records (which carry the type as a string snapshot).
--
-- Not FK-linked to LeaveRequest intentionally — leave records use a
-- code string that survives rename/delete of the catalogue entry.

CREATE TABLE "LeaveType" (
    "id"          TEXT NOT NULL,
    "code"        TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "quotaDays"   INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "color"       TEXT,
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveType_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LeaveType_code_key" ON "LeaveType"("code");
CREATE UNIQUE INDEX "LeaveType_name_key" ON "LeaveType"("name");
