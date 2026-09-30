import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { StatCard } from '@/components/c3s/StatCard';
import { MOCK_ANALYTICS } from '@/lib/mock-data/analytics';
import { Users, DoorOpen, Camera, ShieldAlert, BarChart3, FileText, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { gates, cameras, incidents } = useC3SStore();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-slate-100 uppercase">SYSTEM ADMINISTRATOR</h1>
          <p className="text-xs text-slate-400">Campus security configuration, user management, and compliance auditing.</p>
        </div>

        {/* 6 Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard title="Total Users" value="12,450" icon={Users} variant="primary" />
          <StatCard title="Active Incidents" value={incidents.filter(i => i.status !== 'RESOLVED').length} icon={ShieldAlert} variant="critical" />
          <StatCard title="Online Cameras" value={`${cameras.filter(c => c.status === 'ONLINE').length}/12`} icon={Camera} variant="success" />
          <StatCard title="Active Gate QR" value="3/3" icon={DoorOpen} variant="success" />
          <StatCard title="Campus Occupancy" value={MOCK_ANALYTICS.totalOccupancy.toLocaleString()} icon={BarChart3} variant="default" />
          <StatCard title="Security Units" value="5 Units" icon={CheckCircle2} variant="default" />
        </div>

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div onClick={() => navigate('/admin/users')} className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-blue-500 transition-all">
            <Users className="h-6 w-6 text-blue-400" />
            <h3 className="mt-3 font-bold text-white">User Management</h3>
            <p className="text-xs text-slate-400 mt-1">Manage 10 role categories and permissions.</p>
          </div>

          <div onClick={() => navigate('/admin/gates')} className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-blue-500 transition-all">
            <DoorOpen className="h-6 w-6 text-emerald-400" />
            <h3 className="mt-3 font-bold text-white">Gate Management</h3>
            <p className="text-xs text-slate-400 mt-1">Manage Jubilee, Main & Parking Gate credentials.</p>
          </div>

          <div onClick={() => navigate('/admin/analytics')} className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-blue-500 transition-all">
            <BarChart3 className="h-6 w-6 text-teal-400" />
            <h3 className="mt-3 font-bold text-white">Security Analytics</h3>
            <p className="text-xs text-slate-400 mt-1">Hourly traffic, response times, and incident charts.</p>
          </div>

          <div onClick={() => navigate('/admin/audit')} className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-blue-500 transition-all">
            <FileText className="h-6 w-6 text-amber-400" />
            <h3 className="mt-3 font-bold text-white">Audit Trail</h3>
            <p className="text-xs text-slate-400 mt-1">Inspect immutable security action logs.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}