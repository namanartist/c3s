import React from 'react';
import { ShieldAlert, ChevronRight } from 'lucide-react';
import { useC3SStore } from '@/store/c3sStore';
import { useNavigate } from 'react-router-dom';

export const SOSActiveBanner: React.FC = () => {
  const { sosActive, sosIncidentId, sosStatus, sosRespondersNotified, cancelSos } = useC3SStore();
  const navigate = useNavigate();

  if (!sosActive) return null;

  return (
    <div className="sticky top-16 z-40 w-full border-b border-rose-500/50 bg-rose-950/90 px-4 py-2.5 text-white backdrop-blur-md shadow-lg shadow-rose-950/50">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 animate-pulse">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider text-rose-200 uppercase">🚨 EMERGENCY SOS ACTIVE</span>
              <span className="rounded bg-rose-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-300">
                {sosIncidentId}
              </span>
            </div>
            <p className="text-xs text-rose-300">
              Status: <span className="font-bold text-white">{sosStatus}</span> • {sosRespondersNotified} Responders En Route
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/student/sos')}
            className="flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-rose-500"
          >
            View Live SOS Status <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => cancelSos()}
            className="rounded-lg border border-rose-700 bg-rose-900/50 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};