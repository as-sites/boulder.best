DROP INDEX "climb_attempts_entry_sequence_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "climb_attempts_entry_sequence_idx" ON "climb_attempts" USING btree ("entry_id","sequence_order");