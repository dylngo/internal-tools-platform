'use client';

import { useActionState } from 'react';
import type { ActionResult } from './lib/action-result';
import { Button, type ButtonSize, type ButtonVariant } from './primitives/button';
import { Input, Label } from './primitives/form-controls';

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
  input,
}: {
  action: (input?: string) => Promise<ActionResult>;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** If set, the browser asks this question before the action runs. */
  confirm?: string;
  disabled?: boolean;
  /** Shown as a tooltip when `disabled`, e.g. "You proposed this change". */
  disabledReason?: string;
  input?: {
    label: string;
    placeholder?: string;
    required?: boolean;
  };
}) {
  const [state, run, pending] = useActionState(
    async (_previous: ActionResult | null, formData: FormData) => {
      const value = formData.get('action-input');
      return action(typeof value === 'string' ? value : undefined);
    },
    null as ActionResult | null,
  );

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
      {input ? (
        <div className="w-64 space-y-1">
          <Label htmlFor="action-input" className="text-xs">
            {input.label}
          </Label>
          <Input
            id="action-input"
            name="action-input"
            placeholder={input.placeholder}
            required={input.required}
          />
        </div>
      ) : null}
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
