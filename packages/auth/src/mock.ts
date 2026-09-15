import { db, users } from '@platform/db';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import type { AuthProvider, User } from './types';

export const MOCK_USER_COOKIE = 'platform_mock_user';

/**
 * Development-only identity. The current user is whichever seeded user id is in
 * the `platform_mock_user` cookie; `<MockUserSwitcher />` sets it. Active when
 * AUTH_PROVIDER=mock.
 */
export class MockAuthProvider implements AuthProvider {
  async getCurrentUser(): Promise<User | null> {
    const userId = (await cookies()).get(MOCK_USER_COOKIE)?.value;
    if (!userId) {
      return null;
    }
    return findUser(userId);
  }

  async signOut(): Promise<void> {
    (await cookies()).delete(MOCK_USER_COOKIE);
  }

  /** Only the mock provider can switch identity; OIDC identity comes from the IdP. */
  async switchUser(userId: string): Promise<void> {
    const user = await findUser(userId);
    if (!user) {
      throw new Error(`Unknown user: ${userId}`);
    }
    (await cookies()).set(MOCK_USER_COOKIE, user.id, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
  }

  async listUsers(): Promise<User[]> {
    const rows = await db.select().from(users).orderBy(users.name);
    return rows.map(toUser);
  }
}

async function findUser(id: string): Promise<User | null> {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ? toUser(row) : null;
}

function toUser(row: typeof users.$inferSelect): User {
  return { id: row.id, email: row.email, name: row.name, roles: row.roles };
}
