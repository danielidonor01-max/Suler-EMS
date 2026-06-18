-- PerformanceKPI + KPIMeasurement — continuous metric tracking that
-- complements goals and reviews. A KPI is the metric definition
-- (target + frequency + unit); a measurement is one period's actual
-- value. The (kpiId, periodStart) unique key means you can't double-
-- log the same month.
--
-- ON DELETE CASCADE everywhere so removing an employee or KPI cleans
-- up cleanly. owner / recordedBy use RESTRICT — don't let attribution
-- evaporate.

CREATE TABLE "PerformanceKPI" (
    "id"          TEXT NOT NULL,
    "employeeId"  TEXT NOT NULL,
    "ownerId"     TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "description" TEXT,
    "target"      DOUBLE PRECISION NOT NULL,
    "unit"        TEXT,
    "frequency"   TEXT NOT NULL DEFAULT 'MONTHLY',
    "startDate"   TIMESTAMP(3) NOT NULL,
    "endDate"     TIMESTAMP(3),
    "status"      TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceKPI_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PerformanceKPI_employeeId_status_idx"
    ON "PerformanceKPI"("employeeId", "status");

ALTER TABLE "PerformanceKPI"
    ADD CONSTRAINT "PerformanceKPI_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PerformanceKPI"
    ADD CONSTRAINT "PerformanceKPI_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "KPIMeasurement" (
    "id"           TEXT NOT NULL,
    "kpiId"        TEXT NOT NULL,
    "periodStart"  TIMESTAMP(3) NOT NULL,
    "periodEnd"    TIMESTAMP(3) NOT NULL,
    "actualValue"  DOUBLE PRECISION NOT NULL,
    "notes"        TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KPIMeasurement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "KPIMeasurement_kpiId_periodStart_key"
    ON "KPIMeasurement"("kpiId", "periodStart");
CREATE INDEX "KPIMeasurement_kpiId_idx" ON "KPIMeasurement"("kpiId");

ALTER TABLE "KPIMeasurement"
    ADD CONSTRAINT "KPIMeasurement_kpiId_fkey"
    FOREIGN KEY ("kpiId") REFERENCES "PerformanceKPI"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "KPIMeasurement"
    ADD CONSTRAINT "KPIMeasurement_recordedById_fkey"
    FOREIGN KEY ("recordedById") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
