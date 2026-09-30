import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { CampusMap } from '@/components/c3s/CampusMap';

export default function ControlRoomMapPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-100 uppercase">TACTICAL COMMAND CENTER MAP</h1>
          <p className="text-xs text-slate-400">High-resolution campus tactical map with real-time guard GPS and camera feeds.</p>
        </div>
        <CampusMap height="h-[680px]" highlightLocation="Academic Block A" />
      </div>
    </AppShell>
  );
}