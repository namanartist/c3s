import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { QRScanner } from '@/components/c3s/QRScanner';
import { useC3SStore } from '@/store/c3sStore';

export default function StudentScanPage() {
  const { isInsideCampus } = useC3SStore();

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl py-6 space-y-6">
        <QRScanner
          targetGateName="Main Gate"
          isCheckOut={isInsideCampus}
        />
      </div>
    </AppShell>
  );
}