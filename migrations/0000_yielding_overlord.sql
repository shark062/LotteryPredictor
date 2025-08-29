CREATE TABLE "ai_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"lottery_id" integer,
	"model_data" jsonb NOT NULL,
	"accuracy" numeric(5, 2),
	"training_date" timestamp DEFAULT now(),
	"version" integer DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE "game_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_game_id" integer,
	"contest_id" integer,
	"hits" integer NOT NULL,
	"prize_value" numeric(15, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lotteries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"slug" varchar(50) NOT NULL,
	"max_number" integer NOT NULL,
	"min_numbers" integer NOT NULL,
	"max_numbers" integer NOT NULL,
	"draw_days" text NOT NULL,
	"description" text,
	"game_type" varchar(30) NOT NULL,
	"bet_value" numeric(10, 2) DEFAULT '2.50',
	"special_numbers" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "lotteries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "lottery_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"lottery_id" integer,
	"contest_number" integer NOT NULL,
	"drawn_numbers" text NOT NULL,
	"draw_date" timestamp NOT NULL,
	"next_draw_date" timestamp,
	"estimated_prize" numeric(15, 2),
	"actual_prize" numeric(15, 2),
	"is_accumulated" boolean DEFAULT false,
	"special_number" varchar(20),
	"prize_tiers" jsonb,
	"total_winners" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "lottery_contest_unique" UNIQUE("lottery_id","contest_number")
);
--> statement-breakpoint
CREATE TABLE "number_frequency" (
	"id" serial PRIMARY KEY NOT NULL,
	"lottery_id" integer,
	"number" integer NOT NULL,
	"frequency" integer NOT NULL,
	"last_drawn" timestamp,
	"is_hot" boolean DEFAULT false,
	"is_cold" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "lottery_number_unique" UNIQUE("lottery_id","number")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_games" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"lottery_id" integer,
	"numbers" text NOT NULL,
	"contest_number" integer,
	"is_played" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ai_models" ADD CONSTRAINT "ai_models_lottery_id_lotteries_id_fk" FOREIGN KEY ("lottery_id") REFERENCES "public"."lotteries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_results" ADD CONSTRAINT "game_results_user_game_id_user_games_id_fk" FOREIGN KEY ("user_game_id") REFERENCES "public"."user_games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_results" ADD CONSTRAINT "game_results_contest_id_lottery_results_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."lottery_results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lottery_results" ADD CONSTRAINT "lottery_results_lottery_id_lotteries_id_fk" FOREIGN KEY ("lottery_id") REFERENCES "public"."lotteries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "number_frequency" ADD CONSTRAINT "number_frequency_lottery_id_lotteries_id_fk" FOREIGN KEY ("lottery_id") REFERENCES "public"."lotteries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_games" ADD CONSTRAINT "user_games_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_games" ADD CONSTRAINT "user_games_lottery_id_lotteries_id_fk" FOREIGN KEY ("lottery_id") REFERENCES "public"."lotteries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lottery_contest_idx" ON "lottery_results" USING btree ("lottery_id","contest_number");--> statement-breakpoint
CREATE INDEX "lottery_number_idx" ON "number_frequency" USING btree ("lottery_id","number");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");