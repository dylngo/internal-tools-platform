import { signOut, switchMockUser } from './actions';
import { MockUserSwitcherSelect } from './mock-user-switcher-select';
import { getAuthProviderName, getCurrentUser, getMockAuthProvider } from './provider';

/**
 * Dev-only identity switcher. Renders nothing unless AUTH_PROVIDER=mock, so it
 * can live permanently in an app's layout.
 */
export async function MockUserSwitcher() {
  if (getAuthProviderName() !== 'mock') {
    return null;
  }
  const [users, current] = await Promise.all([getMockAuthProvider().listUsers(), getCurrentUser()]);
  return (
    <MockUserSwitcherSelect
      users={users}
      currentUserId={current?.id ?? null}
      onSwitchUser={switchMockUser}
      onSignOut={signOut}
    />
  );
}
