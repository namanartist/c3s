// src/components/c3s/DataTable.tsx
import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function DataTable<T>({
  columns,
  data,
  emptyMessage = 'No records found.',
  searchable = true,
  searchPlaceholder = 'Filter records...'
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((row) => {
      const record = row as unknown as Record<string, unknown>;
      return Object.values(record).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm]);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-900/80 backdrop-blur-xl shadow-xs dark:shadow-md transition-colors">
      {/* Table Header Filter Bar */}
      {searchable && data.length > 5 && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-white/[0.08] p-3 sm:px-4 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/90 py-1.5 pl-8 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-bold shrink-0">
            {filteredData.length} of {data.length} records
          </span>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/90 dark:bg-slate-950/70 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-4 py-3.5 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-slate-800 dark:text-slate-200">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
                  <p className="font-semibold text-xs">{emptyMessage}</p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="mt-2 text-xs text-blue-600 dark:text-blue-400 underline font-bold cursor-pointer"
                    >
                      Clear search filter
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredData.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors"
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-4 py-3.5 ${col.className || ''}`}>
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                        ? String((row as Record<string, unknown>)[col.accessorKey as string] ?? '')
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
