// src/components/safety/SafetyAnalyticsDashboard.tsx
import { useState } from 'react';
import {
  BarChart3,
  TrendingDown,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Download,
  Flame,
  ShieldAlert,
  HeartPulse,
  Wrench,
  Layers,
  Sparkles
} from 'lucide-react';
import { useSafetyStore } from '@/store/safetyStore';

export function SafetyAnalyticsDashboard() {
  const incidents = useSafetyStore((s) => s.incidents);
  const [filterPeriod, setFilterPeriod] = useState<'day' | 'week' | 'month'>('month');

  const totalIncidents = incidents.length;
  const resolvedCount = incidents.filter((i) => i.status === 'resolved').length;
  const activeCount = totalIncidents - resolvedCount;
  const resolutionRate = totalIncidents > 0 ? Math.round((resolvedCount / totalIncidents) * 100) : 100;

  const categoryCounts = {
    medical: incidents.filter((i) => i.category === 'medical').length,
    security: incidents.filter((i) => i.category === 'security').length,
    fire: incidents.filter((i) => i.category === 'fire').length,
    infrastructure: incidents.filter((i) => i.category === 'infrastructure').length,
  };

  const handleExportData = () => {
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(incidents, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonStr);
    downloadAnchor.setAttribute('download', `C3S_Safety_Audit_Report_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-neutral-950/95 backdrop-blur-2xl text-white select-none overflow-y-auto pt-20 pb-12 px-6 lg:px-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">
                C3S CAMPUS SAFETY INTELLIGENCE & ANALYTICS
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                Audit metrics, emergency response time analysis & campus surveillance coverage index
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex items-center p-1 bg-neutral-900 border border-white/10 rounded-xl text-xs font-mono">
            {(['day', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setFilterPeriod(p)}
                className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                  filterPeriod === p ? 'bg-blue-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportData}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-white/15 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Log</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {/* Card 1: Mean Response Time */}
        <div className="p-5 rounded-3xl bg-neutral-900/90 border border-white/10 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400 font-bold uppercase tracking-wider">
              Mean Response Time
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">2.1</span>
              <span className="text-sm font-bold text-neutral-400">minutes</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 mt-2">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>18% faster than benchmark</span>
            </div>
          </div>
        </div>

        {/* Card 2: Safe Campus Rating */}
        <div className="p-5 rounded-3xl bg-neutral-900/90 border border-white/10 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400 font-bold uppercase tracking-wider">
              Campus Safety Index
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-400">98.6%</span>
              <span className="text-sm font-bold text-neutral-400">Grade A+</span>
            </div>
            <p className="text-xs text-neutral-400 mt-2">
              Across all 4 perimeter gates & academic blocks
            </p>
          </div>
        </div>

        {/* Card 3: Incident Resolution Rate */}
        <div className="p-5 rounded-3xl bg-neutral-900/90 border border-white/10 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400 font-bold uppercase tracking-wider">
              Resolution Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{resolutionRate}%</span>
              <span className="text-sm font-bold text-neutral-400">
                ({resolvedCount}/{totalIncidents})
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-2">
              {activeCount} incident currently responding
            </p>
          </div>
        </div>

        {/* Card 4: CCTV & Corridor Coverage */}
        <div className="p-5 rounded-3xl bg-neutral-900/90 border border-white/10 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400 font-bold uppercase tracking-wider">
              Corridor CCTV Coverage
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-orange-400">98.4%</span>
              <span className="text-sm font-bold text-neutral-400">Coverage</span>
            </div>
            <p className="text-xs text-neutral-400 mt-2">
              Zero blindspots along primary pedestrian paths
            </p>
          </div>
        </div>
      </div>

      {/* Deep Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Category Breakdown */}
        <div className="p-6 rounded-3xl bg-neutral-900/90 border border-white/10 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            Incident Breakdown by Category
          </h3>

          <div className="space-y-3.5 pt-2">
            {[
              { label: 'Medical Assistance', count: categoryCounts.medical, icon: HeartPulse, color: 'text-rose-400', bar: 'bg-rose-500' },
              { label: 'Security & Parking', count: categoryCounts.security, icon: ShieldAlert, color: 'text-amber-400', bar: 'bg-amber-500' },
              { label: 'Critical Infrastructure', count: categoryCounts.infrastructure, icon: Wrench, color: 'text-blue-400', bar: 'bg-blue-500' },
              { label: 'Fire & Chemical Hazard', count: categoryCounts.fire, icon: Flame, color: 'text-orange-400', bar: 'bg-orange-500' },
            ].map((cat) => {
              const Icon = cat.icon;
              const pct = totalIncidents > 0 ? Math.round((cat.count / totalIncidents) * 100) : 25;

              return (
                <div key={cat.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold flex items-center gap-1.5 ${cat.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {cat.label}
                    </span>
                    <span className="font-mono text-neutral-400">
                      {cat.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className={`h-full rounded-full ${cat.bar}`} style={{ width: `${Math.max(pct, 5)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Campus Zone Safety Health */}
        <div className="p-6 rounded-3xl bg-neutral-900/90 border border-white/10 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            Campus Quadrant Safety Index
          </h3>

          <div className="space-y-3 pt-2">
            {[
              { zone: 'Academic Block Core (Main GF, FF, SF)', score: '99.1%', status: 'Optimal', color: 'text-emerald-400' },
              { zone: 'Main Gate 1 & East Perimeter Corridor', score: '98.8%', status: 'Optimal', color: 'text-emerald-400' },
              { zone: 'New Gate Parking & Transit Hub', score: '97.2%', status: 'Active Watch', color: 'text-amber-400' },
              { zone: 'Jubilee Gate & Hostel Lawns Axis', score: '98.5%', status: 'Optimal', color: 'text-emerald-400' },
              { zone: 'Mechanical Workshops & Heavy Labs', score: '96.8%', status: 'Monitored', color: 'text-blue-400' },
            ].map((z) => (
              <div key={z.zone} className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white leading-tight">{z.zone}</p>
                  <p className={`text-[10px] font-mono mt-0.5 ${z.color}`}>{z.status}</p>
                </div>
                <span className="text-sm font-mono font-black text-white">{z.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Recommendations */}
        <div className="p-6 rounded-3xl bg-neutral-900/90 border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              AI Surveillance Insights
            </h3>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-xs space-y-1">
              <span className="font-bold text-blue-300">Peak Transit Patrol Advisory</span>
              <p className="text-neutral-300 text-[11px] leading-relaxed">
                Heightened student foot traffic predicted around New Gate Parking between 17:00 and 18:30 IST. Recommend positioning QRF Rover Alpha nearby.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-1">
              <span className="font-bold text-emerald-300">Safe Corridor Certification</span>
              <p className="text-neutral-300 text-[11px] leading-relaxed">
                All 76 nodes along Campus_Map outer ring road verified 100% operational lighting and under continuous CCTV observation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
