import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { PageHeader } from '@/components/c3s/PageHeader';
import { CampusMap } from '@/components/c3s/CampusMap';

export default function ControlRoomMapPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader eyebrow="Tactical Map" statusTone="info" title="TACTICAL COMMAND CENTER MAP" subtitle="High-resolution campus tactical map with real-time guard GPS and camera feeds." />
        <CampusMap height="h-[62vh] min-h-[420px]" highlightLocation="Academic Block A" />
      </div>
    </AppShell>
  );
}