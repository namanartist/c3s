import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { PageHeader } from '@/components/c3s/PageHeader';
import { CampusMap } from '@/components/c3s/CampusMap';

export default function SecurityMapPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader eyebrow="Dispatch Map" statusTone="primary" title="GUARD PATROL & DISPATCH MAP" subtitle="Tactical geo-grid overlay with patrol coordinates, zones, and active beacons." />
        <CampusMap height="h-[62vh] min-h-[420px]" highlightLocation="Academic Block A" />
      </div>
    </AppShell>
  );
}