/**
 * src/components/c3s/EmptyState.tsx
 *
 * Empty states were missing from almost every data region in the dashboards.
 * An empty table or an empty queue is information - it tells the operator that
 * the system checked and found nothing - so it deserves a designed state
 * rather than a blank rectangle.
 */
import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { TONE_ICON, type Tone } from './tokens';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Optional call to action. */
  action?: React.ReactNode;
  tone?: Tone;
  /** Compact variant for use inside a table cell or a small card. */
  compact?: boolean;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  tone = 'neutral',
  compact = false,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? 'px-4 py-8' : 'px-6 py-14'} ${className}`}
      role="status"
    >
      <div
        className={`flex items-center justify-center rounded-2xl border ${TONE_ICON[tone]} ${compact ? 'h-10 w-10' : 'h-14 w-14'}`}
      >
        <Icon className={compact ? 'h-5 w-5' : 'h-6 w-6'} aria-hidden="true" />
      </div>
      <p
        className={`mt-4 font-bold text-slate-800 dark:text-slate-100 ${compact ? 'text-xs' : 'text-sm'}`}
      >
        {title}
      </p>
      {description && (
        <p
          className={`mt-1 max-w-sm leading-relaxed text-slate-500 dark:text-slate-400 ${compact ? 'text-[11px]' : 'text-xs'}`}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
