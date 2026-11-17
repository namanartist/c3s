/**
 * src/pages/c3s/GateKeeperDashboard.tsx
 *
 * Redesigned gate terminal.
 *
 * Workflow improvements over the original:
 * - **The boom barrier state is persisted.** It lived in component state, so
 *   reloading the page silently re-opened a locked barrier. It now lives in
 *   the Zustand store and is written to local storage.
 * - **Manual check-in failures are surfaced.** `recordGateMovement` was
 *   fire-and-forget: the success message was shown even when the database
 *   write failed. The write is now awaited and errors are reported.
 * - **The success state is readable.** It auto-closed after 1.5 s, which was
 *   too fast to read; it now stays until it is dismissed.
 * - The manual-entry modal has Escape handling, an accessible dialog role and
 *   a Lucide icon instead of a raw glyph.
 */
import React, { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { PageHeader } from '@/components/c3s/PageHeader';
import { StatCard } from '@/components/c3s/StatCard';
import { GateQRDisplay } from '@/components/c3s/GateQRDisplay';
import { DataTable, type Column } from '@/components/c3s/DataTable';
import { StatusBadge } from '@/components/c3s/StatusBadge';
import {
  DoorOpen,
  ArrowRight,
  Users,
  ShieldCheck,
  QrCode,
  Lock,
  Unlock,
  UserCheck,
  CheckCircle2,
  ChevronDown,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';
import type { C3SMovementLog } from '@/lib/mock-data/movement';
import { recordGateMovement } from '@/lib/api';

export default function GateKeeperDashboard() {
  const navigate = useNavigate();
  const gates = useC3SStore((state) => state.gates);
  const selectedGateId = useC3SStore((state) => state.selectedGateId);
  const setSelectedGateId = useC3SStore((state) => state.setSelectedGateId);
  const movementLogs = useC3SStore((state) => state.movementLogs);
  const addMovementLog = useC3SStore((state) => state.addMovementLog);
  const barrierStates = useC3SStore((state) => state.barrierStates);
  const toggleBarrierState = useC3SStore((state) => state.toggleBarrierState);

  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualUniId, setManualUniId] = useState('');
  const [manualAction, setManualAction] = useState<'CHECK-IN' | 'CHECK-OUT'>('CHECK-IN');
  const [manualSuccessMsg, setManualSuccessMsg] = useState<string | null>(null);
  const [manualErrorMsg, setManualErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const defaultGate = {
    id: 'gate-01',
    name: 'Gate 1 - Main Campus Gate',
    code: 'G1-MAIN',
    status: 'ACTIVE' as const,
    currentGateKeeper: 'Ramesh Singh',
    keeperId: 'GK-01',
    checkInCount: 1420,
    checkOutCount: 980,
    currentlyInside: 3480,
    activeAlerts: 0,
    qrStatus: 'ACTIVE' as const,
    qrToken: 'TOKEN_G1_20261104',
  };

  const currentGate = gates.find((gate) => gate.id === selectedGateId) ?? gates[0] ?? defaultGate;
  const barrierState = barrierStates[currentGate.id] ?? 'OPEN';

  // Escape closes the manual-entry modal.
  useEffect(() => {
    if (!manualModalOpen) return undefined;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setManualModalOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [manualModalOpen]);

  const handleManualSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!manualName || !manualUniId || isSaving) return;

    setIsSaving(true);
    setManualErrorMsg(null);

    const newLog: C3SMovementLog = {
      id: `mov-${Date.now()}`,
      personName: manualName,
      universityId: manualUniId,
      role: 'Student',
      department: 'Manual Guard Override',
      movement: manualAction,
      gate: currentGate.name,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: 'Today',
      verificationMethod: 'MANUAL_OVERRIDE',
      status: 'VERIFIED',
    };

    try {
      // Await the persistence so that a failure is visible to the operator
      // instead of being swallowed.
      await recordGateMovement({
        userName: manualName,
        userId: manualUniId,
        userRole: 'Student',
        department: 'Manual Guard Override',
        movement: manualAction,
        gateName: currentGate.name,
        method: 'MANUAL_OVERRIDE',
      });
      addMovementLog(newLog);
      setManualSuccessMsg(`Logged ${manualAction} for ${manualName} (${manualUniId})`);
      setManualName('');
      setManualUniId('');
    } catch (error) {
      console.error('Manual gate movement failed:', error);
      setManualErrorMsg(
        'The entry could not be written to the gate ledger. Please retry, or log it manually in the ledger.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const columns: Column<C3SMovementLog>[] = [
    {
      header: 'Person / Student',
      accessorKey: 'personName',
      cell: (row) => (
        <div>
          <strong className="block text-slate-900 dark:text-white">{row.personName}</strong>
          <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
            {row.department || 'Student'}
          </span>
        </div>
      ),
    },
    {
      header: 'University ID',
      accessorKey: 'universityId',
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
          {row.universityId}
        </span>
      ),
    },
    {
      header: 'Movement',
      accessorKey: 'movement',
      cell: (row) => (
        <StatusBadge
          status={row.movement}
          tone={row.movement === 'CHECK-IN' ? 'success' : 'info'}
          size="sm"
        />
      ),
    },
    {
      header: 'Time',
      accessorKey: 'time',
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{row.time}</span>
      ),
    },
    {
      header: 'Gate',
      accessorKey: 'gate',
      cell: (row) => (
        <span className="font-medium text-slate-600 dark:text-slate-400">{row.gate}</span>
      ),
    },
    {
      header: 'Verification',
      accessorKey: 'status',
      cell: (row) => (
        <StatusBadge
          status={row.status || 'VERIFIED'}
          tone={row.verificationMethod === 'MANUAL_OVERRIDE' ? 'warning' : 'success'}
          size="sm"
        />
      ),
    },
  ];

  return (
    <AppShell>
      <div className="space-y-5 sm:space-y-6">
        <PageHeader
          eyebrow={`Gate terminal active · ${currentGate.id}`}
          statusTone={barrierState === 'OPEN' ? 'success' : 'danger'}
          title={currentGate.name}
          subtitle={`Assigned gate keeper: ${currentGate.currentGateKeeper} (${currentGate.keeperId})`}
          breadcrumbs={[
            { label: 'C3S', to: '/gate-keeper' },
            { label: 'Gate Terminal' },
          ]}
          meta={
            <StatusBadge
              status={`Barrier ${barrierState}`}
              tone={barrierState === 'OPEN' ? 'success' : 'danger'}
              size="md"
            />
          }
          actions={
            <>
              {/* Direct Gate Switcher */}
              <div className="relative">
                <label htmlFor="gate-switcher" className="sr-only">
                  Select gate terminal
                </label>
                <select
                  id="gate-switcher"
                  value={currentGate.id}
                  onChange={(event) => setSelectedGateId(event.target.value)}
                  className="cursor-pointer appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-3.5 pr-8 text-xs font-bold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
                >
                  {gates.map((gate) => (
                    <option key={gate.id} value={gate.id}>
                      {gate.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setManualErrorMsg(null);
                  setManualSuccessMsg(null);
                  setManualModalOpen(true);
                }}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-50 px-3.5 py-2.5 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 dark:bg-blue-500/15 dark:text-blue-300 dark:hover:bg-blue-500/25"
              >
                <UserCheck className="h-4 w-4" aria-hidden="true" />
                <span>Manual check-in</span>
              </button>

              <button
                type="button"
                onClick={() => toggleBarrierState(currentGate.id)}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-bold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 ${
                  barrierState === 'OPEN'
                    ? 'border-amber-500/40 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300'
                    : 'border-emerald-500/40 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300'
                }`}
              >
                {barrierState === 'OPEN' ? (
                  <Lock className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Unlock className="h-4 w-4" aria-hidden="true" />
                )}
                <span>{barrierState === 'OPEN' ? 'Lock barrier' : 'Release barrier'}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/gate-keeper/qr')}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
              >
                <QrCode className="h-4 w-4" aria-hidden="true" />
                <span>Fullscreen QR</span>
              </button>
            </>
          }
        />

        {/* Gate metrics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            title="Today's Check-In"
            value={currentGate.checkInCount}
            subtitle="Verified campus entries"
            icon={DoorOpen}
            variant="success"
          />
          <StatCard
            title="Today's Check-Out"
            value={currentGate.checkOutCount}
            subtitle="Recorded exits"
            icon={DoorOpen}
            variant="primary"
          />
          <StatCard
            title="Currently Inside"
            value={currentGate.currentlyInside}
            subtitle={`Live count via ${currentGate.code || currentGate.name}`}
            icon={Users}
            variant="neutral"
          />
          <StatCard
            title="Active Gate Alerts"
            value={currentGate.activeAlerts}
            subtitle="Security perimeter notifications"
            icon={AlertTriangle}
            variant={currentGate.activeAlerts > 0 ? 'danger' : 'neutral'}
          />
        </div>

        {/* Gate QR + live activity */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <GateQRDisplay />
          </div>

          <div className="space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 sm:text-sm dark:text-white">
                  Live gate activity stream
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/gate-keeper/activity')}
                className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
              >
                <span>Full ledger</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            <DataTable
              columns={columns}
              data={movementLogs}
              caption="Live gate activity stream"
              emptyMessage="No gate movements recorded"
              emptyDescription="Scanned QR passes and manual overrides will appear here as they happen."
              pageSize={7}
              rowKey={(row) => row.id}
            />
          </div>
        </div>

        {/* Manual check-in modal */}
        {manualModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <button
              type="button"
              aria-label="Close manual verification dialog"
              className="absolute inset-0 cursor-default"
              onClick={() => setManualModalOpen(false)}
            />
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="manual-gate-title"
              className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#111A2E]"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-white/[0.08]">
                <h3
                  id="manual-gate-title"
                  className="flex items-center gap-2 text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white"
                >
                  <UserCheck className="h-5 w-5 text-blue-600" aria-hidden="true" />
                  <span>Manual gate verification</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 dark:hover:bg-white/[0.06]"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {manualSuccessMsg ? (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="flex-1">{manualSuccessMsg}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setManualSuccessMsg(null);
                      setManualModalOpen(false);
                    }}
                    className="shrink-0 underline"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleManualSubmit} className="mt-4 space-y-4">
                  {manualErrorMsg && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                    >
                      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{manualErrorMsg}</span>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="manual-name"
                      className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                    >
                      Student / staff name
                    </label>
                    <input
                      id="manual-name"
                      type="text"
                      required
                      value={manualName}
                      onChange={(event) => setManualName(event.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="manual-id"
                      className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                    >
                      University ID / roll number
                    </label>
                    <input
                      id="manual-id"
                      type="text"
                      required
                      value={manualUniId}
                      onChange={(event) => setManualUniId(event.target.value)}
                      placeholder="e.g. 0901CS221045"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                    />
                  </div>

                  <fieldset>
                    <legend className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Movement direction
                    </legend>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setManualAction('CHECK-IN')}
                        aria-pressed={manualAction === 'CHECK-IN'}
                        className={`rounded-xl border py-2 text-xs font-bold transition ${
                          manualAction === 'CHECK-IN'
                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                            : 'border-transparent bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-slate-300'
                        }`}
                      >
                        Check-in (entry)
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualAction('CHECK-OUT')}
                        aria-pressed={manualAction === 'CHECK-OUT'}
                        className={`rounded-xl border py-2 text-xs font-bold transition ${
                          manualAction === 'CHECK-OUT'
                            ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                            : 'border-transparent bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-slate-300'
                        }`}
                      >
                        Check-out (exit)
                      </button>
                    </div>
                  </fieldset>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setManualModalOpen(false)}
                      className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="cursor-pointer rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaving ? 'Saving…' : 'Confirm log'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
