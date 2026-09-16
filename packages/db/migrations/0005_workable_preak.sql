ALTER TABLE "refunds" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD COLUMN "approval_group" text;--> statement-breakpoint
CREATE UNIQUE INDEX "approval_requests_pending_group_unique" ON "approval_requests" USING btree ("resource_type","resource_id","approval_group") WHERE "approval_requests"."status" = 'pending';