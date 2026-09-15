import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Tables owned by apps/_template. When you copy the template to a new app,
// copy this file to schema/<app>.ts, rename the table, and run `pnpm db:generate`.

export const CUSTOMER_STATUSES = ['active', 'suspended', 'closed'] as const;
export const RISK_TIERS = ['low', 'medium', 'high'] as const;

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  /** Synthetic only: always in the 000-00-XXXX range. */
  ssn: text('ssn').notNull(),
  status: text('status', { enum: CUSTOMER_STATUSES }).notNull().default('active'),
  riskTier: text('risk_tier', { enum: RISK_TIERS }).notNull().default('low'),
  balanceCents: integer('balance_cents').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type CustomerRow = typeof customers.$inferSelect;
