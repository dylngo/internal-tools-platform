import type { Database } from './client';
import {
  approvalRequests,
  auditLog,
  customers,
  type FLAG_ENVIRONMENTS,
  type FLAG_STATES,
  featureFlags,
  kycApplications,
  type REFUND_STATUSES,
  refunds,
  users,
} from './schema';

// Everything here is synthetic and obviously fake: SSNs in the 000-00-XXXX range,
// emails at @example.test. Never add realistic PII, even fictional.

const SYSTEM_ACTOR = { id: 'system', email: 'seed@example.test' };

export const SEED_USERS: (typeof users.$inferInsert)[] = [
  {
    id: 'usr_ana',
    email: 'ana.analyst@example.test',
    name: 'Ana Analyst',
    roles: ['template_analyst', 'refunds_analyst'],
  },
  {
    id: 'usr_chris',
    email: 'chris.checker@example.test',
    name: 'Chris Checker',
    roles: ['template_approver', 'refunds_approver'],
  },
  { id: 'usr_kim', email: 'kim.kyc@example.test', name: 'Kim Kyc', roles: ['kyc_analyst'] },
  {
    id: 'usr_kai',
    email: 'kai.approver@example.test',
    name: 'Kai Approver',
    roles: ['kyc_approver'],
  },
  {
    id: 'usr_fern',
    email: 'fern.flags@example.test',
    name: 'Fern Flags',
    roles: ['flags_engineer'],
  },
  { id: 'usr_adi', email: 'adi.admin@example.test', name: 'Adi Admin', roles: ['flags_admin'] },
  {
    id: 'usr_audrey',
    email: 'audrey.auditor@example.test',
    name: 'Audrey Auditor',
    roles: ['auditor'],
  },
  { id: 'usr_norm', email: 'norm.norole@example.test', name: 'Norm Norole', roles: [] },
];

function customerId(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
}

export const SEED_CUSTOMERS: (typeof customers.$inferInsert)[] = [
  {
    id: customerId(1),
    fullName: 'Test Customer One',
    email: 'customer1@example.test',
    ssn: '000-00-0001',
    status: 'active',
    riskTier: 'low',
    balanceCents: 125_000,
  },
  {
    id: customerId(2),
    fullName: 'Test Customer Two',
    email: 'customer2@example.test',
    ssn: '000-00-0002',
    status: 'active',
    riskTier: 'medium',
    balanceCents: 8_250,
  },
  {
    id: customerId(3),
    fullName: 'Test Customer Three',
    email: 'customer3@example.test',
    ssn: '000-00-0003',
    status: 'active',
    riskTier: 'high',
    balanceCents: 4_000_000,
  },
  {
    id: customerId(4),
    fullName: 'Test Customer Four',
    email: 'customer4@example.test',
    ssn: '000-00-0004',
    status: 'suspended',
    riskTier: 'high',
    balanceCents: 0,
  },
  {
    id: customerId(5),
    fullName: 'Test Customer Five',
    email: 'customer5@example.test',
    ssn: '000-00-0005',
    status: 'suspended',
    riskTier: 'medium',
    balanceCents: 99_999,
  },
  {
    id: customerId(6),
    fullName: 'Test Customer Six',
    email: 'customer6@example.test',
    ssn: '000-00-0006',
    status: 'closed',
    riskTier: 'low',
    balanceCents: 0,
  },
  {
    id: customerId(7),
    fullName: 'Test Customer Seven',
    email: 'customer7@example.test',
    ssn: '000-00-0007',
    status: 'closed',
    riskTier: 'high',
    balanceCents: 0,
  },
  {
    id: customerId(8),
    fullName: 'Test Customer Eight',
    email: 'customer8@example.test',
    ssn: '000-00-0008',
    status: 'active',
    riskTier: 'low',
    balanceCents: 1_500,
  },
  {
    id: customerId(9),
    fullName: 'Test Customer Nine',
    email: 'customer9@example.test',
    ssn: '000-00-0009',
    status: 'active',
    riskTier: 'low',
    balanceCents: 250_000,
  },
  {
    id: customerId(10),
    fullName: 'Test Customer Ten',
    email: 'customer10@example.test',
    ssn: '000-00-0010',
    status: 'active',
    riskTier: 'medium',
    balanceCents: 61_040,
  },
  {
    id: customerId(11),
    fullName: 'Test Customer Eleven',
    email: 'customer11@example.test',
    ssn: '000-00-0011',
    status: 'active',
    riskTier: 'high',
    balanceCents: 1_200_000,
  },
  {
    id: customerId(12),
    fullName: 'Test Customer Twelve',
    email: 'customer12@example.test',
    ssn: '000-00-0012',
    status: 'active',
    riskTier: 'low',
    balanceCents: 300,
  },
];

const flagId = (n: number): string => `00000000-0000-4000-a000-${String(n).padStart(12, '0')}`;

