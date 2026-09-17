'use client';

import { useTransition } from 'react';
import type { User } from './types';

export function MockUserSwitcherSelect({
  users,
  currentUserId,
  onSwitchUser,
  onSignOut,
}: {
  users: User[];
  currentUserId: string | null;
  onSwitchUser: (userId: string) => Promise<void>;
  onSignOut: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900">
        mock auth
      </span>
      <select
        className="h-8 rounded-md border border-input bg-background px-2 text-sm"
        value={currentUserId ?? ''}
        disabled={pending}
        onChange={(event) => {
          const id = event.target.value;
          startTransition(() => (id ? onSwitchUser(id) : onSignOut()));
        }}
      >
        <option value="">Signed out</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} — {user.roles.length ? user.roles.join(', ') : 'no roles'}
          </option>
        ))}
      </select>
    </label>
  );
}
