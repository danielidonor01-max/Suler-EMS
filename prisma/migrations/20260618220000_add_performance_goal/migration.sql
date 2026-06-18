-- PerformanceGoal — first slice of the Performance Management module.
-- Goals only for this batch; reviews + KPIs land in follow-up sessions
-- on the same foundation.
--
-- ON DELETE CASCADE from Employee so removing an employee unwinds
-- their goals atomically. ON DELETE RESTRICT from User (owner) so the
-- audit attribution can't be silently broken — if you need to remove
-- the goal's owner, transfer or close out the goals first.

CREATE TABLE "PerformanceGoal" (
    "id"              TEXT NOT NULL,
    "employeeId"      TEXT NOT NULL,
    "ownerId"         TEXT NOT NULL,
    "title"           TEXT NOT NULL,
    "description"     TEXT,
    "category"        TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "startDate"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate"         TIMESTAMP(3),
    "status"          TEXT NOT NULL DEFAULT 'ACTIVE',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "notes"           TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceGoal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PerformanceGoal_employeeId_status_idx"
    ON "PerformanceGoal"("employeeId", "status");
CREATE INDEX "PerformanceGoal_dueDate_idx"
    ON "PerformanceGoal"("dueDate");

ALTER TABLE "PerformanceGoal"
    ADD CONSTRAINT "PerformanceGoal_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PerformanceGoal"
    ADD CONSTRAINT "PerformanceGoal_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
