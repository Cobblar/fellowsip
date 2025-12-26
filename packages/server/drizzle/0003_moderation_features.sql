ALTER TABLE "messages" ADD COLUMN "is_hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "friendships" ADD COLUMN "auto_mod" boolean DEFAULT false NOT NULL;
