import React from 'react';
import { SkipForward, RotateCcw, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { useC3SStore } from '@/store/c3sStore';
import { useNavigate } from 'react-router-dom';

const DEMO_STEPS = [
  { step: 0, label: 'Login', role: 'STUDENT', path: '/login', desc: 'Login as Student' },
  { step: 1, label: 'Student Dashboard', role: 'STUDENT', path: '/student', desc: 'View inside status & quick actions' },
  { step: 2, label: 'Scan Gate QR', role: 'STUDENT', path: '/student/scan', desc: 'Scan gate QR scanner view' },
  { step: 3, label: 'Confirm Check-In', role: 'STUDENT', path: '/student/check-in', desc: 'Verify Main Gate token & check-in' },
  { step: 4, label: 'GPS Permission', role: 'STUDENT', path: '/student/location', desc: 'Simulate campus location prompt' },
  { step: 5, label: 'Location Active', role: 'STUDENT', path: '/student/location', desc: 'View 📍 YOU on interactive campus map' },
  { step: 6, label: 'Trigger SOS', role: 'STUDENT', path: '/student/sos', desc: 'Press & hold SOS emergency activation' },
  { step: 7, label: 'Control Room Alert', role: 'CONTROL_ROOM_OPERATOR', path: '/control-room', desc: 'SOC detects critical SOS alarm' },
  { step: 8, label: 'Guard Dispatch', role: 'SECURITY_GUARD', path: '/security/incidents/C3S-INC-00192', desc: 'Guard 02 accepts & goes EN ROUTE' },
  { step: 9, label: 'Guard Arrived', role: 'SECURITY_GUARD', path: '/security/incidents/C3S-INC-00192', desc: 'Guard arrives on scene' },
  { step: 10, label: 'Resolve Incident', role: 'CONTROL_ROOM_OPERATOR', path: '/control-room/incidents', desc: 'Incident resolved & logged' },
  { step: 11, label: 'Scan Check-Out', role: 'STUDENT', path: '/student/scan', desc: 'Scan QR at Jubilee Gate to exit' },
  { step: 12, label: 'Confirm Check-Out', role: 'STUDENT', path: '/student/check-out', desc: 'Marked OUTSIDE campus, GPS ends' },
  { step: 13, label: 'Gate Keeper Flow', role: 'GATE_KEEPER', path: '/gate-keeper/qr', desc: 'Daily gate QR display & activity' }
];

export const DemoStepperBar: React.FC = () => {
  const { demoStep, setDemoStep, resetAllDemoData, isDemoGuideOpen, toggleDemoGuide, setRole } = useC3SStore();
  const navigate = useNavigate();

  const current = DEMO_STEPS[demoStep] || DEMO_STEPS[0];

  const handleNext = () => {
    const nextIdx = (demoStep + 1) % DEMO_STEPS.length;
    setDemoStep(nextIdx);
    const nextStep = DEMO_STEPS[nextIdx];
    setRole(nextStep.role as any);
    navigate(nextStep.path);
  };

  const handleJump = (idx: number) => {
    setDemoStep(idx);
    const step = DEMO_STEPS[idx];
    setRole(step.role as any);
    navigate(step.path);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-blue-500/30 bg-[#070b16]/95 backdrop-blur-xl shadow-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/40">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">GUIDED DEMO WORKFLOW</span>
              <span className="rounded bg-slate-800 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-slate-300">
                Step {demoStep + 1} of {DEMO_STEPS.length}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-200">
              {current.label} <span className="font-normal text-slate-400">({current.desc})</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-95"
          >
            Next Step <SkipForward className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => resetAllDemoData()}
            title="Reset to default demo data"
            className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={toggleDemoGuide}
            className="hidden sm:flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-2.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            {isDemoGuideOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {isDemoGuideOpen && (
        <div className="hidden md:flex border-t border-slate-800/80 bg-slate-950/80 px-4 py-2 overflow-x-auto">
          <div className="mx-auto flex max-w-7xl items-center gap-2 text-[11px]">
            {DEMO_STEPS.map((s, idx) => (
              <button
                key={s.step}
                onClick={() => handleJump(idx)}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1 font-medium transition-all ${
                  demoStep === idx
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : demoStep > idx
                    ? 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {demoStep > idx && '✓ '}
                {idx + 1}. {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};