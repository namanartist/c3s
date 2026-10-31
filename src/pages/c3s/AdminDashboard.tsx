// src/pages/c3s/AdminDashboard.tsx
import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { StatCard } from '@/components/c3s/StatCard';
import { MOCK_ANALYTICS } from '@/lib/mock-data/analytics';
import {
  Users,
  DoorOpen,
  Camera,
  ShieldAlert,
  BarChart3,
  FileText,
  CheckCircle2,
  Sliders,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { gates, cameras, incidents } = useC3SStore();

  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED');
  const onlineCameras = cameras.filter((c) => c.status === 'ONLINE');

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/[0.08] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 dark:bg-white/[0.08] dark:text-slate-300 border border-slate-200 dark:border-white/10 uppercase tracking-wider">
                <Sliders className="h-3 w-3 text-blue-500" />
                SUPER ADMIN ROOT CONTROL
              </span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              SYSTEM ADMINISTRATION &amp; AUDIT
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Campus security network configuration, RBAC permissions &amp; cryptographic audit trail
            </p>
          </div>
        </div>

        {/* 6 Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard title="Total Users" value="12,450" icon={Users} variant="primary" />
          <StatCard
            title="Active Incidents"
            value={activeIncidents.length}
            icon={ShieldAlert}
            variant={activeIncidents.length > 0 ? 'critical' : 'default'}
          />
          <StatCard
            title="Online Cameras"
            value={`${onlineCameras.length}/${cameras.length}`}
            icon={Camera}
            variant="success"
          />
          <StatCard title="Active Gate QR" value="3/3" icon={DoorOpen} variant="success" />
          <StatCard
            title="Campus Occupancy"
            value={MOCK_ANALYTICS.totalOccupancy.toLocaleString()}
            icon={BarChart3}
            variant="default"
          />
          <StatCard title="Security QRF" value="5 Units" icon={CheckCircle2} variant="default" />
        </div>

        {/* Admin Navigation Bento Tiles */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div
            onClick={() => navigate('/admin/users')}
            className="group cursor-pointer rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-900/80 p-6 backdrop-blur-xl shadow-xs dark:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-lg dark:hover:shadow-blue-950/30 flex flex-col justify-between"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                User Directory &amp; RBAC
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Configure students, proctors, gate keepers, faculty wardens, and guard accounts.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              <span>Manage Accounts</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/gates')}
            className="group cursor-pointer rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-900/80 p-6 backdrop-blur-xl shadow-xs dark:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-lg dark:hover:shadow-emerald-950/30 flex flex-col justify-between"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                <DoorOpen className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Three-Gate Checkpoints
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Manage Main Gate, Jubilee Gate, and Parking Gate credentials &amp; token seeds.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              <span>Configure Gates</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/analytics')}
            className="group cursor-pointer rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-900/80 p-6 backdrop-blur-xl shadow-xs dark:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-teal-500/50 hover:shadow-lg dark:hover:shadow-teal-950/30 flex flex-col justify-between"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 group-hover:scale-105 transition-transform">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-bold text-base text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                Occupancy &amp; Safety Analytics
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Hourly pedestrian traffic, QRF response latency metrics, and incident heatmaps.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              <span>View Analytics</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/audit')}
            className="group cursor-pointer rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-900/80 p-6 backdrop-blur-xl shadow-xs dark:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-lg dark:hover:shadow-amber-950/30 flex flex-col justify-between"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-bold text-base text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Immutable Audit Trail
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Inspect immutable security logs, SOS broadcasts, gate events, and admin actions.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              <span>Audit Logs</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
