/**
 * src/components/c3s/ActionTile.tsx
 *
 * The "bento" card was copy-pasted seven times across the Student and Admin
 * dashboards with only the accent colour changing. This component is the
 * single implementation and, importantly, renders as a real anchor/button so
 * that it is keyboard reachable and announced correctly by screen readers.
 */
import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { TONE_ICON, TONE_TEXT, type Tone } from './tokens';

interface ActionTileProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Optional label rendered at the bottom of the tile. */
  cta?: string;
  /** When provided the tile becomes a router link. */
  to?: string;
  /** When provided (and no `to`) the tile becomes a button. */
  onClick?: () => void;
  tone?: Tone;
  /** Small badge pinned to the top-right corner of the tile. */
  badge?: React.ReactNode;
  className?: string;
}

export const ActionTile: React.FC<ActionTileProps> = ({
  icon: Icon,
  title,
  description,
  cta = 'Open',
  to,
  onClick,
  tone = 'primary',
  badge,
  className = '',
}) => {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-transform group-hover:scale-105 ${TONE_ICON[tone]}`}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        {badge}
      </div>

      <div className="mt-5">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
        {description && (
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>

      <div
        className={`mt-5 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs font-bold dark:border-white/[0.06] ${TONE_TEXT[tone]}`}
      >
        <span>{cta}</span>
        <ArrowRight
          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        />
      </div>
    </>
  );

  const shell =
    'group relative flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left backdrop-blur-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 dark:border-white/[0.08] dark:bg-[#0D1322]/85 dark:hover:border-blue-500/40 dark:hover:shadow-blue-950/40';

  if (to) {
    return (
      <Link to={to} className={`${shell} ${className}`}>
        {body}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${shell} cursor-pointer ${className}`}>
        {body}
      </button>
    );
  }

  return <div className={`${shell} ${className}`}>{body}</div>;
};

export default ActionTile;
