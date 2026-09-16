/**
 * Roles are bags of permissions, defined here as data. A permission is a
 * `domain:verb` string. Adding a tool means adding its permissions to a role
 * here and granting the role to users (seed data, or the OIDC group mapping).
 */
export const ROLES = {
  kyc_analyst: ['kyc:read', 'kyc:propose'],
  kyc_approver: ['kyc:read', 'kyc:propose', 'kyc:approve', 'kyc:view_pii'],
  flags_engineer: ['flags:read', 'flags:write'],
  flags_admin: ['flags:read', 'flags:write', 'flags:write_prod'],
  auditor: ['audit:read'],
  // apps/_template. Rename `template` to the new app's domain when copying it.
  template_analyst: ['template:read', 'template:write'],
  template_approver: ['template:read', 'template:write', 'template:approve', 'template:view_pii'],
} as const;

export type Role = keyof typeof ROLES;
export type Permission = (typeof ROLES)[Role][number];

export const ALL_PERMISSIONS: readonly Permission[] = Array.from(
  new Set(Object.values(ROLES).flat()),
);

export function isRole(value: string): value is Role {
  return Object.hasOwn(ROLES, value);
}
