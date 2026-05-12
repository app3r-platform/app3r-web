CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"point_type" varchar(20) NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "point_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"point_type" varchar(20) NOT NULL,
	"amount" integer NOT NULL,
	"direction" varchar(10) NOT NULL,
	"balance_after" integer NOT NULL,
	"reference" varchar(255),
	"idempotency_key" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "point_rounding_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"original_value" numeric(15, 4) NOT NULL,
	"rounded_value" integer NOT NULL,
	"delta" numeric(15, 4) NOT NULL,
	"direction" varchar(10) NOT NULL,
	"ledger_id" uuid NOT NULL,
	"fee_type" varchar(50),
	"app" varchar(20) NOT NULL,
	"formula" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_ledger" ADD CONSTRAINT "point_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_rounding_log" ADD CONSTRAINT "point_rounding_log_ledger_id_point_ledger_id_fk" FOREIGN KEY ("ledger_id") REFERENCES "public"."point_ledger"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_wallets_user_point_type" ON "wallets" USING btree ("user_id","point_type");--> statement-breakpoint
CREATE INDEX "idx_wallets_user_id" ON "wallets" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_point_ledger_idempotency" ON "point_ledger" USING btree ("idempotency_key","point_type");--> statement-breakpoint
CREATE INDEX "idx_point_ledger_user_id" ON "point_ledger" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_point_ledger_user_point_type" ON "point_ledger" USING btree ("user_id","point_type");--> statement-breakpoint
CREATE INDEX "idx_point_ledger_created_at" ON "point_ledger" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_point_rounding_log_ledger_id" ON "point_rounding_log" USING btree ("ledger_id");--> statement-breakpoint
CREATE INDEX "idx_point_rounding_log_created_at" ON "point_rounding_log" USING btree ("created_at");