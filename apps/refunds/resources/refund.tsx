import { REFUND_STATUSES, type RefundRow, refunds, type Transaction } from '@platform/db';
import { defineResource } from '@platform/resource';
import { Badge, statusVariant } from '@platform/ui';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const refundSchema = z.object({
  customerName: z.string().min(1, 'Required').describe('Customer name'),
  customerEmail: z
    .email('Enter a valid email')
    .endsWith('@example.test', 'Synthetic data only: use an @example.test address'),
  orderReference: z.string().min(1, 'Required').describe('Order reference'),
  amountCents: z.number().int().positive().describe('Refund amount (cents)'),
  status: z.enum(REFUND_STATUSES),
  reason: z.string().min(1, 'Required').describe('Reason'),
  rejectionReason: z.string().nullable().optional().describe('Rejection reason'),
  submittedAt: z.date().describe('Submitted date'),
});

function setStatus(status: RefundRow['status']) {
  return async ({ tx, row }: { tx: Transaction; row: RefundRow }) => {
    const [updated] = await tx
      .update(refunds)
      .set({ status, updatedAt: new Date() })
      .where(eq(refunds.id, row.id))
      .returning();
    if (!updated) throw new Error('Refund disappeared mid-update');
    return updated;
  };
}

function rejectRefund() {
  return async ({
    tx,
    row,
    approvalRequest,
  }: {
    tx: Transaction;
    row: RefundRow;
    approvalRequest?: { reason: string | null };
  }) => {
    const [updated] = await tx
      .update(refunds)
      .set({
        status: 'rejected',
        rejectionReason: approvalRequest?.reason ?? null,
        updatedAt: new Date(),
      })
      .where(eq(refunds.id, row.id))
      .returning();
    if (!updated) throw new Error('Refund disappeared mid-update');
    return updated;
  };
}

export const refundResource = defineResource({
  name: 'refund',
  label: 'Refund',
  pluralLabel: 'Refunds',
  basePath: '/refunds',
  table: refunds,
  schema: refundSchema,
  permissions: { read: 'refunds:read', write: 'refunds:propose' },
  create: false,
  update: false,
  list: {
    columns: [
      'orderReference',
      'customerName',
      {
        key: 'amountCents',
        header: 'Amount',
        render: (row) =>
          (row.amountCents / 100).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
          }),
      },
      {
        key: 'status',
        render: (row) => <Badge variant={statusVariant(row.status)}>{row.status}</Badge>,
      },
      'submittedAt',
    ],
    filters: [
      { key: 'orderReference', label: 'Order' },
      { key: 'status', options: REFUND_STATUSES },
      { key: 'submittedAt', label: 'Submitted date', kind: 'date' },
    ],
    defaultSort: 'submittedAt',
    pageSize: 20,
  },
  detail: {
    titleField: 'orderReference',
    fields: [
      'orderReference',
      'customerName',
      'customerEmail',
      'amountCents',
      'status',
      'reason',
      'rejectionReason',
      'submittedAt',
      'updatedAt',
    ],
    masked: [{ field: 'customerEmail', permission: 'refunds:view_pii' }],
  },
  actions: [
    {
      name: 'approve',
      label: 'Approve',
      permission: 'refunds:approve',
      requiresApproval: true,
      approvalGroup: 'status-transition',
      confirm: 'Propose approval? A different approver must sign off.',
      isAvailable: (row) => row.status === 'pending',
      handler: setStatus('approved'),
    },
    {
      name: 'reject',
      label: 'Reject',
      permission: 'refunds:approve',
      requiresApproval: true,
      approvalGroup: 'status-transition',
      input: {
        label: 'Rejection reason',
        placeholder: 'Explain why this refund is rejected',
        required: true,
      },
      confirm: 'Propose rejection? A different approver must sign off.',
      isAvailable: (row) => row.status === 'pending',
      handler: rejectRefund(),
    },
    {
      name: 'issue',
      label: 'Issue refund',
      permission: 'refunds:approve',
      requiresApproval: true,
      approvalGroup: 'status-transition',
      confirm: 'Propose issuing this refund? This moves money.',
      isAvailable: (row) => row.status === 'approved',
      handler: setStatus('paid'),
    },
  ],
});
