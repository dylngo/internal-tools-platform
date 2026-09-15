import type { User } from '@platform/auth';
import { isRole, type Permission, ROLES } from '../roles';

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(
    readonly permission: Permission,
    message = `Missing permission: ${permission}`,
  ) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/** Every permission the user holds through their roles. Unknown roles grant nothing. */
export function permissionsOf(user: User): Set<Permission> {
  const granted = new Set<Permission>();
  for (const role of user.roles) {
    if (isRole(role)) {
      for (const permission of ROLES[role]) {
        granted.add(permission);
      }
    }
  }
  return granted;
}

export function can(user: User | null, permission: Permission): boolean {
  return user !== null && permissionsOf(user).has(permission);
}

/**
 * Server-side guard. Call it at the top of every action handler and every
 * server component that loads sensitive data. Throws a 403 ForbiddenError; the
 * resource layer turns that into an HTTP 403 for pages and an error result for
 * server actions.
 */
export function requirePermission(user: User | null, permission: Permission): asserts user is User {
  if (!can(user, permission)) {
    throw new ForbiddenError(permission);
  }
}

export function isForbiddenError(error: unknown): error is ForbiddenError {
  return error instanceof ForbiddenError;
}
