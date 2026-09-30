// src/components/safety/PatrolDispatchDashboard.tsx
import { useState } from 'react';
import {
  ShieldCheck,
  Radio,
  Phone,
  Battery,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { useSafetyStore } from '@/store/safetyStore';
import { useCampusNavigation } from '@/hooks/useCampusNavigation';
import { formatDMS } from '@/lib/geoProjection';

export function PatrolDispatchDashboard() {
  const patrolUnits = useSafetyStore((s) => s.patrolUnits);
  const incidents = useSafetyStore((s) => s.incidents);
  const dispatchPatrolUnit = useSafetyStore((s) => s.dispatchPatrolUnit);

  const { routeToSosIncident, setSelectedMapId } = useCampusNavigation();
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);

  const activeIncidents = incidents.filter((i) => i.status !== 'resolved');

  const handleQuickDispatchToIncident = (unitId: string, inc: typeof incidents[0]) => {
    dispatchPatrolUnit(unitId, `Dispatched to incident: ${inc.title}`);
    setDispatchSuccessMsg(`Unit dispatched to ${inc.title}! Setting navigation route...`);
    setTimeout(() => {
      setDispatchSuccessMsg(null);
      routeToSosIncident(inc);
      if (inc.map) setSelectedMapId(inc.map);
    }, 1000);
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-neutral-950/95 backdrop-blur-2xl text-white select-none overflow-y-auto pt-20 pb-12 px-6 lg:px-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white">
                C3S PATROL FLEET & RAPID DISPATCH (QRF)
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                4 UNITS ON DUTY
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Live location tracking of campus security guards, QRF rovers, and rapid incident deployment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-neutral-900 border border-white/10 text-xs font-mono flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-neutral-300 font-bold">VHF RADIO REPEATER: 146.520 MHz</span>
          </div>
        </div>
      </div>

      {dispatchSuccessMsg && (
        <div className="mt-4 p-3 rounded-2xl bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 text-xs font-black flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{dispatchSuccessMsg}</span>
        </div>
      )}

      {/* Patrol Units Fleet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {patrolUnits.map((unit) => {
          const isDispatched = unit.status === 'dispatched';
          const isPatrolling = unit.status === 'patrolling';

          return (
            <div
              key={unit.id}
              className={`p-5 rounded-3xl border transition-all space-y-4 ${
                isDispatched
                  ? 'bg-gradient-to-b from-blue-950/50 to-neutral-900 border-blue-500/50 ring-1 ring-blue-500/30 shadow-xl'
                  : 'bg-neutral-900/90 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-white shrink-0 font-mono font-black text-sm">
                    {unit.badge.split('-')[2] || '01'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-white">{unit.name}</h3>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isDispatched
                            ? 'bg-blue-500 text-white animate-pulse'
                            : isPatrolling
                            ? 'bg-emerald-500/30 text-emerald-300'
                            : 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        {unit.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">{unit.officer}</p>
                  </div>
                </div>

                {/* Battery & VHF Indicator */}
                <div className="text-right shrink-0 font-mono">
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-bold">
                    <Battery className="w-3.5 h-3.5" />
                    {unit.battery}%
                  </span>
                  <p className="text-[10px] text-neutral-500">{unit.radioChannel.split(' ')[1]}</p>
                </div>
              </div>

              {/* Assignment Banner */}
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-xs space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                  Current Assignment
                </span>
                <p className="text-neutral-200 font-medium">
                  {unit.currentAssignment || 'Standing by for dispatch'}
                </p>
                <div className="pt-1 text-[11px] font-mono text-neutral-500 flex items-center justify-between">
                  <span>{unit.map.replace('_', ' ')}</span>
                  <span>{formatDMS(unit.lat, unit.lng)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`tel:${unit.phone}`}
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Officer</span>
                </a>

                {activeIncidents.length > 0 && (
                  <button
                    onClick={() => handleQuickDispatchToIncident(unit.id, activeIncidents[0])}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span>DISPATCH TO {activeIncidents[0].title.split(' ')[0].toUpperCase()}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
