/**
 * src/components/c3s/IncidentTimeline.tsx
 *
 * The timeline was dark-mode only: the event text used `text-slate-200` with no
 * light-mode variant, which is effectively invisible on a white background.
 * Every colour is now expressed as a light/dark pair.
 */
import React from 'react';
import type { IncidentTimelineEntry } from '@/lib/mock-data/incidents';
import { EmptyState } from './EmptyState';
import { History } from 'lucide-react';

interface IncidentTimelineProps {
  timeline: IncidentTimelineEntry[];
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <EmptyState
        compact
        icon={History}
        title="No timeline entries yet"
        description="Actions taken on this incident will be recorded here."
      />
    );
  }

  return (
    <ol className="relative space-y-5 pl-6 before:absolute before:bottom-2 before:left-2 before:top-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
      {timeline.map((entry, idx) => (
        <li key={`${entry.time}-${idx}`} className="group relative">
          <span
            className="absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-blue-500 bg-white transition-colors group-hover:bg-blue-500 dark:bg-[#0D1322]"
            aria-hidden="true"
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
              {entry.time}
            </span>
            <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">
              •
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {entry.actor}
            </span>
          </div>
          <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">{entry.event}</p>
          {entry.detail && (
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {entry.detail}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
};

export default IncidentTimeline;
