-- ProfileChangeRequest — proper workflow behind the "Request Update"
-- button on the employee profile modal. The earlier stub only emitted
-- a Notification to HR; now the request is a first-class record with
-- approve/reject + auto-apply on approve, and the employee can see
-- their pending requests in the modal.

CREATE TABLE "ProfileChangeRequest" (
    "id"             TEXT NOT NULL,
    "employeeId"     TEXT NOT NULL,
    "requestedById"  TEXT NOT NULL,
    "field"          TEXT NOT NULL,
    "currentValue"   TEXT,
    "proposedValue"  TEXT,
    "reason"         TEXT NOT NULL,
    "status"         TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedById"   TEXT,
    "reviewedAt"     TIMESTAMP(3),
    "reviewComment"  TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileChangeRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProfileChangeRequest_employeeId_status_idx"
    ON "ProfileChangeRequest"("employeeId", "status");
CREATE INDEX "ProfileChangeRequest_status_createdAt_idx"
    ON "ProfileChangeRequest"("status", "createdAt");

ALTER TABLE "ProfileChangeRequest"
    ADD CONSTRAINT "ProfileChangeRequest_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProfileChangeRequest"
    ADD CONSTRAINT "ProfileChangeRequest_requestedById_fkey"
    FOREIGN KEY ("requestedById") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProfileChangeRequest"
    ADD CONSTRAINT "ProfileChangeRequest_reviewedById_fkey"
    FOREIGN KEY ("reviewedById") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
