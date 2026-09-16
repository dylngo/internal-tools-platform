import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const FLAG_ENVIRONMENTS = ['development', 'staging', 'production'] as const;
export const FLAG_STATES = ['enabled', 'disabled'] as const;

export const featureFlags = pgTable('feature_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description').notNull(),
  environment: text('environment', { enum: FLAG_ENVIRONMENTS }).notNull(),
  state: text('state', { enum: FLAG_STATES }).notNull().default('disabled'),
  rolloutPercentage: integer('rollout_percentage').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type FeatureFlagRow = typeof featureFlags.$inferSelect;
