// src/components/c3s/StatCard.tsx
import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  statusBadge?: React.ReactNode;
  variant?: 'default' | 'critical' | 'success' | 'warning' | 'primary';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive,
  statusBadge,
  variant = 'default',
  onClick
}) => {
  const cardGradients = {
    default: 'from-slate-500/5 to-transparent border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.16] bg-white dark:bg-slate-900/80 text-slate-900 dark:text-white',
    critical: 'from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/30 hover:border-rose-500/60 bg-white dark:bg-rose-950/20 text-slate-900 dark:text-white',
    success: 'from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/30 hover:border-emerald-500/60 bg-white dark:bg-emerald-950/20 text-slate-900 dark:text-white',
    warning: 'from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30 hover:border-amber-500/60 bg-white dark:bg-amber-950/20 text-slate-900 dark:text-white',
    primary: 'from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/30 hover:border-blue-500/60 bg-white dark:bg-blue-950/20 text-slate-900 dark:text-white'
  };

  const iconVariants = {
    default: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.06] border-slate-200 dark:border-white/10',
    critical: 'text-rose-600 dark:text-rose-400 bg-rose-500/15 border-rose-500/30 animate-pulse',
    success: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    warning: 'text-amber-600 dark:text-amber-400 bg-amber-500/15 border-amber-500/30',
    primary: 'text-blue-600 dark:text-blue-400 bg-blue-500/15 border-blue-500/30'
  };

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 backdrop-blur-xl shadow-xs dark:shadow-md transition-all duration-300 hover:-translate-y-0.5 ${cardGradients[variant]} ${
        onClick ? 'cursor-pointer hover:shadow-lg dark:hover:shadow-blue-950/40' : ''
      }`}
    >
      {/* Ambient background glow accent */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-current to-transparent opacity-[0.04] blur-xl group-hover:opacity-[0.08] transition-opacity" />

      <div className="flex items-start justify-between relative z-10">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2 flex-wrap">
            <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl font-mono">
              {value}
            </h3>
            {statusBadge}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-snug line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`shrink-0 ml-3 rounded-xl border p-2.5 shadow-xs transition-transform group-hover:scale-105 ${iconVariants[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-1.5 text-xs relative z-10">
          <span
            className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded-md ${
              trendPositive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}
          >
            {trendPositive ? '↑' : '↓'} {trend}
          </span>
          <span className="text-[11px] text-slate-400">vs yesterday</span>
        </div>
      )}
    </div>
  );
};
