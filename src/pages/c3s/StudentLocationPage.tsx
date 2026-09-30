import React, { useState } from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { CampusMap } from '@/components/c3s/CampusMap';
import { StatusBadge } from '@/components/c3s/StatusBadge';
import { MapPin, Navigation, Shield, Compass, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useC3SStore } from '@/store/c3sStore';

export default function StudentLocationPage() {
  const { gpsPermission, isLocationActive, latitude, longitude, gpsAccuracy, lastLocationUpdate, requestGpsPermission } = useC3SStore();
  const [showPermissionModal, setShowPermissionModal] = useState(gpsPermission !== 'granted');

  const handleEnableLocation = () => {
    requestGpsPermission();
    setShowPermissionModal(false);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-100">MY LOCATION</h1>
            <p className="text-xs text-slate-400">Device geofence status and high-precision tactical campus navigation.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPermissionModal(true)}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Configure GPS Permission
            </button>
          </div>
        </div>

        {/* Location Telemetry Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase">Status</p>
            <div className="mt-2">
              <StatusBadge status={isLocationActive ? 'ACTIVE' : 'OFFLINE'} pulse={isLocationActive} size="md" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase">Latitude</p>
            <p className="mt-1 font-mono text-lg font-bold text-slate-100">{latitude}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase">Longitude</p>
            <p className="mt-1 font-mono text-lg font-bold text-slate-100">{longitude}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase">Accuracy</p>
            <p className="mt-1 text-lg font-bold text-emerald-400">±{gpsAccuracy}m</p>
          </div>
        </div>

        {/* Campus Map View */}
        <div className="space-y-3">
          <CampusMap height="h-[520px]" highlightLocation="Academic Block A" />
          <p className="text-[11px] text-slate-500 text-center">
            * Clearly marked Demo Location. Simulated GPS coordinates inside MITS Gwalior campus boundaries.
          </p>
        </div>

        {/* GPS Permission Modal Simulation */}
        {showPermissionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 text-center shadow-2xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <MapPin className="h-7 w-7 animate-bounce" />
              </div>

              <h3 className="mt-4 text-xl font-black text-slate-100 uppercase">CAMPUS LOCATION REQUIRED</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                C3S uses device location for campus safety and rapid emergency response during active check-in.
              </p>

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs font-semibold text-slate-200">
                📍 Device Location (High Accuracy ±8m)
              </div>

              <div className="mt-6 space-y-2.5">
                <button
                  onClick={handleEnableLocation}
                  className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-95"
                >
                  [ ENABLE LOCATION ]
                </button>
                <button
                  onClick={() => setShowPermissionModal(false)}
                  className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Continue without location
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}