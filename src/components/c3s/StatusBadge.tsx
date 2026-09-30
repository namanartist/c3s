import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', pulse = false }) => {
  const norm = status.toUpperCase();

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
  let dotColor = 'bg-slate-400';

  if (['ACTIVE', 'ONLINE', 'INSIDE', 'VERIFIED', 'RESOLVED', 'ARRIVED', 'OPERATIONAL'].includes(norm)) {
    colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    dotColor = 'bg-emerald-500';
  } else if (['CRITICAL', 'ALERT SENT', 'FLAGGED', 'OFFLINE'].includes(norm)) {
    colorClasses = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    dotColor = 'bg-rose-500';
  } else if (['EN ROUTE', 'ACKNOWLEDGED', 'INVESTIGATING', 'HIGH', 'WARNING', 'RESTRICTED'].includes(norm)) {
    colorClasses = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    dotColor = 'bg-amber-500';
  } else if (['ON_DUTY', 'OUTSIDE', 'MEDIUM', 'INFO'].includes(norm)) {
    colorClasses = 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    dotColor = 'bg-blue-400';
  }

  const sizeClasses = size === 'lg' ? 'px-3 py-1.5 text-sm font-semibold' : size === 'md' ? 'px-2.5 py-1 text-xs font-medium' : 'px-2 py-0.5 text-[11px] font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${colorClasses} ${sizeClasses}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor} ${pulse ? 'animate-ping' : ''}`} />
      <span>{status}</span>
    </span>
  );
};