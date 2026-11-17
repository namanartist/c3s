/**
 * src/components/c3s/DataTable.tsx
 *
 * Enhancements over the original:
 * - **Pagination.** The Control Room previously rendered every incident in one
 *   unbounded table, which produced an endless scroll.
 * - **Sorting.** Column headers are now sortable buttons with `aria-sort`.
 * - **Search is always available.** It used to appear only when the table had
 *   more than five rows, which made the affordance unpredictable.
 * - **Accessibility.** The table now has a caption, `scope="col"` on the
 *   headers, and stable row keys (the index key caused reconciliation bugs
 *   when rows were filtered or reordered).
 * - **Designed empty state** instead of a bare line of text.
 * - `shadow-sm` was a Tailwind v4 class that renders nothing in v3.4.
 */
import React, { useState, useMemo } from 'react';
import { Search, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
  /** Extra class applied to the header cell only (use for alignment). */
  headerClassName?: string;
  /** Set to false to opt out of sorting for this column. */
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  emptyDescription?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Accessible name for the table. */
  caption?: string;
  /** Rows per page. Pass `0` to disable pagination. */
  pageSize?: number;
  /** Stable key accessor - strongly recommended. */
  rowKey?: (row: T, index: number) => string;
  /** Accessible label for the search field. */
  searchLabel?: string;
}

type SortDirection = 'asc' | 'desc';

export function DataTable<T>({
  columns,
  data,
  emptyMessage = 'No records found.',
  emptyDescription,
  searchable = true,
  searchPlaceholder = 'Filter records...',
  caption,
  pageSize = 10,
  rowKey,
  searchLabel = 'Filter records',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Reset pagination whenever the underlying data or the filter changes.
  // React's recommended pattern for "adjust state when something changes" is
  // to compare during render rather than to fire a setState from an effect.
  const resetKey = `${data.length}|${searchTerm}`;
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  if (lastResetKey !== resetKey) {
    setLastResetKey(resetKey);
    setPage(0);
  }

  const searchableValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      // Search nested objects one level deep (e.g. evidence.photoUrl).
      return Object.values(value as Record<string, unknown>)
        .map(searchableValue)
        .join(' ');
    }
    return String(value);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((row) => {
      const record = row as unknown as Record<string, unknown>;
      return Object.values(record).some((val) => searchableValue(val).toLowerCase().includes(term));
    });
  }, [data, searchTerm]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const factor = sortDirection === 'asc' ? 1 : -1;
    return [...filteredData].sort((a, b) => {
      const left = (a as Record<string, unknown>)[sortKey as string];
      const right = (b as Record<string, unknown>)[sortKey as string];
      if (typeof left === 'number' && typeof right === 'number') {
        return (left - right) * factor;
      }
      return String(left ?? '').localeCompare(String(right ?? '')) * factor;
    });
  }, [filteredData, sortKey, sortDirection]);

  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(sortedData.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages - 1);
  const visibleRows =
    pageSize > 0 ? sortedData.slice(safePage * pageSize, safePage * pageSize + pageSize) : sortedData;

  const toggleSort = (column: Column<T>) => {
    if (!column.accessorKey || column.sortable === false) return;
    if (sortKey === column.accessorKey) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(column.accessorKey);
      setSortDirection('asc');
    }
  };

  const getRowKey = (row: T, index: number): string => {
    if (rowKey) return rowKey(row, index);
    const candidate = (row as unknown as Record<string, unknown>).id;
    if (candidate !== undefined && candidate !== null) return String(candidate);
    return `row-${index}`;
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white backdrop-blur-xl shadow-sm transition-colors dark:border-white/[0.08] dark:bg-[#0D1322]/85 dark:shadow-md">
      {/* Toolbar */}
      {searchable && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/70 p-3 sm:px-4 dark:border-white/[0.08] dark:bg-white/[0.02]">
          <div className="relative flex-1 min-w-[12rem] max-w-xs">
            <Search
              className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400"
              aria-hidden="true"
            />
            <label htmlFor="datatable-filter" className="sr-only">
              {searchLabel}
            </label>
            <input
              id="datatable-filter"
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-[#0D1322] dark:text-slate-100"
            />
          </div>
          <div className="flex items-center gap-3">
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-blue-600 transition-colors hover:bg-blue-500/10 dark:text-blue-400"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                Clear
              </button>
            )}
            <span className="shrink-0 font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {filteredData.length} of {data.length} records
            </span>
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-400">
            <tr>
              {columns.map((col, idx) => {
                const isSorted = sortKey === col.accessorKey;
                const canSort = Boolean(col.accessorKey) && col.sortable !== false;
                return (
                  <th
                    key={idx}
                    scope="col"
                    aria-sort={
                      isSorted ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'
                    }
                    className={`px-4 py-3 ${col.headerClassName || col.className || ''}`}
                  >
                    {canSort ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col)}
                        className="inline-flex items-center gap-1 rounded transition-colors hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:hover:text-blue-400"
                      >
                        {col.header}
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-3 w-3" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="h-3 w-3" aria-hidden="true" />
                          )
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">
                            ↕
                          </span>
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800 dark:divide-white/[0.05] dark:text-slate-200">
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <EmptyState
                    compact
                    title={searchTerm ? 'No matching records' : emptyMessage}
                    description={
                      searchTerm
                        ? 'No records match the current filter. Try a different search term.'
                        : emptyDescription
                    }
                    action={
                      searchTerm ? (
                        <button
                          type="button"
                          onClick={() => setSearchTerm('')}
                          className="rounded-lg border border-blue-500/40 px-3 py-1.5 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-500/10 dark:text-blue-400"
                        >
                          Clear filter
                        </button>
                      ) : undefined
                    }
                  />
                </td>
              </tr>
            ) : (
              visibleRows.map((row, rowIdx) => (
                <tr
                  key={getRowKey(row, safePage * pageSize + rowIdx)}
                  className="transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.03]"
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-4 py-3.5 ${col.className || ''}`}>
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                          ? String(
                              (row as Record<string, unknown>)[col.accessorKey as string] ?? '',
                            )
                          : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageSize > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-3 py-2.5 sm:px-4 dark:border-white/[0.08]">
          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
            Page {safePage + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              disabled={safePage === 0}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/[0.06]"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
              disabled={safePage >= totalPages - 1}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/[0.06]"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
