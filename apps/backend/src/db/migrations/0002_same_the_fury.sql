CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"service_type" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"owner_app" text NOT NULL,
	"purpose" text NOT NULL,
	"r2_key" text NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"scan_status" text DEFAULT 'pending' NOT NULL,
	"scanned_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" uuid NOT NULL,
	"recipient_app" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"data" jsonb,
	"channel" text DEFAULT 'websocket' NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"acknowledged_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"app" text NOT NULL,
	"platform" text NOT NULL,
	"fcm_token" text,
	"apns_token" text,
	"user_agent" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_intents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"user_app" text NOT NULL,
	"provider" text NOT NULL,
	"provider_ref" text,
	"amount_thb" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'THB' NOT NULL,
	"purpose" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"idempotency_key" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"event_type" text NOT NULL,
	"provider_event_id" text NOT NULL,
	"signature" text NOT NULL,
	"signature_verified" boolean DEFAULT false NOT NULL,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp with time zone,
	"related_intent_id" uuid,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"owner_app" text NOT NULL,
	"label" text NOT NULL,
	"formatted_address" text NOT NULL,
	"province" text,
	"district" text,
	"subdistrict" text,
	"postal_code" text,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"google_place_id" text,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"location_type" text NOT NULL,
	"location_id" uuid,
	"formatted_address" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "distance_cache" (
	"origin_lat" double precision NOT NULL,
	"origin_lng" double precision NOT NULL,
	"dest_lat" double precision NOT NULL,
	"dest_lng" double precision NOT NULL,
	"distance_meters" integer NOT NULL,
	"duration_seconds" integer NOT NULL,
	"mode" text DEFAULT 'driving' NOT NULL,
	"cached_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "distance_cache_origin_lat_origin_lng_dest_lat_dest_lng_mode_pk" PRIMARY KEY("origin_lat","origin_lng","dest_lat","dest_lng","mode")
);
--> statement-breakpoint
CREATE TABLE "email_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_email" text NOT NULL,
	"recipient_user_id" uuid,
	"template_name" text NOT NULL,
	"subject" text NOT NULL,
	"provider" text NOT NULL,
	"provider_message_id" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"clicked_at" timestamp with time zone,
	"bounced_at" timestamp with time zone,
	"bounce_reason" text,
	"complained_at" timestamp with time zone,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "email_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"marketing_opt_in" boolean DEFAULT false NOT NULL,
	"transactional_only" boolean DEFAULT false NOT NULL,
	"unsubscribed_at" timestamp with time zone,
	"unsubscribe_reason" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parts_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sku" text,
	"unit_price_thb" numeric(10, 2) NOT NULL,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"unit" text DEFAULT 'piece' NOT NULL,
	"category" text,
	"image_r2_key" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parts_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"part_id" uuid NOT NULL,
	"buyer_id" uuid NOT NULL,
	"service_id" uuid,
	"quantity" integer NOT NULL,
	"unit_price_thb" numeric(10, 2) NOT NULL,
	"total_thb" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"escrow_ledger_id" uuid,
	"idempotency_key" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_related_intent_id_payment_intents_id_fk" FOREIGN KEY ("related_intent_id") REFERENCES "public"."payment_intents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_locations" ADD CONSTRAINT "service_locations_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_locations" ADD CONSTRAINT "service_locations_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_preferences" ADD CONSTRAINT "email_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_inventory" ADD CONSTRAINT "parts_inventory_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_orders" ADD CONSTRAINT "parts_orders_part_id_parts_inventory_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts_inventory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_orders" ADD CONSTRAINT "parts_orders_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_orders" ADD CONSTRAINT "parts_orders_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_orders" ADD CONSTRAINT "parts_orders_escrow_ledger_id_point_ledger_id_fk" FOREIGN KEY ("escrow_ledger_id") REFERENCES "public"."point_ledger"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_services_owner" ON "services" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_services_status" ON "services" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_files_r2_key" ON "file_uploads" USING btree ("r2_key");--> statement-breakpoint
CREATE INDEX "idx_files_owner" ON "file_uploads" USING btree ("owner_app","owner_id");--> statement-breakpoint
CREATE INDEX "idx_files_purpose" ON "file_uploads" USING btree ("purpose");--> statement-breakpoint
CREATE INDEX "idx_files_pending_scan" ON "file_uploads" USING btree ("created_at") WHERE scan_status = 'pending';--> statement-breakpoint
CREATE INDEX "idx_notifications_recipient" ON "notifications" USING btree ("recipient_app","recipient_id","sent_at");--> statement-breakpoint
CREATE INDEX "idx_notifications_unread" ON "notifications" USING btree ("recipient_id") WHERE read_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_push_sub_user_app_platform_token" ON "push_subscriptions" USING btree ("user_id","app","platform",COALESCE("fcm_token", "apns_token", ''));--> statement-breakpoint
CREATE INDEX "idx_push_sub_user" ON "push_subscriptions" USING btree ("user_id","app");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_pi_idempotency_key" ON "payment_intents" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_pi_user" ON "payment_intents" USING btree ("user_app","user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_pi_status" ON "payment_intents" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_pi_provider_ref" ON "payment_intents" USING btree ("provider","provider_ref");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_wh_provider_event_id" ON "webhook_events" USING btree ("provider_event_id");--> statement-breakpoint
CREATE INDEX "idx_wh_unprocessed" ON "webhook_events" USING btree ("provider","received_at") WHERE processed_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_locations_owner" ON "locations" USING btree ("owner_app","owner_id");--> statement-breakpoint
CREATE INDEX "idx_sl_service" ON "service_locations" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "idx_dc_expires" ON "distance_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_email_log_recipient" ON "email_log" USING btree ("recipient_email","sent_at");--> statement-breakpoint
CREATE INDEX "idx_email_log_template" ON "email_log" USING btree ("template_name","sent_at");--> statement-breakpoint
CREATE INDEX "idx_parts_inventory_owner" ON "parts_inventory" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_parts_orders_idempotency" ON "parts_orders" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_parts_orders_buyer" ON "parts_orders" USING btree ("buyer_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_parts_orders_part" ON "parts_orders" USING btree ("part_id");--> statement-breakpoint
CREATE INDEX "idx_parts_orders_status" ON "parts_orders" USING btree ("status");