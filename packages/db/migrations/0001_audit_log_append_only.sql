-- audit_log is append-only. Belt and braces: the application never issues
-- UPDATE or DELETE against it, and the database refuses them too.
CREATE OR REPLACE FUNCTION audit_log_reject_change() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only (% not allowed)', TG_OP;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER audit_log_append_only
  BEFORE UPDATE OR DELETE ON "audit_log"
  FOR EACH ROW EXECUTE FUNCTION audit_log_reject_change();
--> statement-breakpoint
CREATE INDEX "audit_log_resource_idx" ON "audit_log" ("resource_type", "resource_id", "created_at");
--> statement-breakpoint
CREATE INDEX "approval_requests_resource_idx" ON "approval_requests" ("resource_type", "resource_id", "status");
