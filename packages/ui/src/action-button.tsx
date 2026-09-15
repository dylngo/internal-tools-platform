'use client';

import { useActionState } from 'react';
import type { ActionResult } from './lib/action-result';
import { Button, type ButtonSize, type ButtonVariant } from './primitives/button';

/**
 * A button bound to a server action. Renders the action's error (if any) next
 * to the button so the user sees why nothing happened.
 */
export function ActionButton({
  action,
  children,
  variant = 'default',
  size = 'sm',
  confirm,
  disabled,
  disabledReason,
}: {
  action: () => Promise<ActionResult>;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** If set, the browser asks this question before the action runs. */
  confirm?: string;
  disabled?: boolean;
  /** Shown as a tooltip when `disabled`, e.g. "You proposed this change". */
  disabledReason?: string;
}) {
  const [state, run, pending] = useActionState(async () => action(), null as ActionResult | null);

  return (
    <form
      action={run}
      className="inline-flex flex-col items-start gap-1"
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) {
          event.preventDefault();
        }
      }}
    >
      <Button
        type="submit"
        variant={variant}
        size={size}
        disabled={disabled || pending}
        title={disabled ? disabledReason : undefined}
      >
        {pending ? 'Working…' : children}
      </Button>
      {state && !state.ok ? <p className="text-xs text-destructive">{state.error}</p> : null}
      {state?.ok && state.message ? (
        <p className="text-xs text-muted-foreground">{state.message}</p>
      ) : null}
    </form>
  );
}
