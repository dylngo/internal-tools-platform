import Link from 'next/link';
import {
  type AnyObjectSchema,
  type FormField,
  fieldsFromSchema,
  toFormValues,
} from './form-fields';
import type { ActionResult } from './lib/action-result';
import { buttonClassName } from './primitives/button';
import { ResourceFormClient } from './resource-form-client';

export type FormAction = (
  previous: ActionResult | null,
  formData: FormData,
) => Promise<ActionResult>;

/**
 * Renders a form for a Zod object schema and submits it to a server action.
 * The action is expected to `redirect()` on success and return an
 * `ActionResult` with `fieldErrors` on validation failure.
 */
export function ResourceForm({
  schema,
  action,
  defaultValues,
  exclude = [],
  fields,
  submitLabel = 'Save',
  cancelHref,
}: {
  schema: AnyObjectSchema;
  action: FormAction;
  defaultValues?: Record<string, unknown>;
  /** Schema keys that should not be editable (ids, timestamps). */
  exclude?: string[];
  /** Override the derived fields entirely. */
  fields?: FormField[];
  submitLabel?: string;
  cancelHref?: string;
}) {
  const resolvedFields = fields ?? fieldsFromSchema(schema, exclude);
  return (
    <ResourceFormClient
      fields={resolvedFields}
      action={action}
      defaultValues={toFormValues(defaultValues, resolvedFields)}
      submitLabel={submitLabel}
      cancel={
        cancelHref ? (
          <Link href={cancelHref} className={buttonClassName('ghost')}>
            Cancel
          </Link>
        ) : null
      }
    />
  );
}
