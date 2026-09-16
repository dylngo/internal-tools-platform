import { type AuditLogRow, auditLog, type DbExecutor, db } from '@platform/db';
import { and, desc, eq } from 'drizzle-orm';

export type AuditEntry = AuditLogRow;

/** Newest first. */
export async function listAuditEntries(
  resourceType: string,
  resourceId: string,
  executor: DbExecutor = db,
): Promise<AuditEntry[]> {
  return executor
    .select()
    .from(auditLog)
    .where(and(eq(auditLog.resourceType, resourceType), eq(auditLog.resourceId, resourceId)))
    .orderBy(desc(auditLog.createdAt));
}

export interface FieldChange {
  field: string;
  before: unknown;
  after: unknown;
}

/**
 * Shallow diff of two JSON objects: one entry per top-level key whose value
 * changed. A missing side (create/delete) is treated as an empty object so
 * every field shows up as added or removed. Other non-object inputs produce a
 * single `*` entry.
 */
export function diffJson(before: unknown, after: unknown): FieldChange[] {
  const left = before == null && isRecord(after) ? {} : before;
  const right = after == null && isRecord(before) ? {} : after;
  if (!isRecord(left) || !isRecord(right)) {
    return left === right ? [] : [{ field: '*', before: left, after: right }];
  }
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  const changes: FieldChange[] = [];
  for (const key of keys) {
    const a = left[key];
    const b = right[key];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      changes.push({ field: key, before: a, after: b });
    }
  }
  return changes;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