const SEED_FEATURE_FLAG_VALUES: readonly [
  string,
  string,
  (typeof FLAG_ENVIRONMENTS)[number],
  (typeof FLAG_STATES)[number],
  number,
][] = [
  [
    'checkout-redesign',
    'New checkout experience for the web storefront',
    'development',
    'enabled',
    100,
  ],
  ['search-v2', 'Rebuilt search ranking and filtering pipeline', 'development', 'enabled', 75],
  ['billing-export', 'Download billing records as CSV', 'development', 'disabled', 0],
  ['team-invites', 'Invite teammates from the workspace settings', 'development', 'enabled', 100],
  ['dark-mode', 'Optional dark theme for the admin console', 'development', 'enabled', 50],
  ['bulk-edit', 'Edit multiple records from a single workflow', 'development', 'disabled', 0],
  [
    'new-navigation',
    'Sidebar navigation for the primary application',
    'development',
    'enabled',
    100,
  ],
  ['webhooks-v2', 'Second generation webhook delivery service', 'development', 'disabled', 0],
  ['invoice-reminders', 'Automated reminders for overdue invoices', 'development', 'enabled', 25],
  ['recommendations', 'Personalized recommendations on the home page', 'staging', 'enabled', 50],
  ['mobile-dashboard', 'Dashboard layout optimized for mobile screens', 'staging', 'enabled', 100],
  [
    'fraud-review-queue',
    'Queue for manually reviewing suspicious activity',
    'staging',
    'enabled',
    75,
  ],
  ['self-serve-returns', 'Customer self-service returns workflow', 'staging', 'disabled', 0],
  ['usage-alerts', 'Notify workspace owners about usage thresholds', 'staging', 'enabled', 40],
  ['audit-search', 'Search and filter audit events by actor', 'staging', 'enabled', 100],
  ['workspace-templates', 'Reusable templates for new workspaces', 'staging', 'disabled', 0],
  ['sso-enforcement', 'Require single sign-on for selected workspaces', 'staging', 'enabled', 25],
  ['data-retention-v2', 'Updated retention policy management controls', 'staging', 'disabled', 0],
  ['smart-routing', 'Route incoming requests using workload signals', 'production', 'enabled', 10],
  ['payouts-v2', 'Updated payout scheduling and reconciliation flow', 'production', 'disabled', 0],
  [
    'tax-document-downloads',
    'Download annual tax documents from the portal',
    'production',
    'enabled',
    100,
  ],
  [
    'real-time-collaboration',
    'Live presence and collaborative editing',
    'production',
    'enabled',
    50,
  ],
  ['priority-support', 'Expose priority support contact options', 'production', 'disabled', 0],
  [
    'account-recovery',
    'New account recovery flow with additional checks',
    'production',
    'enabled',
    25,
  ],
  [
    'regional-dashboards',
    'Regional performance dashboards for operators',
    'production',
    'disabled',
    0,
  ],
];

export const SEED_FEATURE_FLAGS: (typeof featureFlags.$inferInsert)[] =
  SEED_FEATURE_FLAG_VALUES.map(
    ([name, description, environment, state, rolloutPercentage], index) => ({
      id: flagId(index + 1),
      name,
      description,
      environment,
      state,
      rolloutPercentage,
    }),
  );

export const SEED_KYC_APPLICATIONS: (typeof kycApplications.$inferInsert)[] = Array.from(
  { length: 40 },
  (_, index) => {
    const number = index + 1;
    const status =
      number <= 20
        ? 'pending'
        : number <= 28
          ? 'approved'
          : number <= 36
            ? 'rejected'
            : 'escalated';
    const riskTier = number % 3 === 0 ? 'high' : number % 2 === 0 ? 'medium' : 'low';
    return {
      id: `00000000-0000-4000-8100-${String(number).padStart(12, '0')}`,
      applicantName: `Synthetic Applicant ${String(number).padStart(2, '0')}`,
      email: `kyc-applicant-${String(number).padStart(2, '0')}@example.test`,
      ssn: `000-00-${String(1000 + number).slice(-4)}`,
      dob: new Date(Date.UTC(1985 + (number % 12), number % 12, 10 + (number % 18))),
      status,
      riskTier,
      submittedAt: new Date(Date.UTC(2026, 7, 1 + number)),
      rejectionReason:
        status === 'rejected'
          ? number % 2 === 0
            ? 'Synthetic identity details need clarification.'
            : 'Synthetic document review requires more evidence.'
          : null,
    };
  },
);

const refundId = (n: number): string => `00000000-0000-4000-8200-${String(n).padStart(12, '0')}`;

export const SEED_REFUNDS: (typeof refunds.$inferInsert)[] = Array.from(
  { length: 40 },
  (_, index) => {
    const number = index + 1;
    const status: (typeof REFUND_STATUSES)[number] =
      number <= 12
        ? 'pending'
        : number <= 20
          ? 'approved'
          : number <= 28
            ? 'rejected'
            : number <= 36
              ? 'paid'
              : 'failed';
    return {
      id: refundId(number),
      customerName: `Synthetic Refund Customer ${String(number).padStart(2, '0')}`,
      customerEmail: `refund-customer-${String(number).padStart(2, '0')}@example.test`,
      orderReference: `TEST-ORDER-${String(number).padStart(4, '0')}`,
      amountCents: 1_000 + number * 275,
      status,
      reason:
        status === 'failed'
          ? 'Synthetic payment processor failure.'
          : number % 2 === 0
            ? 'Synthetic duplicate charge.'
            : 'Synthetic customer-requested return.',
      submittedAt: new Date(Date.UTC(2026, 7, 1 + number)),
    };
  },
);

