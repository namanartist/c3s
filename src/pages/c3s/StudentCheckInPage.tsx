// src/pages/c3s/StudentCheckInPage.tsx
import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { QRScanner } from '@/components/c3s/QRScanner';
import { useC3SStore } from '@/store/c3sStore';
import { ShieldCheck, ArrowLeft, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StudentCheckInPage() {
  const navigate = useNavigate();
  const { isInsideCampus, checkedInGate, checkedInAt } = useC3SStore();

  return (
    <AppShell>
      <div className="mx-auto max-w-xl py-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <button
            onClick={() => navigate('/student')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                isInsideCampus
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300/80 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30'
                  : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {isInsideCampus ? `Status: INSIDE (${checkedInGate || 'Main Gate'} - ${checkedInAt || 'Verified'})` : 'Status: OUTSIDE CAMPUS'}
            </span>
            <button
              onClick={() => navigate('/student/movement')}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs cursor-pointer"
              title="View Movement Ledger"
            >
              <History className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Real QR Scanner - Mandatory for Ingress */}
        <QRScanner isCheckOut={false} />
      </div>
    </AppShell>
  );
}
