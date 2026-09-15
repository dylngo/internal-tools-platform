import type { User } from '@platform/auth';
import { can, type Permission } from '@platform/rbac';
import type { RevealResult } from './lib/action-result';
import { maskValue } from './lib/format';
import { MaskedFieldClient } from './masked-field-client';

/**
 * Shows a sensitive value masked (`•••-••-1234`). Users holding `permission`
 * get a Reveal button that calls `reveal` — a server action that re-checks the
 * permission and writes an audit row before returning the plaintext.
 * The unmasked value is never sent to the browser until then.
 */
export function MaskedField({
  value,
  permission,
  user,
  reveal,
  visible = 4,
}: {
  value: string;
  permission: Permission;
  user: User | null;
  reveal: () => Promise<RevealResult>;
  visible?: number;
}) {
  const masked = maskValue(value, visible);
  if (!can(user, permission)) {
    return (
      <span
        className="inline-flex items-center gap-2 font-mono"
        title={`Requires permission ${permission}`}
      >
        {masked}
        <span className="text-xs text-muted-foreground">(restricted)</span>
      </span>
    );
  }
  return <MaskedFieldClient masked={masked} reveal={reveal} />;
}
