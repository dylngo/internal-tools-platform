import type { AnyObjectSchema } from '@platform/ui';
import type { AnyResource } from './define-resource';

/**
 * The resource schema narrowed to `editableFields`. Both the edit form and the
 * update action use it, so a create-only or masked field can neither be
 * rendered nor smuggled in through a hand-crafted request.
 */
export function editSchema(resource: AnyResource): AnyObjectSchema {
  const mask = Object.fromEntries(resource.editableFields.map((key) => [key, true as const]));
  return resource.schema.pick(mask);
}
