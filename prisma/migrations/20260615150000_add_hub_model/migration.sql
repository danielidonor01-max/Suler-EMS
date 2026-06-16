-- Hub model — physical/regional grouping above the Department layer.
-- A hub holds many departments; a department optionally belongs to a hub.
-- Employee.branch already exists as a string label and stays as-is for now;
-- migrating it to an FK would require a backfill against every employee
-- record and is deferred to a later sweep.

CREATE TABLE "Hub" (
    "id"        TEXT NOT NULL,
    "code"      TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "geography" TEXT NOT NULL,
    "category"  TEXT NOT NULL,
    "status"    TEXT NOT NULL DEFAULT 'ACTIVE',
    "managerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hub_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Hub_code_key" ON "Hub"("code");
CREATE UNIQUE INDEX "Hub_name_key" ON "Hub"("name");

-- Managing employee. ON DELETE SET NULL so deleting an employee doesn't
-- cascade and wipe the hub — leadership reassignment is a soft event.
ALTER TABLE "Hub"
    ADD CONSTRAINT "Hub_managerId_fkey"
    FOREIGN KEY ("managerId") REFERENCES "Employee"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Department gets an optional hubId FK. Existing departments stay
-- unlinked until the seed (or manual UI action) attaches them to a hub.
ALTER TABLE "Department" ADD COLUMN "hubId" TEXT;

ALTER TABLE "Department"
    ADD CONSTRAINT "Department_hubId_fkey"
    FOREIGN KEY ("hubId") REFERENCES "Hub"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
