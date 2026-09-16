import { getCurrentUser } from '@platform/auth';
import type { ReactNode } from 'react';
import type { Permission } from '../roles';
import { can } from './can';

/**
 * Conditional UI. Renders children only when the current user holds the
 * permission. This is a convenience for hiding controls — enforcement happens in
 * the server-side handler via `requirePermission`.
 */
export async function RequirePermission({
  permission,
  fallback = null,
  children,
}: {
  permission: Permission;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const user = await getCurrentUser();
  return can(user, permission) ? children : fallback;
}
