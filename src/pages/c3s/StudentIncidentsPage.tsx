import React, { useState } from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { StatusBadge } from '@/components/c3s/StatusBadge';
import { Plus, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';
import type { IncidentCategory, IncidentPriority } from '@/lib/mock-data/incidents';

export default function StudentIncidentsPage() {
  const navigate = useNavigate();
  const { incidents, createIncident } = useC3SStore();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<IncidentCategory>('Medical Emergency');
  const [priority, setPriority] = useState<IncidentPriority>('CRITICAL');
  const [location, setLocation] = useState('Academic Block A, 2nd Floor');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createIncident({
      title,
      type,
      priority,
      location,
      zone: 'Academic Zone',
      reportedBy: 'Naman Lakhotia',
      reportedById: 'BTCS2026-0842',
      reporterPhone: '+91 98765 43210',
      status: 'ALERT SENT',
      distanceMeters: 250,
      latitude: 26.2183,
      longitude: 78.1828
    });
    setShowModal(false);
    setTitle('');
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">CAMPUS INCIDENTS</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Report safety concerns, medical events, or security hazards.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-rose-500 transition-colors"
          >
            <Plus className="h-4 w-4" /> Report New Incident
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {incidents.map((inc) => (
            <div key={inc.id} className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 backdrop-blur-md shadow-xs dark:shadow-none transition-colors">
              <div>
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs font-bold text-blue-400">{inc.id}</span>
                  <StatusBadge status={inc.status} />
                </div>
                <h3 className="mt-2 text-base font-bold text-slate-100">{inc.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{inc.location}</p>
              </div>

              <div className="mt-4 border-t border-slate-800 pt-3">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2.5">
                  <span>Priority: <strong className="text-rose-400">{inc.priority}</strong></span>
                  <span>{inc.reportedAt}</span>
                </div>
                <button
                  onClick={() => navigate(`/map?incident=${encodeURIComponent(inc.id)}`)}
                  className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-cyan-600/15 hover:bg-cyan-600/25 border border-cyan-500/30 py-2 text-xs font-bold text-cyan-300 transition-colors"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  <span>Navigate to Incident Location</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white">Report Campus Incident</h3>
              <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold">Incident Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Broken Glass / Water Leakage"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as IncidentCategory)}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200"
                  >
                    <option value="Medical Emergency">Medical Emergency</option>
                    <option value="Physical Hazard">Physical Hazard</option>
                    <option value="Suspicious Activity">Suspicious Activity</option>
                    <option value="Infrastructure Issue">Infrastructure Issue</option>
                    <option value="Fire Alarm">Fire Alarm</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as IncidentPriority)}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold">Location Description</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-rose-600 px-5 py-2 font-bold text-white hover:bg-rose-500"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
