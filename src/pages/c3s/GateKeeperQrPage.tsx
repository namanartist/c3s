import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { PageHeader } from '@/components/c3s/PageHeader';
import { GateQRDisplay } from '@/components/c3s/GateQRDisplay';

export default function GateKeeperQrPage() {
  return (
    <AppShell>
      <div className="py-8 space-y-6">
        <PageHeader
          eyebrow="Daily Gate QR"
          statusTone="primary"
          title="Daily Gate QR"
          subtitle="Large display mode for gate kiosks, barrier scanners, and guard posts."
        />
        <GateQRDisplay />
      </div>
    </AppShell>
  );
}