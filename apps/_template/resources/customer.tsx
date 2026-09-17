import {
  CUSTOMER_STATUSES,
  type CustomerRow,
  customers,
  RISK_TIERS,
  type Transaction,
} from '@platform/db';
import { defineResource } from '@platform/resource';
import { Badge, statusVariant } from '@platform/ui';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

/**
 * The one resource the template ships with. Everything the app knows about
 * customers — what a form may edit, who may see what, which actions exist —
 * lives here; the pages under app/customers just render it.
 */

// Only synthetic values are accepted, matching the seed data rules.
export const customerSchema = z.object({
  fullName: z.string().min(1, 'Required').describe('Full name'),
  email: z
    .email('Enter a valid email')
    .endsWith('@example.test', 'Synthetic data only: use an @example.test address'),
  ssn: z
    .string()
    .regex(/^000-00-\d{4}$/, 'Synthetic data only: use the form 000-00-XXXX')
    .describe('SSN'),
  status: z.enum(CUSTOMER_STATUSES),
  riskTier: z.enum(RISK_TIERS).describe('Risk tier'),
  balanceCents: z.number().int().min(0).describe('Balance (cents)'),
});

function setStatus(status: CustomerRow['status']) {
  return async ({ tx, row }: { tx: Transaction; row: CustomerRow }) => {
    const [updated] = await tx
      .update(customers)
      .set({ status, updatedAt: new Date() })
      .where(eq(customers.id, row.id))
      .returning();
    if (!updated) throw new Error('Customer disappeared mid-update');
    return updated;
  };
}

export const customerResource = defineResource({
  name: 'customer',
  basePath: '/customers',
  table: customers,
  schema: customerSchema,
  permissions: { read: 'template:read', write: 'template:write' },
  // Status changes go through the suspend/reactivate/close actions below, not the edit form.
  form: { createOnly: ['status'] },
  updateValues: () => ({ updatedAt: new Date() }),
  list: {
    columns: [
      'fullName',
      'email',
      {
        key: 'status',
        render: (row) => <Badge variant={statusVariant(row.status)}>{row.status}</Badge>,
      },
      {
        key: 'riskTier',
        header: 'Risk',
        render: (row) => <Badge variant={statusVariant(row.riskTier)}>{row.riskTier}</Badge>,
      },
      { key: 'balanceCents', header: 'Balance', render: (row) => formatCents(row.balanceCents) },
      'createdAt',
    ],
    filters: [
      { key: 'fullName', label: 'Name' },
      { key: 'status', options: CUSTOMER_STATUSES },
      { key: 'riskTier', label: 'Risk tier', options: RISK_TIERS },
    ],
    defaultSort: 'createdAt',
  },
  detail: {
    titleField: 'fullName',
    fields: [
      'fullName',
      'email',
      'ssn',
      'status',
      'riskTier',
      'balanceCents',
      'createdAt',
      'updatedAt',
    ],
    masked: [{ field: 'ssn', permission: 'template:view_pii' }],
  },
  actions: [
    {
      name: 'suspend',
      permission: 'template:approve',
      requiresApproval: true,
      isAvailable: (row) => row.status === 'active',
      handler: setStatus('suspended'),
    },
    {
      name: 'reactivate',
      permission: 'template:write',
      isAvailable: (row) => row.status === 'suspended',
      handler: setStatus('active'),
    },
    {
      name: 'close',
      permission: 'template:approve',
      requiresApproval: true,
      confirm: 'Propose closing this customer? A different approver must confirm.',
      isAvailable: (row) => row.status !== 'closed',
      handler: setStatus('closed'),
    },
  ],
});

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
