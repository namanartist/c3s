import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { SOSButton } from '@/components/c3s/SOSButton';
import { CampusMap } from '@/components/c3s/CampusMap';
import { useC3SStore } from '@/store/c3sStore';

export default function StudentSosPage() {
  const { sosActive } = useC3SStore();

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-8 py-6">
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight text-white uppercase">EMERGENCY SOS</h1>
          <p className="mt-1 text-xs text-slate-400">Direct tactical line to Central Command & Rapid Response Guards.</p>
          {sosActive && (
            <p className="mt-2 text-xs font-mono text-rose-400 font-bold animate-pulse">● ACTIVE SOS BROADCAST ENGAGED</p>
          )}
        </div>

        <div className="flex justify-center">
          <SOSButton />
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Live Campus Response Map</h2>
          <CampusMap height="h-[360px]" highlightLocation="Academic Block A" />
        </div>
      </div>
    </AppShell>
  );
}