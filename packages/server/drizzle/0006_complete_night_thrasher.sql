CREATE TABLE "comparison_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"comparative_notes" text,
	"rankings" jsonb,
	"metadata" jsonb,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comparison_summaries_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "product_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"product_index" integer DEFAULT 0 NOT NULL,
	"rating" real NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasting_summaries" DROP CONSTRAINT "tasting_summaries_session_id_unique";--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "product_index" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tasting_sessions" ADD COLUMN "products" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "tasting_summaries" ADD COLUMN "product_index" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "comparison_summaries" ADD CONSTRAINT "comparison_summaries_session_id_tasting_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."tasting_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_ratings" ADD CONSTRAINT "product_ratings_session_id_tasting_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."tasting_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_ratings" ADD CONSTRAINT "product_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_ratings_session_id_idx" ON "product_ratings" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "product_ratings_user_id_idx" ON "product_ratings" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_product_rating_idx" ON "product_ratings" USING btree ("session_id","user_id","product_index");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_session_product_idx" ON "tasting_summaries" USING btree ("session_id","product_index");