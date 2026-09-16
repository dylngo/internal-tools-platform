import { type DbExecutor, db } from '@platform/db';
import type { DataTablePage, DataTableQuery } from '@platform/ui';
import { and, asc, count, desc, eq, getTableColumns, gte, ilike, lt, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import type { AnyResource, ResourceTable, RowOf } from './define-resource';

/** Looks up a column by its TypeScript key, refusing anything that is not a real column. */
export function columnOf(table: ResourceTable, key: string): PgColumn {
  const column = getTableColumns(table)[key];
  if (!column) {
    throw new Error(`Unknown column "${key}"`);
  }
  return column;
}

export async function findRow<R extends AnyResource>(
  resource: R,
  id: string,
  executor: DbExecutor = db,
  lock?: 'update',
): Promise<RowOf<R['table']> | undefined> {
  const query = executor.select().from(resource.table).where(eq(resource.table.id, id)).limit(1);
  const rows = lock ? await query.for(lock) : await query;
  return rows[0] as RowOf<R['table']> | undefined;
}

/** Turns a DataTable query (from the URL) into one page of rows plus a total count. */
export async function listRows<R extends AnyResource>(
  resource: R,
  query: DataTableQuery,
  executor: DbExecutor = db,
): Promise<DataTablePage<RowOf<R['table']>>> {
  const { table, list } = resource;
  const conditions: SQL[] = [];
  for (const filter of list.filters ?? []) {
    const value = query.filters[filter.key];
    if (!value) continue;
    const column = columnOf(table, filter.key);
    if (filter.kind === 'date') {
      const start = new Date(`${value}T00:00:00.000Z`);
      if (!Number.isNaN(start.getTime())) {
        const end = new Date(start);
        end.setUTCDate(end.getUTCDate() + 1);
        conditions.push(and(gte(column, start), lt(column, end)) as SQL);
      }
    } else {
      conditions.push(filter.options ? eq(column, value) : ilike(column, `%${value}%`));
    }
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const sortKey = getTableColumns(table)[query.sort] ? query.sort : list.defaultSort;
  const sortColumn = columnOf(table, sortKey);
  const orderBy = query.direction === 'asc' ? asc(sortColumn) : desc(sortColumn);

  const [rows, [total]] = await Promise.all([
    executor
      .select()
      .from(table)
      .where(where)
      .orderBy(orderBy, asc(table.id))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    executor.select({ count: count() }).from(table).where(where),
  ]);

  return { rows: rows as RowOf<R['table']>[], total: total?.count ?? 0 };
}
