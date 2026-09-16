import type { User } from '@platform/auth';
import type { ApprovalRequestRow } from '@platform/db';
import { can, type Permission } from '@platform/rbac';
import { ActionButton } from './action-button';
import type { ActionResult } from './lib/action-result';
import { formatValue } from './lib/format';
import { Badge, statusVariant } from './primitives/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './primitives/card';

/**
 * Maker-checker. Lists approval requests for a resource and lets a *different*
 * user holding the action's permission approve or reject each pending one. The
 * buttons are disabled (with a reason) for the maker and for users without the
 * permission; the server actions enforce the same rules again.
 */
export function ApprovalGate({
  requests,
  currentUser,
  permissionFor,
  approve,
  reject,
  title = 'Approvals',
}: {
  requests: ApprovalRequestRow[];
  currentUser: User | null;
  /** The permission a checker needs for a given request (normally the proposed action's permission). */
  permissionFor: (request: ApprovalRequestRow) => Permission;
  approve: (requestId: string) => Promise<ActionResult>;
  reject: (requestId: string) => Promise<ActionResult>;
  title?: string;
}) {
  if (requests.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Proposed changes must be approved by a different user holding the action&apos;s
          permission.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {requests.map((request) => {
            const checkerPermission = permissionFor(request);
            const hasPermission = can(currentUser, checkerPermission);
            const isMaker = currentUser?.id === request.makerId;
            const disabledReason = !currentUser
              ? 'Sign in to review this request.'
              : isMaker
                ? 'You proposed this change; a different user must approve it.'
                : !hasPermission
                  ? `Requires permission ${checkerPermission}.`
                  : undefined;
            return (
              <li
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{request.action}</span>
                    <Badge variant={statusVariant(request.status)}>{request.status}</Badge>
                    <code className="rounded bg-muted px-1 text-xs">{checkerPermission}</code>
                  </div>
                  <p className="text-muted-foreground">
                    Proposed by {request.makerEmail} · {formatValue(request.createdAt)}
                  </p>
                  {request.status !== 'pending' ? (
                    <p className="text-muted-foreground">
                      {request.status === 'approved' ? 'Approved' : 'Rejected'} by{' '}
                      {request.checkerEmail} · {formatValue(request.decidedAt)}
                    </p>
                  ) : null}
                </div>
                {request.status === 'pending' ? (
                  <div className="flex items-start gap-2">
                    <ActionButton
                      action={approve.bind(null, request.id)}
                      disabled={Boolean(disabledReason)}
                      disabledReason={disabledReason}
                    >
                      Approve
                    </ActionButton>
                    <ActionButton
                      action={reject.bind(null, request.id)}
                      variant="outline"
                      disabled={Boolean(disabledReason)}
                      disabledReason={disabledReason}
                    >
                      Reject
                    </ActionButton>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
