import { getCurrentUser } from '@platform/auth';
import { can } from '@platform/rbac';
import { PageHeader, ResourceForm } from '@platform/ui';
import { notFound } from 'next/navigation';
import type { ResourceActions } from './actions';
import type { AnyResource } from './define-resource';
import { Forbidden } from './forbidden';
import { findRow } from './query';

/** Generated "create" page. */
export async function ResourceNew({
  resource,
  actions,
}: {
  resource: AnyResource;
  actions: ResourceActions;
}) {
  const user = await getCurrentUser();
  if (!can(user, resource.permissions.write)) {
    return <Forbidden permission={resource.permissions.write} />;
  }
  return (
    <div>
      <PageHeader title={`New ${resource.label.toLowerCase()}`} />
      <ResourceForm
        schema={resource.schema}
        action={actions.create}
        submitLabel={`Create ${resource.label.toLowerCase()}`}
        cancelHref={resource.basePath}
      />
    </div>
  );
}

/** Generated "edit" page. */
export async function ResourceEdit({
  resource,
  actions,
  id,
}: {
  resource: AnyResource;
  actions: ResourceActions;
  id: string;
}) {
  const user = await getCurrentUser();
  if (!can(user, resource.permissions.write)) {
    return <Forbidden permission={resource.permissions.write} />;
  }
  const row = (await findRow(resource, id)) as Record<string, unknown> | undefined;
  if (!row) {
    notFound();
  }
  return (
    <div>
      <PageHeader title={`Edit ${resource.label.toLowerCase()}`} description={id} />
      <ResourceForm
        schema={resource.schema}
        action={actions.update.bind(null, id)}
        defaultValues={row}
        submitLabel="Save changes"
        cancelHref={`${resource.basePath}/${id}`}
      />
    </div>
  );
}
