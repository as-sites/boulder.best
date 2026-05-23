ALTER TABLE "climb_attempts" ADD COLUMN "completed" boolean;--> statement-breakpoint
UPDATE "climb_attempts" AS ca
SET "completed" = se."completed"
FROM "session_entries" AS se
WHERE ca."entry_id" = se."id"
  AND ca."sequence_order" = 0
  AND se."type" = 'climb';--> statement-breakpoint
ALTER TABLE "session_entries" DROP COLUMN "completed";