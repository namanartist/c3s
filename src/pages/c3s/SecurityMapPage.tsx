import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { CampusMap } from '@/components/c3s/CampusMap';

export default function SecurityMapPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-100 uppercase">GUARD PATROL & DISPATCH MAP</h1>
          <p className="text-xs text-slate-400">Tactical geo-grid overlay with patrol coordinates, zones, and active beacons.</p>
        </div>
        <CampusMap height="h-[620px]" highlightLocation="Academic Block A" />
      </div>
    </AppShell>
  );
}