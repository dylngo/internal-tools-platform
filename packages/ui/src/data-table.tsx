import Link from 'next/link';
import type { ReactNode } from 'react';
import { formatValue } from './lib/format';
import { buttonClassName } from './primitives/button';
import { Input, Label, Select } from './primitives/form-controls';
import { EmptyState } from './primitives/page';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './primitives/table';

/** Next.js `searchParams` shape. */
export type SearchParams = Record<string, string | string[] | undefined>;

export type SortDirection = 'asc' | 'desc';

/** What the page URL says the user wants. The loader turns this into SQL. */
export interface DataTableQuery {
  page: number;
  pageSize: number;
  sort: string;
  direction: SortDirection;
  filters: Record<string, string>;
}

export interface DataTableColumn<Row> {
  key: string;
  header?: string;
  sortable?: boolean;
  render?(row: Row): ReactNode;
}

export interface DataTableFilter {
  key: string;
  label: string;
  /** Renders a select when provided, otherwise a free-text input (matched with ILIKE by the loader). */
  options?: readonly { value: string; label: string }[] | readonly string[];
  type?: 'text' | 'date';
}

export interface DataTablePage<Row> {
  rows: Row[];
  total: number;
}

export type DataTableLoader<Row> = (query: DataTableQuery) => Promise<DataTablePage<Row>>;

const PARAM = { page: 'page', sort: 'sort', direction: 'dir', filterPrefix: 'f_' } as const;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseDataTableQuery(
  searchParams: SearchParams,
  defaults: { sort: string; direction?: SortDirection; pageSize?: number },
): DataTableQuery {
  const page = Math.max(1, Number.parseInt(first(searchParams[PARAM.page]) ?? '1', 10) || 1);
  const direction = first(searchParams[PARAM.direction]);
  const filters: Record<string, string> = {};
  for (const [key, raw] of Object.entries(searchParams)) {
    const value = first(raw);
    if (key.startsWith(PARAM.filterPrefix) && value) {
      filters[key.slice(PARAM.filterPrefix.length)] = value;
    }
  }
  return {
    page,
    pageSize: defaults.pageSize ?? 25,
    sort: first(searchParams[PARAM.sort]) ?? defaults.sort,
    direction:
      direction === 'asc' || direction === 'desc' ? direction : (defaults.direction ?? 'desc'),
    filters,
  };
}

function queryHref(query: DataTableQuery, overrides: Partial<DataTableQuery>): string {
  const next = { ...query, ...overrides };
  const params = new URLSearchParams();
  if (next.page > 1) params.set(PARAM.page, String(next.page));
  params.set(PARAM.sort, next.sort);
  params.set(PARAM.direction, next.direction);
  for (const [key, value] of Object.entries(next.filters)) {
    if (value) params.set(`${PARAM.filterPrefix}${key}`, value);
  }
  return `?${params.toString()}`;
}

/**
 * Server-rendered table. Sorting, filtering and paging all round-trip through
 * the URL, so the page is shareable and works without client JavaScript.
 */
export async function DataTable<Row>({
  columns,
  filters = [],
  query,
  loader,
  rowKey,
  rowHref,
  emptyMessage = 'No results.',
}: {
  columns: DataTableColumn<Row>[];
  filters?: DataTableFilter[];
  query: DataTableQuery;
  loader: DataTableLoader<Row>;
  rowKey: (row: Row) => string;
  /** When set, the first column links to the row's detail page. */
  rowHref?: (row: Row) => string;
  emptyMessage?: string;
}) {
  const { rows, total } = await loader(query);
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  const from = total === 0 ? 0 : (query.page - 1) * query.pageSize + 1;
  const to = Math.min(total, query.page * query.pageSize);
  const hasActiveFilters = Object.keys(query.filters).length > 0;

  return (
    <div className="space-y-4">
      {filters.length > 0 ? (
        <form method="get" className="flex flex-wrap items-end gap-3">
          <input type="hidden" name={PARAM.sort} value={query.sort} />
          <input type="hidden" name={PARAM.direction} value={query.direction} />
          {filters.map((filter) => {
            const name = `${PARAM.filterPrefix}${filter.key}`;
            const value = query.filters[filter.key] ?? '';
            return (
              <div key={filter.key} className="flex flex-col gap-1">
                <Label htmlFor={name} className="text-xs">
                  {filter.label}
                </Label>
                {filter.options ? (
                  <Select id={name} name={name} defaultValue={value} className="w-44">
                    <option value="">All</option>
                    {filter.options.map((option) => {
                      const item =
                        typeof option === 'string' ? { value: option, label: option } : option;
                      return (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      );
                    })}
                  </Select>
                ) : (
                  <Input
                    id={name}
                    name={name}
                    type={filter.type ?? 'text'}
                    defaultValue={value}
                    placeholder={`Filter by ${filter.label.toLowerCase()}`}
                    className="w-56"
                  />
                )}
              </div>
            );
          })}
          <button type="submit" className={buttonClassName('secondary')}>
            Apply
          </button>
          {hasActiveFilters ? (
            <Link
              href={queryHref(query, { filters: {}, page: 1 })}
              className={buttonClassName('ghost')}
            >
              Clear
            </Link>
          ) : null}
        </form>
      ) : null}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => {
                const header = column.header ?? column.key;
                if (!column.sortable) {
                  return <TableHead key={column.key}>{header}</TableHead>;
                }
                const active = query.sort === column.key;
                const nextDirection: SortDirection =
                  active && query.direction === 'asc' ? 'desc' : 'asc';
                return (
                  <TableHead key={column.key}>
                    <Link
                      href={queryHref(query, {
                        sort: column.key,
                        direction: nextDirection,
                        page: 1,
                      })}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {header}
                      <span aria-hidden className="text-xs">
                        {active ? (query.direction === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </Link>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-0">
                  <EmptyState>{emptyMessage}</EmptyState>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={rowKey(row)}>
                  {columns.map((column, index) => {
                    const content = column.render
                      ? column.render(row)
                      : formatValue((row as Record<string, unknown>)[column.key]);
                    return (
                      <TableCell key={column.key}>
                        {index === 0 && rowHref ? (
                          <Link
                            href={rowHref(row)}
                            className="font-medium underline-offset-4 hover:underline"
                          >
                            {content}
                          </Link>
                        ) : (
                          content
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {from}–{to} of {total}
        </span>
        <div className="flex items-center gap-2">
          <PageLink href={queryHref(query, { page: query.page - 1 })} disabled={query.page <= 1}>
            Previous
          </PageLink>
          <span>
            Page {query.page} of {pageCount}
          </span>
          <PageLink
            href={queryHref(query, { page: query.page + 1 })}
            disabled={query.page >= pageCount}
          >
            Next
          </PageLink>
        </div>
      </div>
    </div>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: ReactNode;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled
        className={buttonClassName('outline', 'sm', 'pointer-events-none opacity-50')}
      >
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={buttonClassName('outline', 'sm')}>
      {children}
    </Link>
  );
}
