export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

export interface AuthProvider {
  /** Resolve the user for the current request, or null when signed out. */
  getCurrentUser(): Promise<User | null>;
  /** Clear the current session. Must be called from a server action or route handler. */
  signOut(): Promise<void>;
}

export class UnauthenticatedError extends Error {
  readonly status = 401;
  constructor(message = 'Sign in required') {
    super(message);
    this.name = 'UnauthenticatedError';
  }
}
