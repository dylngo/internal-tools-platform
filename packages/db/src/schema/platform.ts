import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Identities the platform knows about. With the mock auth provider these are the
 * seeded users a reviewer can switch between; with OIDC they would be upserted
 * from ID-token claims on first sign-in.
 */
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  roles: text('roles').array().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Append-only. Written exclusively by `withAudit()` in @platform/audit, in the
 * same transaction as the mutation it records. A database trigger (see
 * migrations/0001_audit_log_append_only.sql) rejects UPDATE and DELETE.
 */
export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: text('actor_id').notNull(),
  actorEmail: text('actor_email').notNull(),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id').notNull(),
  before: jsonb('before'),
  after: jsonb('after'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

/**
 * Maker-checker queue. A resource action marked `requiresApproval` inserts a row
 * here instead of executing; a different user with the action's permission
 * approves it, at which point the action runs.
 */
export const approvalRequests = pgTable('approval_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id').notNull(),
  action: text('action').notNull(),
  makerId: text('maker_id').notNull(),
  makerEmail: text('maker_email').notNull(),
  reason: text('reason'),
  status: text('status', { enum: APPROVAL_STATUSES }).notNull().default('pending'),
  checkerId: text('checker_id'),
  checkerEmail: text('checker_email'),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type UserRow = typeof users.$inferSelect;
export type AuditLogRow = typeof auditLog.$inferSelect;
export type ApprovalRequestRow = typeof approvalRequests.$inferSelect;
