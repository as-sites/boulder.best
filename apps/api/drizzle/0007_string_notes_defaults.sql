UPDATE "sessions"
SET "notes" = ''
WHERE "notes" IS NULL;

UPDATE "session_entries"
SET "notes" = ''
WHERE "notes" IS NULL;

UPDATE "climb_attempts"
SET "notes" = ''
WHERE "notes" IS NULL;

ALTER TABLE "sessions"
ALTER COLUMN "notes" SET DEFAULT '',
ALTER COLUMN "notes" SET NOT NULL;

ALTER TABLE "session_entries"
ALTER COLUMN "notes" SET DEFAULT '',
ALTER COLUMN "notes" SET NOT NULL;

ALTER TABLE "climb_attempts"
ALTER COLUMN "notes" SET DEFAULT '',
ALTER COLUMN "notes" SET NOT NULL;
