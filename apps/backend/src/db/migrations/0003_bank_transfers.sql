-- Sub-CMD-2: Manual Bank Transfer Module migration
-- Decision Record C: 360813ec-7277-8143-9011-ca6cd91b621d
-- Run after: 0002_same_the_fury.sql (18 tables)

CREATE TABLE IF NOT EXISTS "bank_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"amount_thb" numeric(12, 2) NOT NULL,
	"slip_r2_key" text,
	"ref_no" text,
	"promptpay_ref" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"bank_name" text,
	"account_number" text,
	"account_name" text,
	"point_ledger_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_transfers" ADD CONSTRAINT "bank_transfers_user_id_users_id_fk"
   FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_transfers" ADD CONSTRAINT "bank_transfers_verified_by_users_id_fk"
   FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bank_transfers_user" ON "bank_transfers" ("user_id", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bank_transfers_status" ON "bank_transfers" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bank_transfers_type" ON "bank_transfers" ("type");
