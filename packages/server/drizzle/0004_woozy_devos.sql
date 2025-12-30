ALTER TABLE "session_participants" ADD COLUMN "is_highlighted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;