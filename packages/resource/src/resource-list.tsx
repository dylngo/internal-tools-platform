import { getCurrentUser } from '@platform/auth';
import { can } from '@platform/rbac';
import {
  buttonClassName,
  DataTable,
  type DataTableColumn,
  humanize,
  PageHeader,
  parseDataTableQuery,
  type SearchParams,
} from '@platform/ui';
import Link from 'next/link';
import type { AnyResource, ResourceTable, RowOf } from './define-resource';
import { Forbidden } from './forbidden';
import { listRows } from './query';

type Row = RowOf<ResourceTable>;

/** Generated list page: header, filters, sortable paginated table. */
export async function ResourceList({
  resource,
  searchParams,
}: {
  resource: AnyResource;
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!can(user, resource.permissions.read)) {
    return <Forbidden permission={resource.permissions.read} />;
  }

  const query = parseDataTableQuery(searchParams, {
    sort: resource.list.defaultSort,
    direction: resource.list.defaultDirection,
    pageSize: resource.list.pageSize,
  });

  const columns: DataTableColumn<Row>[] = resource.list.columns.map((column) =>
    typeof column === 'string'
      ? { key: column, header: humanize(column), sortable: true }
      : { header: humanize(column.key), sortable: true, ...column },
  );
  const filters = (resource.list.filters ?? []).map((filter) => ({
    key: filter.key,
    label: filter.label ?? humanize(filter.key),
    options: filter.options,
    type: filter.kind,
  }));

  return (
    <div>
      <PageHeader
        title={resource.pluralLabel}
        actions={
          can(user, resource.permissions.write) && resource.create !== false ? (
            <Link href={`${resource.basePath}/new`} className={buttonClassName('default', 'sm')}>
              New {resource.label.toLowerCase()}
            </Link>
          ) : null
        }
      />
      <DataTable<Row>
        columns={columns}
        filters={filters}
        query={query}
        loader={(q) => listRows(resource, q)}
        rowKey={(row) => String(row.id)}
        rowHref={(row) => `${resource.basePath}/${row.id}`}
        emptyMessage={`No ${resource.pluralLabel.toLowerCase()} match.`}
      />
    </div>
  );
}
