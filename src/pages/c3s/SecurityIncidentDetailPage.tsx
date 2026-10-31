// src/pages/c3s/SecurityIncidentDetailPage.tsx
import React, { useState } from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { StatusBadge } from '@/components/c3s/StatusBadge';
import { IncidentTimeline } from '@/components/c3s/IncidentTimeline';
import { CampusMap } from '@/components/c3s/CampusMap';
import { useParams, useNavigate } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';
import { ArrowLeft, Navigation } from 'lucide-react';

export default function SecurityIncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { incidents, advanceIncidentStatus, resolveIncident, addIncidentNote, assignGuardToIncident } = useC3SStore();
  const [noteInput, setNoteInput] = useState('');

  const incident = incidents.find((i) => i.id === id) || incidents[0];

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    addIncidentNote(incident.id, noteInput.trim());
    setNoteInput('');
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/security/incidents')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Incidents
        </button>

        {/* Top Header Card */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-xs dark:shadow-2xl transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-black text-rose-600 dark:text-rose-400">{incident.id}</span>
                <span className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">{incident.priority}</span>
              </div>
              <h1 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{incident.title}</h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Type: {incident.type} • Reported: {incident.reportedAt}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/map?incident=${encodeURIComponent(incident.id)}`)}
                className="flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2.5 text-xs font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Navigation className="h-4 w-4" />
                <span>Navigate to Incident</span>
              </button>
              <StatusBadge status={incident.status} size="lg" pulse />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 transition-colors">
              <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Location</span>
              <p className="mt-1 font-bold text-slate-900 dark:text-slate-200">{incident.location}</p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">Zone: {incident.zone}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 transition-colors">
              <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Reported By</span>
              <p className="mt-1 font-bold text-slate-900 dark:text-slate-200">{incident.reportedBy}</p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">Phone: {incident.reporterPhone}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 transition-colors">
              <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Assigned Responder</span>
              <p className="mt-1 font-bold text-blue-600 dark:text-blue-400">{incident.assignedResponder || 'Unassigned'}</p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">Estimated Arrival: 2 mins</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-5">
            <button
              onClick={() => assignGuardToIncident(incident.id, 'Guard 02 (Vikram Rathore)')}
              className="rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-bold text-white shadow-md active:scale-95 cursor-pointer transition-colors"
            >
              [ Assign Guard 02 ]
            </button>
            <button
              onClick={() => advanceIncidentStatus(incident.id)}
              className="rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-md active:scale-95 cursor-pointer transition-colors"
            >
              [ Advance Status: {incident.status} ]
            </button>
            <button
              onClick={() => resolveIncident(incident.id)}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-md active:scale-95 cursor-pointer transition-colors"
            >
              [ Resolve Incident ]
            </button>
          </div>
        </div>

        {/* Timeline & Map Split */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Timeline */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-md shadow-xs dark:shadow-none transition-colors">
            <h2 className="mb-4 text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Incident Response Timeline</h2>
            <IncidentTimeline timeline={incident.timeline} />

            {/* Notes Section */}
            <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-5">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Operational Notes</h3>
              <div className="mt-2 space-y-1.5">
                {incident.notes?.map((n, i) => (
                  <p key={i} className="rounded-lg bg-slate-50 dark:bg-slate-950/70 p-2 text-xs text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                    • {n}
                  </p>
                ))}
              </div>

              <form onSubmit={handleAddNote} className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Add responder note..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
                />
                <button type="submit" className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-4 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer transition-colors">
                  Add
                </button>
              </form>
            </div>
          </div>

          {/* Tactical Map */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-md space-y-3 shadow-xs dark:shadow-none transition-colors">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Incident Location Map</h2>
            <CampusMap height="h-[380px]" highlightLocation="Academic Block A" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
