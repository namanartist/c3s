import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { GateQRDisplay } from '@/components/c3s/GateQRDisplay';

export default function GateKeeperQrPage() {
  return (
    <AppShell>
      <div className="py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">DAILY GATE QR</h1>
          <p className="mt-1 text-xs text-slate-400">Large display mode for gate kiosks, barrier scanners, and guard posts.</p>
        </div>
        <GateQRDisplay />
      </div>
    </AppShell>
  );
}