/**
 * src/components/c3s/StatCard.tsx
 *
 * Changes over the original:
 * - `shadow-sm` / `shadow-sm` are Tailwind v4 classes and rendered nothing
 *   in this Tailwind v3.4 project. They are now `shadow-sm` / `shadow`.
 * - A clickable card was a `<div onClick>`, which is unreachable by keyboard
 *   and invisible to assistive technology. It is now a real `<button>`.
 * - The hardcoded "vs yesterday" caption is now a caller-supplied label.
 */
import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { TONE_ICON, type Tone } from './tokens';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  /** Caption next to the trend chip, e.g. "vs yesterday". */
  trendLabel?: string;
  statusBadge?: React.ReactNode;
  variant?: Tone | 'default' | 'critical';
  onClick?: () => void;
}

/** Legacy variant names kept as aliases so existing call sites keep working. */
const VARIANT_ALIASES: Record<string, Tone> = {
  default: 'neutral',
  critical: 'danger',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  trendLabel,
  statusBadge,
  variant = 'neutral',
  onClick,
}) => {
  const tone: Tone = VARIANT_ALIASES[variant] ?? (variant as Tone);

  const cardGradients: Record<Tone, string> = {
    neutral:
      'from-slate-500/5 to-transparent border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.16]',
    info: 'from-sky-500/10 via-sky-500/5 to-transparent border-sky-500/30 hover:border-sky-500/60',
    primary:
      'from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/30 hover:border-blue-500/60',
    success:
      'from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/30 hover:border-emerald-500/60',
    warning:
      'from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30 hover:border-amber-500/60',
    danger:
      'from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/30 hover:border-rose-500/60',
  };

  const shell = `group relative overflow-hidden rounded-2xl border bg-gradient-to-br bg-white p-5 backdrop-blur-xl shadow-sm transition-all duration-300 dark:bg-[#0D1322]/85 dark:shadow-md ${
    onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 dark:hover:shadow-blue-950/40' : ''
  } ${cardGradients[tone]}`;

  const content = (
    <>
      {/* Ambient background glow accent */}
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-current to-transparent opacity-[0.04] blur-xl transition-opacity group-hover:opacity-[0.08]"
        aria-hidden="true"
      />

      <div className="relative z-10 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <h3 className="font-mono text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {value}
            </h3>
            {statusBadge}
          </div>
          {subtitle && (
            <p className="mt-1 line-clamp-1 text-xs leading-snug text-slate-600 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`ml-3 shrink-0 rounded-xl border p-2.5 shadow-sm transition-transform group-hover:scale-105 ${TONE_ICON[tone]}`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>

      {trend && (
        <div className="relative z-10 mt-3.5 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs dark:border-white/[0.06]">
          <span
            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-bold ${
              trendPositive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}
          >
            {trendPositive ? (
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
            )}
            {trend}
          </span>
          {trendLabel && <span className="text-[11px] text-slate-400">{trendLabel}</span>}
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={shell} aria-label={`${title}: ${value}`}>
        {content}
      </button>
    );
  }

  return <div className={shell}>{content}</div>;
};

export default StatCard;
