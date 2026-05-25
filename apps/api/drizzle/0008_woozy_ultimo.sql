DROP INDEX "entries_session_sequence_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "entries_session_sequence_idx" ON "session_entries" USING btree ("session_id","sequence_order");