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
  const borderVariants = {
    default: 'border-slate-800 hover:border-slate-700 bg-slate-900/60',
    critical: 'border-rose-500/40 hover:border-rose-500/60 bg-rose-950/20',
    success: 'border-emerald-500/40 hover:border-emerald-500/60 bg-emerald-950/20',
    warning: 'border-amber-500/40 hover:border-amber-500/60 bg-amber-950/20',
    primary: 'border-blue-500/40 hover:border-blue-500/60 bg-blue-950/20'
  };

  const iconVariants = {
    default: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    critical: 'text-rose-400 bg-rose-500/15 border-rose-500/30 animate-pulse',
    success: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    warning: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    primary: 'text-blue-400 bg-blue-500/15 border-blue-500/30'
  };

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border p-5 backdrop-blur-md transition-all duration-200 ${borderVariants[variant]} ${
        onClick ? 'cursor-pointer hover:shadow-lg hover:shadow-blue-950/30' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">{value}</h3>
            {statusBadge}
          </div>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className={`rounded-xl border p-2.5 ${iconVariants[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span className={`font-semibold ${trendPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trendPositive ? '↑' : '↓'} {trend}
          </span>
          <span className="text-slate-500">vs yesterday</span>
        </div>
      )}
    </div>
  );
};