-- SystemSetting — key-value store for org-wide policy that the app
-- actually enforces. Replaces the localStorage-only SettingsContext
-- for the policies that affect server behaviour (password complexity,
-- session timeout, etc.).
--
-- The value column is JSONB so each setting can carry whatever shape
-- the policy needs (boolean toggle, number threshold, nested struct).
-- Settings are looked up by key — there's a single SystemSettingService
-- that caches reads and exposes typed getters per policy.

CREATE TABLE "SystemSetting" (
    "id"          TEXT NOT NULL,
    "key"         TEXT NOT NULL,
    "value"       JSONB NOT NULL,
    "category"    TEXT NOT NULL,
    "description" TEXT,
    "updatedById" TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");
CREATE INDEX "SystemSetting_category_idx" ON "SystemSetting"("category");

ALTER TABLE "SystemSetting"
    ADD CONSTRAINT "SystemSetting_updatedById_fkey"
    FOREIGN KEY ("updatedById") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
