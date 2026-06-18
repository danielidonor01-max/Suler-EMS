-- ReviewCycle + PerformanceReview — formal performance review surface
-- on the Goals foundation. HR creates a cycle (Q3 2026 Annual, etc.),
-- assigns reviewers to each employee, the reviewer submits ratings +
-- comments, the employee acknowledges. Lighter than a full 360 — peer
-- feedback + KPIs land in follow-up modules.
--
-- ON DELETE CASCADE from ReviewCycle so closing or removing a cycle
-- unwinds its reviews together. ON DELETE CASCADE from Employee so
-- removing an employee doesn't leave orphan reviews referencing them.
-- Reviewer is SET NULL — reviewer reassignment is common; never lose
-- a review just because the original reviewer was removed.

CREATE TABLE "ReviewCycle" (
    "id"          TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "type"        TEXT NOT NULL DEFAULT 'ANNUAL',
    "startDate"   TIMESTAMP(3) NOT NULL,
    "endDate"     TIMESTAMP(3) NOT NULL,
    "dueDate"     TIMESTAMP(3),
    "status"      TEXT NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewCycle_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReviewCycle_status_idx" ON "ReviewCycle"("status");
CREATE INDEX "ReviewCycle_startDate_endDate_idx" ON "ReviewCycle"("startDate", "endDate");

ALTER TABLE "ReviewCycle"
    ADD CONSTRAINT "ReviewCycle_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "PerformanceReview" (
    "id"                     TEXT NOT NULL,
    "cycleId"                TEXT NOT NULL,
    "employeeId"             TEXT NOT NULL,
    "reviewerId"             TEXT,
    "status"                 TEXT NOT NULL DEFAULT 'PENDING',
    "overallRating"          INTEGER,
    "strengths"              TEXT,
    "areasForGrowth"         TEXT,
    "reviewerComments"       TEXT,
    "submittedAt"            TIMESTAMP(3),
    "employeeComments"       TEXT,
    "employeeAcknowledgedAt" TIMESTAMP(3),
    "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"              TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PerformanceReview_cycleId_employeeId_key"
    ON "PerformanceReview"("cycleId", "employeeId");
CREATE INDEX "PerformanceReview_reviewerId_status_idx"
    ON "PerformanceReview"("reviewerId", "status");
CREATE INDEX "PerformanceReview_employeeId_status_idx"
    ON "PerformanceReview"("employeeId", "status");

ALTER TABLE "PerformanceReview"
    ADD CONSTRAINT "PerformanceReview_cycleId_fkey"
    FOREIGN KEY ("cycleId") REFERENCES "ReviewCycle"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PerformanceReview"
    ADD CONSTRAINT "PerformanceReview_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PerformanceReview"
    ADD CONSTRAINT "PerformanceReview_reviewerId_fkey"
    FOREIGN KEY ("reviewerId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
