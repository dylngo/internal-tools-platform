import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const KYC_STATUSES = ['pending', 'approved', 'rejected', 'escalated'] as const;
export const KYC_RISK_TIERS = ['low', 'medium', 'high'] as const;

export const kycApplications = pgTable('kyc_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicantName: text('applicant_name').notNull(),
  email: text('email').notNull(),
  ssn: text('ssn').notNull(),
  dob: timestamp('dob', { withTimezone: true }).notNull(),
  status: text('status', { enum: KYC_STATUSES }).notNull().default('pending'),
  riskTier: text('risk_tier', { enum: KYC_RISK_TIERS }).notNull().default('low'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull(),
  rejectionReason: text('rejection_reason'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type KycApplicationRow = typeof kycApplications.$inferSelect;
