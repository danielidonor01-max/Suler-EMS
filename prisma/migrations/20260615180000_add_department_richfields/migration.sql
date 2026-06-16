-- Department richer schema: add reportingLine label, promote managerId
-- to a real FK against Employee.
--
-- Both columns are nullable so existing rows stay valid. The seed
-- backfills nothing — manager + reporting line are user-edited in the
-- /admin/organization UI.

ALTER TABLE "Department" ADD COLUMN "reportingLine" TEXT;

-- managerId was already a column but with no FK constraint. Add the FK
-- now so DepartmentManager joins are enforced at the DB level. ON DELETE
-- SET NULL means deleting an employee unlinks them as a manager without
-- cascade-deleting the department.
ALTER TABLE "Department"
    ADD CONSTRAINT "Department_managerId_fkey"
    FOREIGN KEY ("managerId") REFERENCES "Employee"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
