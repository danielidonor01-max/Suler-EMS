-- ReportJob inline payload — same BYTEA approach the EmployeeDocument
-- table uses. Kills the filesystem dependency in the download endpoint
-- (Vercel serverless has no persistent disk) and lets the generation
-- pipeline complete synchronously in a single request.

ALTER TABLE "ReportJob" ADD COLUMN "data" BYTEA;
ALTER TABLE "ReportJob" ADD COLUMN "fileName" TEXT;
