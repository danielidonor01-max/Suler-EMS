-- Bank fields on Employee for payroll disbursement export. NIBSS-style:
-- bankCode is the 3-digit sort code (canonical identifier), bankName is
-- the display label, bankAccountNumber is the 10-digit NUBAN. All three
-- nullable because we can't backfill them at migration time — HR fills
-- as employees are onboarded / updated.

ALTER TABLE "Employee"
    ADD COLUMN "bankName"          TEXT,
    ADD COLUMN "bankCode"          TEXT,
    ADD COLUMN "bankAccountNumber" TEXT;
