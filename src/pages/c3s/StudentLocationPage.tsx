// src/pages/c3s/StudentLocationPage.tsx
import React, { useState } from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { CampusMap } from '@/components/c3s/CampusMap';
import { StatusBadge } from '@/components/c3s/StatusBadge';
import { MapPin } from 'lucide-react';
import { useC3SStore } from '@/store/c3sStore';

export default function StudentLocationPage() {
  const { gpsPermission, isLocationActive, latitude, longitude, gpsAccuracy, requestGpsPermission } = useC3SStore();
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
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">MY LOCATION</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Device geofence status and high-precision campus navigation.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPermissionModal(true)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs cursor-pointer"
            >
              Configure GPS Permission
            </button>
          </div>
        </div>

        {/* Location Telemetry Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-xs dark:shadow-none transition-colors">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Status</p>
            <div className="mt-2">
              <StatusBadge status={isLocationActive ? 'ACTIVE' : 'OFFLINE'} pulse={isLocationActive} size="md" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-xs dark:shadow-none transition-colors">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Latitude</p>
            <p className="mt-1 font-mono text-lg font-bold text-slate-900 dark:text-slate-100">{latitude}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-xs dark:shadow-none transition-colors">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Longitude</p>
            <p className="mt-1 font-mono text-lg font-bold text-slate-900 dark:text-slate-100">{longitude}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-xs dark:shadow-none transition-colors">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Accuracy</p>
            <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">±{gpsAccuracy}m</p>
          </div>
        </div>

        {/* Campus Map View */}
        <div className="space-y-3">
          <CampusMap height="h-[520px]" highlightLocation="Academic Block A" />
          <p className="text-[11px] text-slate-500 text-center">
            * Live device GPS synchronized with campus geofence coordinates and automatic entrance calibration.
          </p>
        </div>

        {/* GPS Permission Modal Simulation */}
        {showPermissionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 text-center shadow-2xl text-slate-900 dark:text-slate-100">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                <MapPin className="h-7 w-7 animate-bounce" />
              </div>

              <h3 className="mt-4 text-xl font-black text-slate-900 dark:text-slate-100 uppercase">CAMPUS LOCATION REQUIRED</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                C3S uses device location for campus safety and rapid emergency response during active check-in.
              </p>

              <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 p-3 text-xs font-semibold text-slate-800 dark:text-slate-200">
                📍 Device Location (High Accuracy ±8m)
              </div>

              <div className="mt-6 space-y-2.5">
                <button
                  onClick={handleEnableLocation}
                  className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-95 cursor-pointer transition-colors"
                >
                  [ ENABLE LOCATION ]
                </button>
                <button
                  onClick={() => setShowPermissionModal(false)}
                  className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer transition-colors"
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
