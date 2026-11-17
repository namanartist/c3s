/**
 * src/components/c3s/StatusBadge.tsx
 *
 * The badge previously inferred its colour from a hardcoded allow-list of
 * status strings, which meant a new status silently fell back to grey and the
 * mapping could not be extended from the outside. The `tone` prop is now the
 * primary API; the legacy string inference is kept as a fallback so that the
 * existing call sites keep working unchanged.
 */
import React from 'react';
import { TONE_BADGE, TONE_DOT, inferStatusTone, type Tone } from './tokens';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  /** Explicit semantic colour. Overrides the legacy string inference. */
  tone?: Tone;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  pulse = false,
  tone,
}) => {
  const resolvedTone: Tone = tone ?? inferStatusTone(status);

  const sizeClasses =
    size === 'lg'
      ? 'px-3 py-1.5 text-xs font-bold'
      : size === 'md'
        ? 'px-2.5 py-1 text-[11px] font-bold'
        : 'px-2 py-0.5 text-[10px] font-bold';

  return (
    <span
      className={`inline-flex select-none items-center gap-1.5 rounded-full border font-mono uppercase tracking-wider backdrop-blur-md ${TONE_BADGE[resolvedTone]} ${sizeClasses}`}
    >
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${TONE_DOT[resolvedTone]}`}
            aria-hidden="true"
          />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${TONE_DOT[resolvedTone]}`} />
      </span>
      <span>{status}</span>
    </span>
  );
};

export default StatusBadge;
