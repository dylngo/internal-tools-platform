import { auditLog, createDb, refunds, requireDatabaseUrl } from '@platform/db';
import { eq } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';
import { withAudit } from '../../audit/src/with-audit';
import type { User } from '../../auth/src/types';
import { ForbiddenError, requirePermission } from '../../rbac/src/can';

const { db, sql } = createDb(requireDatabaseUrl());
afterAll(() => sql.end());

const analyst: User = {
  id: 'usr_refund_analyst',
  email: 'refund-analyst@example.test',
  name: 'Refund Analyst',
  roles: ['refunds_analyst'],
};

describe('refund operations', () => {
  it('denies an analyst from approving a refund server-side', () => {
    expect(() => requirePermission(analyst, 'refunds:approve')).toThrow(ForbiddenError);
  });

  it('writes an audit row with the refund before/after diff', async () => {
    const [created] = await db
      .insert(refunds)
      .values({
        customerName: 'Synthetic Audit Customer',
        customerEmail: 'refund-audit@example.test',
        orderReference: 'TEST-AUDIT-0001',
        amountCents: 2450,
        status: 'pending',
        reason: 'Synthetic duplicate charge.',
        submittedAt: new Date('2026-08-01T00:00:00.000Z'),
      })
      .returning();
    if (!created) throw new Error('refund insert failed');

    const updated = await withAudit(
      { actor: analyst, action: 'refund.approve', resourceType: 'refund', resourceId: created.id },
      async (tx) => {
        const [after] = await tx
          .update(refunds)
          .set({ status: 'approved', updatedAt: new Date() })
          .where(eq(refunds.id, created.id))
          .returning();
        return { before: created, after, result: after };
      },
      db,
    );

    expect(updated?.status).toBe('approved');
    const [audit] = await db.select().from(auditLog).where(eq(auditLog.resourceId, created.id));
    expect(audit?.action).toBe('refund.approve');
    expect(audit?.before).toMatchObject({ status: 'pending', amountCents: 2450 });
    expect(audit?.after).toMatchObject({ status: 'approved', amountCents: 2450 });
  });
});
