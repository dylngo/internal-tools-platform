import type { User } from '@platform/auth';
import type { Transaction } from '@platform/db';
import type { Permission } from '@platform/rbac';
import type { AnyObjectSchema, DataTableColumn, SortDirection } from '@platform/ui';
import type { InferSelectModel } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';

/** Any Drizzle table with an `id` primary key — the only structural requirement. */
export type ResourceTable = PgTable & { id: PgColumn };

export type RowOf<TTable extends ResourceTable> = InferSelectModel<TTable>;

export interface ResourceAction<Row> {
  /** Machine name; audit rows are written as `<resource>.<name>`. */
  name: string;
  label?: string;
  /** Needed to run the action — or, when `requiresApproval`, to approve it. */
  permission: Permission;
  permissionFor?(row: Row): Permission;
  /**
   * Maker-checker: anyone with the resource's write permission may propose the
   * action; it runs only once a *different* user holding `permission` approves.
   */
  requiresApproval?: boolean;
  /** Browser confirm() text shown before the action runs. */
  confirm?: string;
  /** Only show the button when this returns true (e.g. status is not already `closed`). */
  isAvailable?(row: Row): boolean;
  /**
   * Performs the mutation inside the audit transaction. Must use `tx`, not the
   * global db, so the change and its audit row commit or roll back together.
   * Returns the row as it looks afterwards (recorded as `after` in the audit log).
   */
  handler(ctx: { tx: Transaction; row: Row; actor: User }): Promise<Row>;
}

export type ResourceColumn<Row> = (keyof Row & string) | DataTableColumn<Row>;

export interface ResourceFilter {
  key: string;
  label?: string;
  /** Exact-match select when given; otherwise a case-insensitive substring search. */
  options?: readonly string[];
}

export interface ResourceConfig<TTable extends ResourceTable, TSchema extends AnyObjectSchema> {
  /** Singular machine name, e.g. `customer`. Used as the audit `resourceType`. */
  name: string;
  label?: string;
  pluralLabel?: string;
  /** Route prefix for the generated pages, e.g. `/customers`. */
  basePath: string;
  table: TTable;
  /** Editable fields. Anything not in the schema (id, timestamps) is never accepted from a form. */
  schema: TSchema;
  permissions: { read: Permission; write: Permission };
  create?: boolean;
  /** Optional row-level write permission, such as production-only controls. */
  writePermission?(row: RowOf<TTable>): Permission;
  list: {
    columns: ResourceColumn<RowOf<TTable>>[];
    filters?: ResourceFilter[];
    defaultSort: keyof RowOf<TTable> & string;
    defaultDirection?: SortDirection;
    pageSize?: number;
  };
  detail?: {
    /** Field used as the page title; defaults to `id`. */
    titleField?: keyof RowOf<TTable> & string;
    /** Fields to show; defaults to every column. */
    fields?: (keyof RowOf<TTable> & string)[];
    /** Fields hidden behind a permission; revealing one writes an audit row. */
    masked?: { field: keyof RowOf<TTable> & string; permission: Permission }[];
  };
  actions?: ResourceAction<RowOf<TTable>>[];
}

export interface Resource<TTable extends ResourceTable, TSchema extends AnyObjectSchema>
  extends ResourceConfig<TTable, TSchema> {
  label: string;
  pluralLabel: string;
  actions: ResourceAction<RowOf<TTable>>[];
}

/**
 * Loosest resource type; used by the generated components, which never touch
 * row fields directly. Row-typed callbacks are declared with method syntax so a
 * concrete `Resource<typeof customers, ...>` is assignable here.
 */
export type AnyResource = Resource<ResourceTable, AnyObjectSchema>;

export function defineResource<TTable extends ResourceTable, TSchema extends AnyObjectSchema>(
  config: ResourceConfig<TTable, TSchema>,
): Resource<TTable, TSchema> {
  const label = config.label ?? capitalize(config.name);
  return {
    ...config,
    label,
    pluralLabel: config.pluralLabel ?? `${label}s`,
    actions: config.actions ?? [],
  };
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
