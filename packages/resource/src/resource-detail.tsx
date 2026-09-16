import { getCurrentUser } from '@platform/auth';
import { approvalRequests, db } from '@platform/db';
import { can } from '@platform/rbac';
import {
  ActionButton,
  ApprovalGate,
  AuditTrail,
  Badge,
  buttonClassName,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DefinitionList,
  formatValue,
  humanize,
  MaskedField,
  PageHeader,
  statusVariant,
} from '@platform/ui';
import { and, desc, eq, getTableColumns } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import type { ResourceActions } from './actions';
import type { AnyResource } from './define-resource';
import { Forbidden } from './forbidden';
import { findRow } from './query';

/**
 * Generated detail page: fields (masked where configured), permission-gated
 * action buttons, the approval queue for this record, and its audit trail.
 * The checker permission for approvals is each action's own permission.
 */
export async function ResourceDetail({
  resource,
  actions,
  id,
}: {
  resource: AnyResource;
  actions: ResourceActions;
  id: string;
}) {
  const user = await getCurrentUser();
  if (!can(user, resource.permissions.read)) {
    return <Forbidden permission={resource.permissions.read} />;
  }

  const row = (await findRow(resource, id)) as Record<string, unknown> | undefined;
  if (!row) {
    notFound();
  }

  const requests = await db
    .select()
    .from(approvalRequests)
    .where(
      and(eq(approvalRequests.resourceType, resource.name), eq(approvalRequests.resourceId, id)),
    )
    .orderBy(desc(approvalRequests.createdAt))
    .limit(10);

  const fieldNames = resource.detail?.fields ?? Object.keys(getTableColumns(resource.table));
  const masked = resource.detail?.masked ?? [];
  const titleField = resource.detail?.titleField ?? 'id';

  const items = fieldNames.map((field) => {
    const maskedConfig = masked.find((entry) => entry.field === field);
    const value = row[field];
    let rendered: ReactNode;
    if (maskedConfig) {
      rendered = (
        <MaskedField
          value={String(value ?? '')}
          permission={maskedConfig.permission}
          user={user}
          reveal={actions.reveal.bind(null, field, id)}
        />
      );
    } else if (field === 'status' && typeof value === 'string') {
      rendered = <Badge variant={statusVariant(value)}>{value}</Badge>;
    } else {
      rendered = formatValue(value);
    }
    return { label: humanize(field), value: rendered };
  });

  const visibleActions = resource.actions.filter(
    (action) => !action.isAvailable || action.isAvailable(row),
  );
  const pendingActionNames = new Set(
    requests.filter((request) => request.status === 'pending').map((request) => request.action),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={String(row[titleField] ?? id)}
        description={`${resource.label} · ${id}`}
        actions={
          <>
            <Link href={resource.basePath} className={buttonClassName('ghost', 'sm')}>
              Back
            </Link>
            {can(user, resource.writePermission?.(row) ?? resource.permissions.write) &&
            resource.update !== false ? (
              <Link
                href={`${resource.basePath}/${id}/edit`}
                className={buttonClassName('outline', 'sm')}
              >
                Edit
              </Link>
            ) : can(user, resource.permissions.write) && resource.writePermission ? (
              <span
                className={buttonClassName('outline', 'sm', 'pointer-events-none opacity-50')}
                title={`Requires permission ${resource.writePermission(row)}`}
                aria-disabled
              >
                Edit
              </span>
            ) : null}
            {visibleActions.map((action) => {
              const needed = action.requiresApproval
                ? (resource.writePermission?.(row) ?? resource.permissions.write)
                : (action.permissionFor?.(row) ?? action.permission);
              const allowed = can(user, needed);
              const pending = pendingActionNames.has(action.name);
              const label = action.label ?? humanize(action.name);
              return (
                <ActionButton
                  key={action.name}
                  action={actions.run.bind(null, action.name, id)}
                  variant={action.requiresApproval ? 'secondary' : 'default'}
                  confirm={action.confirm}
                  input={action.input}
                  disabled={!allowed || pending}
                  disabledReason={
                    pending ? 'Already awaiting approval.' : `Requires permission ${needed}.`
                  }
                >
                  {action.requiresApproval ? `Propose: ${label}` : label}
                </ActionButton>
              );
            })}
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <DefinitionList items={items} />
        </CardContent>
      </Card>

      <ApprovalGate
        requests={requests}
        currentUser={user}
        permissionFor={(request) =>
          resource.actions.find((action) => action.name === request.action)?.permissionFor?.(row) ??
          resource.actions.find((action) => action.name === request.action)?.permission ??
          resource.permissions.write
        }
        approve={actions.approve}
        reject={actions.reject}
      />

      <AuditTrail
        resourceType={resource.name}
        resourceId={id}
        redactFields={masked
          .filter((entry) => !can(user, entry.permission))
          .map((entry) => entry.field)}
      />
    </div>
  );
}