/** A pending maker-checker request so a reviewer can exercise approval right away. */
const SEED_APPROVAL: typeof approvalRequests.$inferInsert = {
  id: '00000000-0000-4000-9000-000000000001',
  resourceType: 'customer',
  resourceId: customerId(3),
  action: 'suspend',
  makerId: 'usr_ana',
  makerEmail: 'ana.analyst@example.test',
  status: 'pending',
};

const SEED_REFUND_APPROVAL: typeof approvalRequests.$inferInsert = {
  id: '00000000-0000-4000-9000-000000000002',
  resourceType: 'refund',
  resourceId: refundId(1),
  action: 'approve',
  makerId: 'usr_ana',
  makerEmail: 'ana.analyst@example.test',
  status: 'pending',
};

/** Idempotent: rows that already exist are left alone. */
export async function seed(db: Database): Promise<{
  users: number;
  customers: number;
  featureFlags: number;
  kycApplications: number;
  refunds: number;
}> {
  return db.transaction(async (tx) => {
    const insertedUsers = await tx
      .insert(users)
      .values(SEED_USERS)
      .onConflictDoNothing()
      .returning();

    const insertedCustomers = await tx
      .insert(customers)
      .values(SEED_CUSTOMERS)
      .onConflictDoNothing()
      .returning();

    const insertedFeatureFlags = await tx
      .insert(featureFlags)
      .values(SEED_FEATURE_FLAGS)
      .onConflictDoNothing()
      .returning();

    if (insertedFeatureFlags.length > 0) {
      await tx.insert(auditLog).values(
        insertedFeatureFlags.map((row) => ({
          actorId: SYSTEM_ACTOR.id,
          actorEmail: SYSTEM_ACTOR.email,
          action: 'featureFlag.seeded',
          resourceType: 'featureFlag',
          resourceId: row.id,
          before: null,
          after: row,
        })),
      );
    }

    const insertedKycApplications = await tx
      .insert(kycApplications)
      .values(SEED_KYC_APPLICATIONS)
      .onConflictDoNothing()
      .returning();

    const insertedRefunds = await tx
      .insert(refunds)
      .values(SEED_REFUNDS)
      .onConflictDoNothing()
      .returning();

    if (insertedCustomers.length > 0) {
      await tx.insert(auditLog).values(
        insertedCustomers.map((row) => ({
          actorId: SYSTEM_ACTOR.id,
          actorEmail: SYSTEM_ACTOR.email,
          action: 'customer.seeded',
          resourceType: 'customer',
          resourceId: row.id,
          before: null,
          after: row,
        })),
      );
    }

    if (insertedKycApplications.length > 0) {
      await tx.insert(auditLog).values(
        insertedKycApplications.map((row) => ({
          actorId: SYSTEM_ACTOR.id,
          actorEmail: SYSTEM_ACTOR.email,
          action: 'kycApplication.seeded',
          resourceType: 'kycApplication',
          resourceId: row.id,
          before: null,
          after: row,
        })),
      );
    }

    if (insertedRefunds.length > 0) {
      await tx.insert(auditLog).values(
        insertedRefunds.map((row) => ({
          actorId: SYSTEM_ACTOR.id,
          actorEmail: SYSTEM_ACTOR.email,
          action: 'refund.seeded',
          resourceType: 'refund',
          resourceId: row.id,
          before: null,
          after: row,
        })),
      );
    }

    const insertedApprovals = await tx
      .insert(approvalRequests)
      .values(SEED_APPROVAL)
      .onConflictDoNothing()
      .returning();

    if (insertedApprovals.length > 0) {
      await tx.insert(auditLog).values({
        actorId: SEED_APPROVAL.makerId,
        actorEmail: SEED_APPROVAL.makerEmail,
        action: 'customer.suspend.propose',
        resourceType: 'customer',
        resourceId: SEED_APPROVAL.resourceId,
        before: null,
        after: { approvalRequestId: SEED_APPROVAL.id },
      });
    }

    const insertedRefundApprovals = await tx
      .insert(approvalRequests)
      .values(SEED_REFUND_APPROVAL)
      .onConflictDoNothing()
      .returning();

    if (insertedRefundApprovals.length > 0) {
      await tx.insert(auditLog).values({
        actorId: SEED_REFUND_APPROVAL.makerId,
        actorEmail: SEED_REFUND_APPROVAL.makerEmail,
        action: 'refund.approve.propose',
        resourceType: 'refund',
        resourceId: SEED_REFUND_APPROVAL.resourceId,
        before: null,
        after: { approvalRequestId: SEED_REFUND_APPROVAL.id },
      });
    }

    return {
      users: insertedUsers.length,
      customers: insertedCustomers.length,
      featureFlags: insertedFeatureFlags.length,
      kycApplications: insertedKycApplications.length,
      refunds: insertedRefunds.length,
    };
  });
}
