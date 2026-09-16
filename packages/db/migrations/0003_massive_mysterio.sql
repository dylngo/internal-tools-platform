CREATE TABLE "kyc_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"applicant_name" text NOT NULL,
	"email" text NOT NULL,
	"ssn" text NOT NULL,
	"dob" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"risk_tier" text DEFAULT 'low' NOT NULL,
	"submitted_at" timestamp with time zone NOT NULL,
	"rejection_reason" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "approval_requests" ADD COLUMN "reason" text;