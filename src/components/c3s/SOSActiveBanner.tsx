import React from 'react';
import { ShieldAlert, ChevronRight, MapPin, Navigation } from 'lucide-react';
import { useC3SStore } from '@/store/c3sStore';
import { useNavigate } from 'react-router-dom';

export const SOSActiveBanner: React.FC = () => {
  const {
    sosActive,
    sosIncidentId,
    sosStatus,
    sosRespondersNotified,
    sosLocation,
    sosNodeId,
    cancelSos
  } = useC3SStore();
  const navigate = useNavigate();

  if (!sosActive) return null;

  const handleNavigateToSos = () => {
    if (sosIncidentId) {
      navigate(`/map?incident=${encodeURIComponent(sosIncidentId)}`);
    } else if (sosNodeId) {
      navigate(`/map?to=${encodeURIComponent(sosNodeId)}`);
    } else {
      navigate('/map');
    }
  };

  return (
    <div className="sticky top-16 z-40 w-full border-b border-rose-500/50 bg-rose-950/95 px-4 py-2.5 text-white backdrop-blur-md shadow-lg shadow-rose-950/50">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 animate-pulse shadow-md shadow-rose-600/50">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider text-rose-200 uppercase">
                🚨 EMERGENCY SOS ACTIVE
              </span>
              <span className="rounded bg-rose-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-300">
                {sosIncidentId}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                <MapPin className="h-2.5 w-2.5" /> Node #{sosNodeId || 'MainRoad09'}
              </span>
            </div>
            <p className="text-xs text-rose-300 flex flex-wrap items-center gap-2 mt-0.5">
              <span>Status: <strong className="text-white">{sosStatus}</strong></span>
              <span className="text-rose-500">•</span>
              <span>Responders: <strong className="text-emerald-300">Guard, Faculty &amp; Proctor Dispatched</strong> ({sosRespondersNotified})</span>
              {sosLocation && (
                <>
                  <span className="text-rose-500 hidden md:inline">•</span>
                  <span className="text-slate-300 hidden md:inline">{sosLocation}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Navigate to SOS on Campus Map */}
          <button
            onClick={handleNavigateToSos}
            className="flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer"
            title="Open Interactive Campus Map and calculate walking route directly to SOS location"
          >
            <Navigation className="h-3.5 w-3.5" />
            <span>Navigate to SOS</span>
          </button>

          <button
            onClick={() => navigate('/student/sos')}
            className="flex items-center gap-1 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:bg-rose-500 active:scale-95 transition-all cursor-pointer"
          >
            <span>Live Response HUD</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => cancelSos()}
            className="rounded-xl border border-rose-700 bg-rose-900/50 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-800 transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
