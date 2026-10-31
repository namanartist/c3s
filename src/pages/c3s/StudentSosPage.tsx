import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { SOSButton } from '@/components/c3s/SOSButton';
import { CampusMap } from '@/components/c3s/CampusMap';
import { useC3SStore } from '@/store/c3sStore';
import { ShieldAlert, Camera, MapPin, Radio, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StudentSosPage() {
  const { sosActive, sosIncidentId, sosNodeId, sosLocation } = useC3SStore();
  const navigate = useNavigate();

  const handleNavigateToMap = () => {
    if (sosIncidentId) {
      navigate(`/map?incident=${encodeURIComponent(sosIncidentId)}`);
    } else if (sosNodeId) {
      navigate(`/map?to=${encodeURIComponent(sosNodeId)}`);
    } else {
      navigate('/map');
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-8 py-4 sm:py-6">
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-950/40 px-3.5 py-1 text-xs font-mono font-black text-rose-300">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            ONE-CLICK ONE-STEP EMERGENCY DISPATCH
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase transition-colors">
            CAMPUS EMERGENCY SOS
          </h1>
          <p className="mx-auto max-w-xl text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Press and hold the red circle for 2 seconds. Automatically captures video and photo evidence, determines your node location, and immediately alerts the nearest Faculty, Guard, and Chief Proctor.
          </p>

          {sosActive && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-xl border border-rose-500/50 bg-rose-950/60 px-4 py-2 font-mono text-xs font-bold text-rose-300 animate-pulse">
                <ShieldAlert className="h-4 w-4 text-rose-400" />
                <span>ACTIVE SOS ENGAGED • NODE #{sosNodeId || 'MainRoad09'}</span>
              </div>

              {/* Direct Navigation to SOS Location Button */}
              <button
                onClick={handleNavigateToMap}
                className="flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-950/50 active:scale-95 transition-all cursor-pointer"
              >
                <Navigation className="h-4 w-4" />
                <span>🧭 Navigate to SOS Location on Map</span>
              </button>
            </div>
          )}
        </div>

        {/* Hero 2-Second Red Circle SOS Button */}
        <div className="flex justify-center py-2">
          <SOSButton size="hero" showDetailsOnActive={true} />
        </div>

        {/* Information & Feature Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 text-left shadow-xs dark:shadow-none transition-colors">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase font-mono">
              <Camera className="h-4 w-4 text-cyan-400" />
              <span>Auto Video &amp; Photo</span>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Immediately records a live camera clip and high-res snapshot of the event as encrypted evidence.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 text-left shadow-xs dark:shadow-none transition-colors">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase font-mono">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <span>Exact Node Location</span>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Correlates GPS telemetry with vector campus nodes to pinpoint your exact floor, corridor, and building.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 text-left shadow-xs dark:shadow-none transition-colors">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase font-mono">
              <Radio className="h-4 w-4 text-blue-400" />
              <span>Triple Alert Routing</span>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Simultaneously notifies the nearest Security Guard, nearest Faculty Floor Warden, and Chief Proctor.
            </p>
          </div>
        </div>

        {/* Live Response Map */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-sm dark:shadow-none transition-colors">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-rose-400" />
              Live Campus Emergency Response Map
            </h2>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-emerald-400">
                {sosActive ? `Active Target: ${sosLocation || 'Academic Block A Corridor'}` : 'Standby Node Monitoring'}
              </span>
              <button
                onClick={handleNavigateToMap}
                className="flex items-center gap-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <Navigation className="h-3 w-3" />
                Open Full Navigation
              </button>
            </div>
          </div>
          <CampusMap height="h-[360px]" highlightLocation="Academic Block A" />
        </div>
      </div>
    </AppShell>
  );
}
