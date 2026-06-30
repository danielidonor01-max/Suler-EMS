-- MFA (TOTP) columns on User.
-- mfaEnabled only flips true after the user proves they have the secret
-- (enters a valid TOTP code from their authenticator app). mfaSecret is
-- the base32 token shared with the app. mfaBackupCodes is a JSON array
-- of bcrypt hashes; codes are removed from the array as they are spent.

ALTER TABLE "User"
    ADD COLUMN "mfaEnabled"         BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "mfaSecret"          TEXT,
    ADD COLUMN "mfaSecretConfirmed" TIMESTAMP(3),
    ADD COLUMN "mfaBackupCodes"     JSONB,
    ADD COLUMN "mfaLastUsedAt"      TIMESTAMP(3);
