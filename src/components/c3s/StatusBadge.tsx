// src/components/c3s/StatusBadge.tsx
import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', pulse = false }) => {
  const norm = (status || '').toUpperCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/90 dark:text-slate-300 dark:border-slate-700/80';
  let dotColor = 'bg-slate-400';

  if (['ACTIVE', 'ONLINE', 'INSIDE', 'VERIFIED', 'RESOLVED', 'ARRIVED', 'OPERATIONAL', 'COMPLETED'].includes(norm)) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-300/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30';
    dotColor = 'bg-emerald-500';
  } else if (['CRITICAL', 'ALERT SENT', 'FLAGGED', 'OFFLINE', 'EMERGENCY', 'FIGHT DETECTED'].includes(norm)) {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-300/80 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40';
    dotColor = 'bg-rose-500';
  } else if (['EN ROUTE', 'ACKNOWLEDGED', 'INVESTIGATING', 'HIGH', 'WARNING', 'RESTRICTED', 'STANDBY'].includes(norm)) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-300/80 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30';
    dotColor = 'bg-amber-500';
  } else if (['ON_DUTY', 'OUTSIDE', 'MEDIUM', 'INFO', 'CHECK-IN', 'CHECK-OUT'].includes(norm)) {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-300/80 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30';
    dotColor = 'bg-blue-500';
  }

  const sizeClasses =
    size === 'lg'
      ? 'px-3 py-1.5 text-xs font-bold'
      : size === 'md'
      ? 'px-2.5 py-1 text-[11px] font-bold'
      : 'px-2 py-0.5 text-[10px] font-bold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border shadow-2xs font-mono uppercase tracking-wider backdrop-blur-md select-none ${colorClasses} ${sizeClasses}`}>
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
      </span>
      <span>{status}</span>
    </span>
  );
};
