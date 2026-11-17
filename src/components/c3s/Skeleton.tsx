/**
 * src/components/c3s/Skeleton.tsx
 *
 * Loading placeholders. The dashboards previously jumped straight from an
 * empty screen to fully rendered data (or to stale mock data), which made it
 * impossible to tell "nothing is happening" from "we have not asked yet".
 */
import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div
    className={`animate-pulse rounded-lg bg-slate-200/70 dark:bg-white/[0.06] ${className}`}
    aria-hidden="true"
  />
);

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`} aria-hidden="true">
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        className={`h-3 ${index === lines - 1 ? 'w-2/3' : 'w-full'}`}
      />
    ))}
  </div>
);

interface SkeletonCardProps {
  /** Number of stat tiles in the row. */
  count?: number;
}

export const SkeletonCardGrid: React.FC<SkeletonCardProps> = ({ count = 4 }) => (
  <div
    className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    role="status"
    aria-label="Loading metrics"
  >
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/[0.08] dark:bg-[#0D1322]/85"
      >
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-3 h-8 w-16" />
        <Skeleton className="mt-2 h-3 w-28" />
      </div>
    ))}
  </div>
);

export default Skeleton;
