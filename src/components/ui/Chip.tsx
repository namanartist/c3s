// src/components/ui/Chip.tsx
import { memo } from 'react';

export interface ChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

/** A selectable filter tag/chip for checking toggle status or option selections. */
function Chip({
  label,
  active = false,
  onClick,
  className = '',
}: ChipProps) {
  const baseStyle =
    'px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all duration-150 select-none';

  const styles = active
    ? 'bg-[var(--accent)] text-white border border-[var(--accent)]'
    : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseStyle} ${styles} ${className}`}
    >
      {label}
    </button>
  );
}

export default memo(Chip);

