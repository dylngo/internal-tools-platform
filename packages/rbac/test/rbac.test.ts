import type { User } from '@platform/auth';
import { describe, expect, it } from 'vitest';
import { can, ForbiddenError, requirePermission } from '../src/can';

function user(roles: string[]): User {
  return { id: 'usr_test', email: 'test@example.test', name: 'Test User', roles };
}

describe('can — denial paths', () => {
  it('denies a signed-out user', () => {
    expect(can(null, 'kyc:read')).toBe(false);
  });

  it('denies a user with no roles', () => {
    expect(can(user([]), 'kyc:read')).toBe(false);
  });

  it('denies a permission the role does not grant', () => {
    expect(can(user(['kyc_analyst']), 'kyc:approve')).toBe(false);
    expect(can(user(['kyc_analyst']), 'kyc:view_pii')).toBe(false);
  });

  it('does not leak permissions across domains', () => {
    expect(can(user(['flags_admin']), 'kyc:read')).toBe(false);
    expect(can(user(['auditor']), 'template:read')).toBe(false);
  });

  it('ignores roles that are not defined in ROLES', () => {
    expect(can(user(['superuser', 'admin']), 'kyc:read')).toBe(false);
  });

  it('grants only what the role lists', () => {
    expect(can(user(['kyc_analyst']), 'kyc:propose')).toBe(true);
    expect(can(user(['kyc_analyst', 'auditor']), 'audit:read')).toBe(true);
  });
});

describe('requirePermission — server-side guard', () => {
  it('throws a 403 for a signed-out user', () => {
    expect(() => requirePermission(null, 'kyc:read')).toThrow(ForbiddenError);
  });

  it('throws a 403 naming the missing permission', () => {
    try {
      requirePermission(user(['kyc_analyst']), 'kyc:approve');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenError);
      const forbidden = error as ForbiddenError;
      expect(forbidden.status).toBe(403);
      expect(forbidden.permission).toBe('kyc:approve');
    }
  });

  it('returns normally when the permission is held', () => {
    expect(() => requirePermission(user(['kyc_approver']), 'kyc:approve')).not.toThrow();
  });
});
