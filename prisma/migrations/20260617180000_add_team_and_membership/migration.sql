-- Team + TeamMembership — completes the org-structure trifecta with
-- Hub and Department. A Team optionally lives under a Hub and / or a
-- Department; it always has a Manager (Employee) and zero-or-more
-- members via the TeamMembership join table.
--
-- Why the join table instead of an array column: members carry a
-- per-team role ("Lead", "Contributor") and a joinedAt timestamp that
-- a string[] can't represent. Cascade-delete from Team so removing a
-- team auto-clears its memberships; cascade from Employee so removing
-- an employee likewise unwinds them from every team they were on.

CREATE TABLE "Team" (
    "id"           TEXT NOT NULL,
    "code"         TEXT NOT NULL,
    "name"         TEXT NOT NULL,
    "description"  TEXT,
    "status"       TEXT NOT NULL DEFAULT 'ACTIVE',
    "hubId"        TEXT,
    "departmentId" TEXT,
    "managerId"    TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Team_code_key" ON "Team"("code");

ALTER TABLE "Team"
    ADD CONSTRAINT "Team_hubId_fkey"
    FOREIGN KEY ("hubId") REFERENCES "Hub"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Team"
    ADD CONSTRAINT "Team_departmentId_fkey"
    FOREIGN KEY ("departmentId") REFERENCES "Department"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Team"
    ADD CONSTRAINT "Team_managerId_fkey"
    FOREIGN KEY ("managerId") REFERENCES "Employee"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "TeamMembership" (
    "id"         TEXT NOT NULL,
    "teamId"     TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "role"       TEXT,
    "joinedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TeamMembership_teamId_employeeId_key"
    ON "TeamMembership"("teamId", "employeeId");

ALTER TABLE "TeamMembership"
    ADD CONSTRAINT "TeamMembership_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "Team"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeamMembership"
    ADD CONSTRAINT "TeamMembership_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
