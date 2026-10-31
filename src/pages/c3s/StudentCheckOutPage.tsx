import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { QRScanner } from '@/components/c3s/QRScanner';
import { useC3SStore } from '@/store/c3sStore';
import { ShieldCheck, ArrowLeft, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StudentCheckOutPage() {
  const navigate = useNavigate();
  const { isInsideCampus, checkedInGate, checkedInAt } = useC3SStore();

  return (
    <AppShell>
      <div className="mx-auto max-w-xl py-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <button
            onClick={() => navigate('/student')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${!isInsideCampus ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'}`}>
              <ShieldCheck className="h-3.5 w-3.5" />
              {isInsideCampus ? `Current: INSIDE (${checkedInGate || 'Main Gate'} - ${checkedInAt || 'Active'})` : 'Current: OUTSIDE CAMPUS'}
            </span>
            <button
              onClick={() => navigate('/student/movement')}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="View Movement Ledger"
            >
              <History className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Real QR Scanner - Mandatory for Egress */}
        <QRScanner isCheckOut={true} />
      </div>
    </AppShell>
  );
}
