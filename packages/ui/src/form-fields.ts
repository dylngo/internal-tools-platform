import { z } from 'zod';
import { humanize } from './lib/format';

export type FieldKind = 'text' | 'number' | 'checkbox' | 'select' | 'date';

export interface FormField {
  name: string;
  label: string;
  kind: FieldKind;
  required: boolean;
  options?: string[];
}

export type FormValues = Record<string, unknown>;

// biome-ignore lint/suspicious/noExplicitAny: Zod object schemas are generic over their shape; we only need the shape keys.
export type AnyObjectSchema = z.ZodObject<any>;

function unwrap(schema: z.ZodType): { inner: z.ZodType; required: boolean; description?: string } {
  let inner = schema;
  let required = true;
  const description = schema.description;
  while (
    inner instanceof z.ZodOptional ||
    inner instanceof z.ZodNullable ||
    inner instanceof z.ZodDefault
  ) {
    required = false;
    inner = inner.unwrap() as z.ZodType;
  }
  return { inner, required, description: description ?? inner.description };
}

/**
 * Derives form fields from a Zod object schema. Labels come from `.describe()`
 * when present, otherwise from the key. Unsupported types render as text inputs.
 */
export function fieldsFromSchema(schema: AnyObjectSchema, exclude: string[] = []): FormField[] {
  return Object.entries(schema.shape as Record<string, z.ZodType>)
    .filter(([name]) => !exclude.includes(name))
    .map(([name, fieldSchema]) => {
      const { inner, required, description } = unwrap(fieldSchema);
      const field: FormField = {
        name,
        label: description ?? humanize(name),
        kind: 'text',
        required,
      };
      if (inner instanceof z.ZodNumber) {
        field.kind = 'number';
      } else if (inner instanceof z.ZodBoolean) {
        field.kind = 'checkbox';
        field.required = false;
      } else if (inner instanceof z.ZodEnum) {
        field.kind = 'select';
        field.options = Object.values(inner.enum).map(String);
      } else if (inner instanceof z.ZodDate) {
        field.kind = 'date';
      }
      return field;
    });
}

/** Converts `FormData` strings into the JS values the schema expects, then validates. */
export function parseFormData<S extends AnyObjectSchema>(
  schema: S,
  formData: FormData,
  fields: FormField[] = fieldsFromSchema(schema),
):
  | { ok: true; data: z.output<S> }
  | { ok: false; fieldErrors: Record<string, string[]>; values: Record<string, string | boolean> } {
  const raw: FormValues = {};
  const values: Record<string, string | boolean> = {};
  for (const field of fields) {
    const value = formData.get(field.name);
    const text = typeof value === 'string' ? value : '';
    values[field.name] = field.kind === 'checkbox' ? value === 'on' || value === 'true' : text;
    switch (field.kind) {
      case 'checkbox':
        raw[field.name] = value === 'on' || value === 'true';
        break;
      case 'number':
        raw[field.name] = text === '' ? undefined : Number(text);
        break;
      case 'date':
        raw[field.name] = text === '' ? undefined : new Date(text);
        break;
      default:
        raw[field.name] = text === '' && !field.required ? undefined : text;
    }
  }

  const parsed = schema.safeParse(raw);
  if (parsed.success) {
    return { ok: true, data: parsed.data as z.output<S> };
  }
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? '_');
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return { ok: false, fieldErrors, values };
}

/** Turns row values into what an `<input defaultValue>` can hold. */
export function toFormValues(
  values: FormValues | undefined,
  fields: FormField[],
): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  if (!values) return out;
  for (const field of fields) {
    const value = values[field.name];
    if (value === null || value === undefined) continue;
    if (field.kind === 'checkbox') {
      out[field.name] = Boolean(value);
    } else if (value instanceof Date) {
      out[field.name] = value.toISOString().slice(0, 10);
    } else {
      out[field.name] = String(value);
    }
  }
  return out;
}
