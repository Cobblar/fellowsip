CREATE TABLE "friendships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" text NOT NULL,
	"receiver_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_join_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"requester_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasting_sessions" ADD COLUMN "product_link" text;--> statement-breakpoint
ALTER TABLE "tasting_sessions" ADD COLUMN "product_name" text;--> statement-breakpoint
ALTER TABLE "tasting_summaries" ADD COLUMN "taster_summaries" jsonb;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_join_requests" ADD CONSTRAINT "session_join_requests_session_id_tasting_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."tasting_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_join_requests" ADD CONSTRAINT "session_join_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "friendships_sender_id_idx" ON "friendships" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "friendships_receiver_id_idx" ON "friendships" USING btree ("receiver_id");--> statement-breakpoint
CREATE INDEX "session_join_requests_session_id_idx" ON "session_join_requests" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "session_join_requests_requester_id_idx" ON "session_join_requests" USING btree ("requester_id");