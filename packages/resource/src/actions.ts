import { randomUUID } from 'node:crypto';
import { withAudit } from '@platform/audit';
import { getCurrentUser, type User } from '@platform/auth';
import { type ApprovalRequestRow, approvalRequests, db } from '@platform/db';
import { isForbiddenError, requirePermission } from '@platform/rbac';
import { type ActionResult, fail, ok, parseFormData, type RevealResult } from '@platform/ui';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { AnyResource, ResourceAction, ResourceTable, RowOf } from './define-resource';
import { findRow } from './query';

/**
 * The server actions an app exposes for one resource. Apps re-export these
 * from a `'use server'` file so Next.js can call them from the browser:
 *
 *   'use server';
 *   const actions = createResourceActions(customerResource);
 *   export async function createCustomer(prev, formData) { return actions.create(prev, formData); }
 *   ...
 */
export interface ResourceActions {
  create: (previous: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  update: (id: string, previous: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  /** Runs a named action, or queues it for approval when the action `requiresApproval`. */
  run: (actionName: string, id: string) => Promise<ActionResult>;
  approve: (requestId: string) => Promise<ActionResult>;
  reject: (requestId: string) => Promise<ActionResult>;
  /** Returns a masked field's plaintext after checking the permission and writing an audit row. */
  reveal: (field: string, id: string) => Promise<RevealResult>;
}

export function createResourceActions(resource: AnyResource): ResourceActions {
  const { name, table, basePath, permissions } = resource;
  type Row = RowOf<ResourceTable>;

  function actionNamed(actionName: string): ResourceAction<Row> {
    const action = resource.actions.find((candidate) => candidate.name === actionName);
    if (!action) {
      throw new Error(`Unknown action "${actionName}" on ${name}`);
    }
    return action;
  }

  async function loadRow(id: string): Promise<Row> {
    const row = await findRow(resource, id);
    if (!row) {
      throw new Error(`${resource.label} ${id} not found`);
    }
    return row;
  }

  function refresh(id?: string) {
    revalidatePath(basePath);
    if (id) revalidatePath(`${basePath}/${id}`);
  }

  return {
    create: (_previous, formData) =>
      guarded(async (actor) => {
        requirePermission(actor, permissions.write);
        const parsed = parseFormData(resource.schema, formData);
        if (!parsed.ok) {
          return fail('Please fix the highlighted fields.', parsed.fieldErrors, parsed.values);
        }
        const id = randomUUID();
        await withAudit(
          { actor, action: `${name}.create`, resourceType: name, resourceId: id },
          async (tx) => {
            // The Zod schema is the app's declaration of which columns a form may set.
            const values = { ...parsed.data, id } as typeof table.$inferInsert;
            const [after] = await tx.insert(table).values(values).returning();
            return { after, result: undefined };
          },
        );
        refresh();
        return { redirectTo: `${basePath}/${id}` };
      }),

    update: (id, _previous, formData) =>
      guarded(async (actor) => {
        const before = await loadRow(id);
        requirePermission(actor, resource.writePermission?.(before) ?? permissions.write);
        const parsed = parseFormData(resource.schema, formData);
        if (!parsed.ok) {
          return fail('Please fix the highlighted fields.', parsed.fieldErrors, parsed.values);
        }
        await withAudit(
          { actor, action: `${name}.update`, resourceType: name, resourceId: id },
          async (tx) => {
            const before = await loadRow(id);
            const [after] = await tx
              .update(table)
              .set(parsed.data as Partial<typeof table.$inferInsert>)
              .where(eq(table.id, id))
              .returning();
            return { before, after, result: undefined };
          },
        );
        refresh(id);
        return { redirectTo: `${basePath}/${id}` };
      }),

    run: (actionName, id) =>
      guarded(async (actor) => {
        const action = actionNamed(actionName);
        const row = await loadRow(id);
        const actionPermission = action.permissionFor?.(row) ?? action.permission;
        // Maker-checker: anyone who can write may propose; only `action.permission` may approve.
        requirePermission(
          actor,
          action.requiresApproval
            ? (resource.writePermission?.(row) ?? permissions.write)
            : actionPermission,
        );

        if (action.requiresApproval) {
          const pending = await db
            .select({ id: approvalRequests.id })
            .from(approvalRequests)
            .where(
              and(
                eq(approvalRequests.resourceType, name),
                eq(approvalRequests.resourceId, id),
                eq(approvalRequests.action, action.name),
                eq(approvalRequests.status, 'pending'),
              ),
            )
            .limit(1);
          if (pending.length > 0) {
            return fail(`"${labelOf(action)}" is already awaiting approval.`);
          }
          await withAudit(
            { actor, action: `${name}.${action.name}.propose`, resourceType: name, resourceId: id },
            async (tx) => {
              const [request] = await tx
                .insert(approvalRequests)
                .values({
                  resourceType: name,
                  resourceId: id,
                  action: action.name,
                  makerId: actor.id,
                  makerEmail: actor.email,
                })
                .returning();
              return { after: request, result: undefined };
            },
          );
          refresh(id);
          return ok(`"${labelOf(action)}" proposed. A different user must approve it.`);
        }

        await withAudit(
          { actor, action: `${name}.${action.name}`, resourceType: name, resourceId: id },
          async (tx) => {
            const before = await loadRow(id);
            const after = await action.handler({ tx, row: before, actor });
            return { before, after, result: undefined };
          },
        );
        refresh(id);
        return ok(`${labelOf(action)} done.`);
      }),

    approve: (requestId) =>
      guarded(async (actor) => {
        const request = await loadPendingRequest(requestId);
        const action = actionNamed(request.action);
        const row = await loadRow(request.resourceId);
        requirePermission(actor, action.permissionFor?.(row) ?? action.permission);
        if (request.makerId === actor.id) {
          return fail('You proposed this change; a different user must approve it.');
        }
        await withAudit(
          {
            actor,
            action: `${name}.${action.name}.approve`,
            resourceType: name,
            resourceId: request.resourceId,
          },
          async (tx) => {
            const before = await loadRow(request.resourceId);
            const after = await action.handler({ tx, row: before, actor });
            await tx
              .update(approvalRequests)
              .set({
                status: 'approved',
                checkerId: actor.id,
                checkerEmail: actor.email,
                decidedAt: new Date(),
              })
              .where(eq(approvalRequests.id, request.id));
            return { before, after, result: undefined };
          },
        );
        refresh(request.resourceId);
        return ok(`Approved: ${labelOf(action)} executed.`);
      }),

    reject: (requestId) =>
      guarded(async (actor) => {
        const request = await loadPendingRequest(requestId);
        const action = actionNamed(request.action);
        requirePermission(actor, action.permission);
        if (request.makerId === actor.id) {
          return fail('You proposed this change; a different user must reject it.');
        }
        await withAudit(
          {
            actor,
            action: `${name}.${action.name}.reject`,
            resourceType: name,
            resourceId: request.resourceId,
          },
          async (tx) => {
            const [after] = await tx
              .update(approvalRequests)
              .set({
                status: 'rejected',
                checkerId: actor.id,
                checkerEmail: actor.email,
                decidedAt: new Date(),
              })
              .where(eq(approvalRequests.id, request.id))
              .returning();
            return { before: request, after, result: undefined };
          },
        );
        refresh(request.resourceId);
        return ok(`Rejected: ${labelOf(action)}.`);
      }),

    reveal: async (field, id) => {
      const masked = resource.detail?.masked?.find((entry) => entry.field === field);
      if (!masked) {
        return { ok: false, error: `"${field}" is not a masked field.` };
      }
      const actor = await getCurrentUser();
      try {
        requirePermission(actor, masked.permission);
      } catch (error) {
        if (isForbiddenError(error)) return { ok: false, error: error.message };
        throw error;
      }
      const value = await withAudit(
        { actor, action: `${name}.reveal.${field}`, resourceType: name, resourceId: id },
        async () => {
          const row = (await loadRow(id)) as Record<string, unknown>;
          return { result: String(row[field] ?? '') };
        },
      );
      return { ok: true, value };
    },
  };

  async function loadPendingRequest(requestId: string): Promise<ApprovalRequestRow> {
    const [request] = await db
      .select()
      .from(approvalRequests)
      .where(and(eq(approvalRequests.id, requestId), eq(approvalRequests.resourceType, name)))
      .limit(1);
    if (!request) {
      throw new Error('Approval request not found.');
    }
    if (request.status !== 'pending') {
      throw new Error(`This request was already ${request.status}.`);
    }
    return request;
  }
}

type GuardedResult = ActionResult | { redirectTo: string };

/**
 * Runs an action body with the current user, turning permission failures and
 * expected errors into `ActionResult`s. Redirects happen outside the try so
 * Next's redirect signal is not swallowed.
 */
async function guarded(body: (actor: User) => Promise<GuardedResult>): Promise<ActionResult> {
  const actor = await getCurrentUser();
  if (!actor) {
    return fail('You are signed out.');
  }
  let result: GuardedResult;
  try {
    result = await body(actor);
  } catch (error) {
    if (isForbiddenError(error)) {
      return fail(error.message);
    }
    if (error instanceof Error) {
      return fail(error.message);
    }
    throw error;
  }
  if ('redirectTo' in result) {
    redirect(result.redirectTo);
  }
  return result;
}

function labelOf(action: { name: string; label?: string }): string {
  return action.label ?? action.name;
}
