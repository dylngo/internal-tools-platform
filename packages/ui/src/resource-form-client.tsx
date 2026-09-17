'use client';

import { type ReactNode, useActionState } from 'react';
import type { FormField } from './form-fields';
import type { ActionResult } from './lib/action-result';
import { Button } from './primitives/button';
import { Alert } from './primitives/card';
import { Input, Label, Select } from './primitives/form-controls';

export function ResourceFormClient({
  fields,
  action,
  defaultValues,
  submitLabel,
  cancel,
}: {
  fields: FormField[];
  action: (previous: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  defaultValues: Record<string, string | boolean>;
  submitLabel: string;
  cancel: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const values = state && !state.ok && state.values ? state.values : defaultValues;

  return (
    <form key={JSON.stringify(values)} action={formAction} className="max-w-xl space-y-5">
      {state && !state.ok && !state.fieldErrors ? (
        <Alert variant="destructive">{state.error}</Alert>
      ) : null}

      {fields.map((field) => {
        const id = `field-${field.name}`;
        const errors = fieldErrors[field.name];
        const value = values[field.name];
        return (
          <div key={field.name} className="space-y-2">
            {field.kind === 'checkbox' ? (
              <div className="flex items-center gap-2">
                <input
                  id={id}
                  name={field.name}
                  type="checkbox"
                  defaultChecked={value === true}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor={id}>{field.label}</Label>
              </div>
            ) : (
              <>
                <Label htmlFor={id}>
                  {field.label}
                  {field.required ? <span className="text-destructive"> *</span> : null}
                </Label>
                {field.kind === 'select' ? (
                  <Select
                    id={id}
                    name={field.name}
                    defaultValue={typeof value === 'string' ? value : ''}
                    required={field.required}
                  >
                    <option value="" disabled={field.required}>
                      {field.required ? 'Select…' : '—'}
                    </option>
                    {(field.options ?? []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    id={id}
                    name={field.name}
                    type={
                      field.kind === 'number' ? 'number' : field.kind === 'date' ? 'date' : 'text'
                    }
                    step={field.kind === 'number' ? 'any' : undefined}
                    defaultValue={typeof value === 'string' ? value : ''}
                    aria-invalid={errors ? true : undefined}
                  />
                )}
              </>
            )}
            {errors ? <p className="text-xs text-destructive">{errors.join('. ')}</p> : null}
          </div>
        );
      })}

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : submitLabel}
        </Button>
        {cancel}
      </div>
    </form>
  );
}
