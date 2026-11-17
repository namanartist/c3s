/**
 * src/components/c3s/PageHeader.tsx
 *
 * The dashboard page header was duplicated verbatim across four dashboards
 * (Control Room, Security, Admin, Gate Keeper). This component is the single
 * implementation, with optional breadcrumbs, a live status line and a slot for
 * page-level actions.
 */
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface Breadcrumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  /** Small uppercase eyebrow, e.g. "SOC GRID OPERATIONAL". */
  eyebrow?: string;
  /** Colour of the status dot next to the eyebrow. */
  statusTone?: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral';
  /** Main page title. */
  title: string;
  /** Supporting sentence below the title. */
  subtitle?: string;
  /** Optional breadcrumb trail rendered above the title. */
  breadcrumbs?: Breadcrumb[];
  /** Actions rendered on the right (buttons, links, selects). */
  actions?: React.ReactNode;
  /** Small meta row rendered under the title. */
  meta?: React.ReactNode;
}

const DOT_TONE: Record<string, string> = {
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-rose-400',
  info: 'bg-sky-400',
  primary: 'bg-blue-400',
  neutral: 'bg-slate-400',
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  statusTone = 'success',
  title,
  subtitle,
  breadcrumbs,
  actions,
  meta,
}) => {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 dark:border-white/[0.08] pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-2">
            <ol className="flex flex-wrap items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {breadcrumbs.map((crumb, index) => (
                <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                  {index > 0 && <ChevronRight className="h-3 w-3 text-slate-400" aria-hidden="true" />}
                  {crumb.to ? (
                    <Link
                      to={crumb.to}
                      className="rounded transition-colors hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:hover:text-blue-400"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="text-slate-700 dark:text-slate-200">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {eyebrow && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${DOT_TONE[statusTone]}`}
                aria-hidden="true"
              />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${DOT_TONE[statusTone]}`} />
            </span>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
              {eyebrow}
            </span>
          </div>
        )}

        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}

        {meta && <div className="mt-3">{meta}</div>}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
};

export default PageHeader;
