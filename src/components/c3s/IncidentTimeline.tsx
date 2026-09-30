import React from 'react';
import type { IncidentTimelineEntry } from '@/lib/mock-data/incidents';

interface IncidentTimelineProps {
  timeline: IncidentTimelineEntry[];
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({ timeline }) => {
  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
      {timeline.map((entry, idx) => (
        <div key={idx} className="relative group">
          <div className="absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-blue-500 bg-slate-950 transition-colors group-hover:bg-blue-500" />
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-400">{entry.time}</span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs font-semibold text-slate-400">{entry.actor}</span>
          </div>
          <p className="mt-1 text-sm font-bold text-slate-200">{entry.event}</p>
          {entry.detail && <p className="mt-0.5 text-xs text-slate-400">{entry.detail}</p>}
        </div>
      ))}
    </div>
  );
};