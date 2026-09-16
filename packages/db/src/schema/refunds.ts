import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const REFUND_STATUSES = ['pending', 'approved', 'rejected', 'paid', 'failed'] as const;

export const refunds = pgTable('refunds', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  orderReference: text('order_reference').notNull(),
  amountCents: integer('amount_cents').notNull(),
  status: text('status', { enum: REFUND_STATUSES }).notNull().default('pending'),
  reason: text('reason').notNull(),
  rejectionReason: text('rejection_reason'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type RefundRow = typeof refunds.$inferSelect;
