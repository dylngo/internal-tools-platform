import { cache } from 'react';
import { MockAuthProvider } from './mock';
import { OIDCAuthProvider } from './oidc';
import { type AuthProvider, UnauthenticatedError, type User } from './types';

export type AuthProviderName = 'mock' | 'oidc';

export function getAuthProviderName(): AuthProviderName {
  const name = process.env.AUTH_PROVIDER ?? 'mock';
  if (name !== 'mock' && name !== 'oidc') {
    throw new Error(`AUTH_PROVIDER must be "mock" or "oidc", got "${name}"`);
  }
  if (name === 'mock' && process.env.NODE_ENV === 'production' && !process.env.ALLOW_MOCK_AUTH) {
    throw new Error(
      'AUTH_PROVIDER=mock is not allowed in production (set ALLOW_MOCK_AUTH=1 to override)',
    );
  }
  return name;
}

const providers = {
  mock: new MockAuthProvider(),
  oidc: new OIDCAuthProvider(),
};

export function getAuthProvider(): AuthProvider {
  return providers[getAuthProviderName()];
}

/** Exposed for the dev-only user switcher. Throws when the mock provider is not active. */
export function getMockAuthProvider(): MockAuthProvider {
  if (getAuthProviderName() !== 'mock') {
    throw new Error('Mock auth is not active');
  }
  return providers.mock;
}

/**
 * The single source of identity. Memoised per request so layouts, pages, and
 * actions in the same render share one lookup.
 */
export const getCurrentUser = cache((): Promise<User | null> => getAuthProvider().getCurrentUser());

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthenticatedError();
  }
  return user;
}
