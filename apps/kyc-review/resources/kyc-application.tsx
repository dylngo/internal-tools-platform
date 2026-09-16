import {
  KYC_RISK_TIERS,
  KYC_STATUSES,
  type KycApplicationRow,
  kycApplications,
  type Transaction,
} from '@platform/db';
import { defineResource } from '@platform/resource';
import { Badge, statusVariant } from '@platform/ui';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const kycApplicationSchema = z.object({
  applicantName: z.string().min(1, 'Required').describe('Applicant name'),
  email: z
    .email('Enter a valid email')
    .endsWith('@example.test', 'Synthetic data only: use an @example.test address'),
  ssn: z
    .string()
    .regex(/^000-00-\d{4}$/, 'Synthetic data only: use the form 000-00-XXXX')
    .describe('SSN'),
  dob: z.date().describe('Date of birth'),
  status: z.enum(KYC_STATUSES),
  riskTier: z.enum(KYC_RISK_TIERS).describe('Risk tier'),
  submittedAt: z.date().describe('Submitted date'),
  rejectionReason: z.string().nullable().optional().describe('Rejection reason'),
});

function updateStatus(status: KycApplicationRow['status']) {
  return async ({
    tx,
    row,
    approvalRequest,
  }: {
    tx: Transaction;
    row: KycApplicationRow;
    approvalRequest?: { reason: string | null };
  }) => {
    const [updated] = await tx
      .update(kycApplications)
      .set({
        status,
        rejectionReason: status === 'rejected' ? (approvalRequest?.reason ?? null) : null,
        updatedAt: new Date(),
      })
      .where(eq(kycApplications.id, row.id))
      .returning();
    if (!updated) throw new Error('KYC application disappeared mid-update');
    return updated;
  };
}

export const kycApplicationResource = defineResource({
  name: 'kycApplication',
  label: 'KYC application',
  pluralLabel: 'KYC applications',
  basePath: '/applications',
  table: kycApplications,
  schema: kycApplicationSchema,
  permissions: { read: 'kyc:read', write: 'kyc:propose' },
  create: false,
  update: false,
  list: {
    columns: [
      'applicantName',
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
      'submittedAt',
    ],
    filters: [
      { key: 'status', options: KYC_STATUSES },
      { key: 'riskTier', label: 'Risk tier', options: KYC_RISK_TIERS },
      { key: 'submittedAt', label: 'Submitted date', kind: 'date' },
    ],
    defaultSort: 'submittedAt',
    pageSize: 20,
  },
  detail: {
    titleField: 'applicantName',
    fields: [
      'applicantName',
      'email',
      'ssn',
      'dob',
      'status',
      'riskTier',
      'submittedAt',
      'rejectionReason',
      'updatedAt',
    ],
    masked: [
      { field: 'ssn', permission: 'kyc:view_pii' },
      { field: 'dob', permission: 'kyc:view_pii' },
    ],
  },
  actions: [
    {
      name: 'approve',
      label: 'Approve',
      permission: 'kyc:approve',
      requiresApproval: true,
      confirm: 'Propose approval? A different KYC approver must sign off.',
      isAvailable: (row) => row.status === 'pending' || row.status === 'escalated',
      handler: updateStatus('approved'),
    },
    {
      name: 'reject',
      label: 'Reject',
      permission: 'kyc:approve',
      requiresApproval: true,
      input: {
        label: 'Rejection reason',
        placeholder: 'Explain why this application is rejected',
        required: true,
      },
      confirm: 'Propose rejection? A different KYC approver must sign off.',
      isAvailable: (row) => row.status === 'pending' || row.status === 'escalated',
      handler: updateStatus('rejected'),
    },
    {
      name: 'escalate',
      label: 'Escalate',
      permission: 'kyc:propose',
      isAvailable: (row) => row.status === 'pending',
      handler: updateStatus('escalated'),
    },
  ],
});
