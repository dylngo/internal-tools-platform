import type { User } from '@platform/auth';
import { auditLog, createDb, customers, requireDatabaseUrl } from '@platform/db';
import { eq } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';
import { withAudit } from '../src/with-audit';

const { db, sql } = createDb(requireDatabaseUrl());
afterAll(() => sql.end());

const actor: User = {
  id: 'usr_test_actor',
  email: 'actor@example.test',
  name: 'Test Actor',
  roles: ['template_approver'],
};

const synthetic = {
  fullName: 'Audit Test Customer',
  email: 'audit-test@example.test',
  ssn: '000-00-9999',
};

describe('withAudit', () => {
  it('writes an audit row with actor, action, resource, and before/after in the same transaction', async () => {
    const [created] = await db.insert(customers).values(synthetic).returning();
    if (!created) throw new Error('insert failed');

    const updated = await withAudit(
      { actor, action: 'customer.suspend', resourceType: 'customer', resourceId: created.id },
      async (tx) => {
        const [after] = await tx
          .update(customers)
          .set({ status: 'suspended' })
          .where(eq(customers.id, created.id))
          .returning();
        return { before: created, after, result: after };
      },
      db,
    );
    expect(updated?.status).toBe('suspended');

    const rows = await db.select().from(auditLog).where(eq(auditLog.resourceId, created.id));
    expect(rows).toHaveLength(1);
    const row = rows[0];
    if (!row) throw new Error('no audit row');
    expect(row.actorId).toBe(actor.id);
    expect(row.actorEmail).toBe(actor.email);
    expect(row.action).toBe('customer.suspend');
    expect(row.resourceType).toBe('customer');
    expect(row.before).toMatchObject({ status: 'active', ssn: '000-00-9999' });
    expect(row.after).toMatchObject({ status: 'suspended' });
    expect(row.createdAt).toBeInstanceOf(Date);
  });

  it('rolls back the mutation when the audited function throws, leaving no audit row', async () => {
    const [created] = await db.insert(customers).values(synthetic).returning();
    if (!created) throw new Error('insert failed');

    await expect(
      withAudit(
        { actor, action: 'customer.close', resourceType: 'customer', resourceId: created.id },
        async (tx) => {
          await tx.update(customers).set({ status: 'closed' }).where(eq(customers.id, created.id));
          throw new Error('handler failed after writing');
        },
        db,
      ),
    ).rejects.toThrow('handler failed after writing');

    const [row] = await db.select().from(customers).where(eq(customers.id, created.id));
    expect(row?.status).toBe('active');
    const audits = await db.select().from(auditLog).where(eq(auditLog.resourceId, created.id));
    expect(audits).toHaveLength(0);
  });
});
