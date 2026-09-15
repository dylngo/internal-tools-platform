import type { User } from '@platform/auth';
import { auditLog, type Database, db, type Transaction } from '@platform/db';

export interface AuditContext {
  actor: User;
  /** Dotted, past-tense-free verb, e.g. `customer.suspend`, `pii.unmask`. */
  action: string;
  resourceType: string;
  resourceId: string;
}

export interface AuditedResult<T> {
  before?: unknown;
  after?: unknown;
  result: T;
}

/**
 * Runs `fn` inside a transaction and writes one audit_log row in that same
 * transaction. If `fn` throws, neither the mutation nor the audit row commits;
 * if the audit insert fails, the mutation rolls back with it.
 *
 * `before`/`after` are stored as JSON; omit both for audited reads such as
 * `pii.unmask`. Pass `database` to run against something other than the shared
 * connection (tests do this).
 */
export async function withAudit<T>(
  ctx: AuditContext,
  fn: (tx: Transaction) => Promise<AuditedResult<T>>,
  database: Database = db,
): Promise<T> {
  return database.transaction(async (tx) => {
    const { before, after, result } = await fn(tx);
    await tx.insert(auditLog).values({
      actorId: ctx.actor.id,
      actorEmail: ctx.actor.email,
      action: ctx.action,
      resourceType: ctx.resourceType,
      resourceId: ctx.resourceId,
      before: before === undefined ? null : toJson(before),
      after: after === undefined ? null : toJson(after),
    });
    return result;
  });
}

// Drizzle rows can contain Date objects; round-trip through JSON so what is
// stored is exactly what a reader will get back.
function toJson(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}
