-- PeerFeedbackRequest — 360° feedback. Subject is an Employee; the
-- reviewer is a User (since not every reviewer is in the employee
-- registry — e.g. external contractors with user accounts). Status
-- walks PENDING → SUBMITTED or PENDING → DECLINED. The
-- (subjectId, reviewerId, cycleId) unique key prevents accidentally
-- fanning out duplicate asks during a bulk-request flow.
--
-- ON DELETE CASCADE on employee delete (clear out their feedback).
-- ON DELETE SET NULL on cycle delete (preserve the feedback even
-- if the cycle goes away). RESTRICT on requester/reviewer so
-- attribution can't evaporate.

CREATE TABLE "PeerFeedbackRequest" (
    "id"             TEXT NOT NULL,
    "subjectId"      TEXT NOT NULL,
    "reviewerId"     TEXT NOT NULL,
    "requestedById"  TEXT NOT NULL,
    "cycleId"        TEXT,
    "prompt"         TEXT,
    "status"         TEXT NOT NULL DEFAULT 'PENDING',
    "strengths"      TEXT,
    "improvements"   TEXT,
    "comments"       TEXT,
    "rating"         INTEGER,
    "submittedAt"    TIMESTAMP(3),
    "declinedReason" TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeerFeedbackRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PeerFeedbackRequest_subjectId_reviewerId_cycleId_key"
    ON "PeerFeedbackRequest"("subjectId", "reviewerId", "cycleId");
CREATE INDEX "PeerFeedbackRequest_subjectId_status_idx"
    ON "PeerFeedbackRequest"("subjectId", "status");
CREATE INDEX "PeerFeedbackRequest_reviewerId_status_idx"
    ON "PeerFeedbackRequest"("reviewerId", "status");

ALTER TABLE "PeerFeedbackRequest"
    ADD CONSTRAINT "PeerFeedbackRequest_subjectId_fkey"
    FOREIGN KEY ("subjectId") REFERENCES "Employee"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PeerFeedbackRequest"
    ADD CONSTRAINT "PeerFeedbackRequest_reviewerId_fkey"
    FOREIGN KEY ("reviewerId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PeerFeedbackRequest"
    ADD CONSTRAINT "PeerFeedbackRequest_requestedById_fkey"
    FOREIGN KEY ("requestedById") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PeerFeedbackRequest"
    ADD CONSTRAINT "PeerFeedbackRequest_cycleId_fkey"
    FOREIGN KEY ("cycleId") REFERENCES "ReviewCycle"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
