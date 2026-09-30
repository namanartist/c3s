// src/components/ui/Badge.tsx
import { memo } from 'react';
import type { ReactNode } from 'react';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'warning';
  className?: string;
}

/** A metadata badge component for displaying labeled statuses or values. */
function Badge({
  children,
  variant = 'default',
  className = '',
}: BadgeProps) {
  const baseStyle = 'px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 border';

  const variants = {
    default: 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)]',
    accent: 'bg-[var(--accent-light)] text-[var(--accent)] border-[var(--accent)]/10',
    success: 'bg-[#E4F5EC] text-[#1A6B3C] border-[#1A6B3C]/10',
    warning: 'bg-[#FFF0E5] text-[#8C4A1A] border-[#8C4A1A]/10',
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export default memo(Badge);

