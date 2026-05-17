CREATE TABLE "climb_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"sequence_order" integer NOT NULL,
	"duration_ms" bigint NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_entry_images" (
	"id" uuid PRIMARY KEY NOT NULL,
	"session_id" uuid NOT NULL,
	"entry_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"index" integer NOT NULL,
	"object_key" text NOT NULL,
	"photo_url" text NOT NULL,
	"content_type" varchar(50) NOT NULL,
	"content_length" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "climb_attempts" ADD CONSTRAINT "climb_attempts_entry_id_session_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."session_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_entry_images" ADD CONSTRAINT "session_entry_images_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_entry_images" ADD CONSTRAINT "session_entry_images_entry_id_session_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."session_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "climb_attempts_entry_id_idx" ON "climb_attempts" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "climb_attempts_entry_sequence_idx" ON "climb_attempts" USING btree ("entry_id","sequence_order");--> statement-breakpoint
CREATE INDEX "entry_images_session_id_idx" ON "session_entry_images" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "entry_images_entry_id_idx" ON "session_entry_images" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "entry_images_user_id_idx" ON "session_entry_images" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "entry_images_entry_index_idx" ON "session_entry_images" USING btree ("entry_id","index");--> statement-breakpoint
CREATE INDEX "entries_session_sequence_idx" ON "session_entries" USING btree ("session_id","sequence_order");--> statement-breakpoint
CREATE INDEX "sessions_user_start_time_idx" ON "sessions" USING btree ("user_id","start_time");--> statement-breakpoint
ALTER TABLE "session_entries" DROP COLUMN "attempts";--> statement-breakpoint
ALTER TABLE "session_entries" DROP COLUMN "photo_url";