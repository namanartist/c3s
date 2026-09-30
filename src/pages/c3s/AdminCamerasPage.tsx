import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { CCTVGrid } from '@/components/c3s/CCTVGrid';

export default function AdminCamerasPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <CCTVGrid />
      </div>
    </AppShell>
  );
}