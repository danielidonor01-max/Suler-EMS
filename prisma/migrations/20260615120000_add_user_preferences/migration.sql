-- Add per-user UI preferences column.
-- Stored as JSONB so the shape can evolve (theme, notification toggles,
-- email digest, etc.) without schema migrations on every key added.
-- Nullable: existing users keep null until they save preferences, at which
-- point the server writes the merged DEFAULTS + their overrides.

ALTER TABLE "User" ADD COLUMN "preferences" JSONB;
