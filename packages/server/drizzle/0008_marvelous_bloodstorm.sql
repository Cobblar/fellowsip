ALTER TABLE "product_ratings" ALTER COLUMN "rating" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "tags" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "product_ratings" ADD COLUMN "value_grade" text;--> statement-breakpoint
ALTER TABLE "tasting_sessions" ADD COLUMN "is_solo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "use_generated_avatar" boolean DEFAULT false NOT NULL;