-- Geo-fenced attendance: a WorkSite is an office / hub / branch with a
-- lat/lng + radius. Each AttendanceRecord captures the device's
-- coordinates and the matched site (if any) at clock-in and clock-out
-- independently, plus a free-text note when the user clocked in
-- out-of-bounds (field staff, customer visits).
--
-- Out-of-bounds clock-ins are not blocked at the DB level — that's a
-- business-logic concern handled by the API. Hard-blocking would
-- break legitimate off-site work; instead the audit trail surfaces
-- it for HR.

CREATE TABLE "WorkSite" (
    "id"           TEXT NOT NULL,
    "name"         TEXT NOT NULL,
    "address"      TEXT,
    "lat"          DOUBLE PRECISION NOT NULL,
    "lng"          DOUBLE PRECISION NOT NULL,
    "radiusMeters" INTEGER NOT NULL DEFAULT 150,
    "isActive"     BOOLEAN NOT NULL DEFAULT true,
    "hubId"        TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkSite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkSite_name_key" ON "WorkSite"("name");
CREATE INDEX "WorkSite_isActive_idx" ON "WorkSite"("isActive");

ALTER TABLE "WorkSite"
    ADD CONSTRAINT "WorkSite_hubId_fkey"
    FOREIGN KEY ("hubId") REFERENCES "Hub"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AttendanceRecord"
    ADD COLUMN "checkInLat"       DOUBLE PRECISION,
    ADD COLUMN "checkInLng"       DOUBLE PRECISION,
    ADD COLUMN "checkInSiteId"    TEXT,
    ADD COLUMN "checkInDistance"  DOUBLE PRECISION,
    ADD COLUMN "checkInNote"      TEXT,
    ADD COLUMN "checkOutLat"      DOUBLE PRECISION,
    ADD COLUMN "checkOutLng"      DOUBLE PRECISION,
    ADD COLUMN "checkOutSiteId"   TEXT,
    ADD COLUMN "checkOutDistance" DOUBLE PRECISION,
    ADD COLUMN "checkOutNote"     TEXT;

CREATE INDEX "AttendanceRecord_checkInSiteId_idx"
    ON "AttendanceRecord"("checkInSiteId");
CREATE INDEX "AttendanceRecord_checkOutSiteId_idx"
    ON "AttendanceRecord"("checkOutSiteId");

ALTER TABLE "AttendanceRecord"
    ADD CONSTRAINT "AttendanceRecord_checkInSiteId_fkey"
    FOREIGN KEY ("checkInSiteId") REFERENCES "WorkSite"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AttendanceRecord"
    ADD CONSTRAINT "AttendanceRecord_checkOutSiteId_fkey"
    FOREIGN KEY ("checkOutSiteId") REFERENCES "WorkSite"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
