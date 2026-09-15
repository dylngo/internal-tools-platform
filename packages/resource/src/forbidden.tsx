import type { Permission } from '@platform/rbac';
import { Alert } from '@platform/ui';

/** Rendered in place of a page's content when the current user lacks a permission. */
export function Forbidden({ permission }: { permission: Permission }) {
  return (
    <Alert variant="destructive">
      <p className="font-medium">403 — you do not have access to this page.</p>
      <p className="mt-1 text-xs">
        Requires permission <code>{permission}</code>. Switch to a user with that permission or ask
        an administrator.
      </p>
    </Alert>
  );
}
