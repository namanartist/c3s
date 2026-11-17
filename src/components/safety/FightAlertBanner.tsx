// src/components/safety/FightAlertBanner.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Navigation,
  Camera,
  X,
  ExternalLink,
  Clock,
  MapPin,
  UserCheck,
  Download,
  Flame,
  Film,
  Volume2,
  VolumeX,
  CheckCircle2,
  Ban,
  TrendingUp
} from 'lucide-react';
import {
  globalFightDispatcher,
  type ActiveFightAlert
} from '@/lib/fightAlertDispatcher';
import { globalProctorAlarm } from '@/lib/proctorAlarmAudio';
import { useC3SStore } from '@/store/c3sStore';
import { useSafetyStore } from '@/store/safetyStore';

export const FightAlertBanner: React.FC = () => {
  const [activeAlert, setActiveAlert] = useState<ActiveFightAlert | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [isSirenMuted, setIsSirenMuted] = useState(false);
  const [triageNote, setTriageNote] = useState<string | null>(null);
  const navigate = useNavigate();

  const confirmIncident = useC3SStore((state) => state.confirmIncident);
  const markIncidentFalsePositive = useC3SStore((state) => state.markIncidentFalsePositive);
  const clearCampusAlert = useSafetyStore((state) => state.clearCampusAlert);

  useEffect(() => {
    const unsubAlert = globalFightDispatcher.subscribe((alert) => {
      setActiveAlert(alert);
      if (!alert) {
        setShowEvidenceModal(false);
        setTriageNote(null);
      }
    });
    const unsubAudio = globalProctorAlarm.subscribe((active, muted) => {
      setIsSirenMuted(muted);
    });
    return () => {
      unsubAlert();
      unsubAudio();
    };
  }, []);

  if (!activeAlert) return null;

  const handleNavigate = () => {
    navigate(`/map?to=${activeAlert.nodeId}&incident=${activeAlert.id}`);
  };

  const handleDownloadPhoto = () => {
    if (!activeAlert.photoUrl) return;
    const a = document.createElement('a');
    a.href = activeAlert.photoUrl;
    a.download = `incident-evidence-${activeAlert.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  /**
   * Operator triage.
   *
   * Previously the only options were "navigate", "view evidence" and
   * "dismiss", and dismissing cleared the banner without touching the
   * incident - so the incident stayed active forever and there was no record
   * of whether the detection was genuine. Now the operator can confirm the
   * detection, reject it as a false positive (which closes the incident and
   * records the label for model calibration) or escalate.
   */
  const handleConfirm = () => {
    confirmIncident(activeAlert.id);
    setTriageNote('Detection confirmed. Incident is now in the response workflow.');
  };

  const handleFalsePositive = () => {
    markIncidentFalsePositive(activeAlert.id, 'Operator review of the archived evidence');
    clearCampusAlert();
    globalProctorAlarm.dismissAlarm();
    globalFightDispatcher.clearActiveAlert();
    setTriageNote('Marked as a false positive. The incident has been closed.');
  };

  const handleEscalate = () => {
    navigate(`/security/incidents/${activeAlert.id}`);
  };

  return (
    <>
      {/* Floating Top Alert Banner */}
      <div className="fixed top-3 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-4xl z-[9999] animate-bounce-short">
        <div className="bg-slate-950/95 border-2 border-red-600 rounded-2xl shadow-2xl shadow-red-950/60 p-3.5 sm:p-4 backdrop-blur-xl text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Left Info Column */}
            <div className="flex items-start gap-3 min-w-0">
              <div className="relative flex-shrink-0 mt-0.5">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-400">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-red-600 text-white">
                    AGGRESSION ALERT • {activeAlert.confidence}%
                  </span>
                  <span className="text-[11px] font-mono text-red-300 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-900/50 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-red-400" />
                    C3S aggression detector
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {activeAlert.timestamp}
                  </span>
                </div>

                <div className="mt-1 font-semibold text-sm sm:text-base text-slate-100 flex items-center gap-1.5 truncate">
                  <MapPin className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="truncate">{activeAlert.location}</span>
                  <span className="text-xs text-slate-400">({activeAlert.cameraName})</span>
                </div>

                <div className="mt-1 flex items-center gap-2 text-xs text-emerald-400">
                  <UserCheck className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">
                    Dispatched: <strong>{activeAlert.responders.guard.name}</strong> ({activeAlert.responders.guard.distance}),{' '}
                    <strong>{activeAlert.responders.hod.name}</strong>, Proctor Notified
                  </span>
                </div>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (isSirenMuted) {
                    globalProctorAlarm.triggerAlarm('Proctor Unmuted Alarm');
                  } else {
                    globalProctorAlarm.silenceAlarm();
                  }
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                  isSirenMuted
                    ? 'bg-slate-800 text-slate-300 border border-slate-700'
                    : 'bg-amber-600 hover:bg-amber-500 text-white shadow-md animate-pulse'
                }`}
                title={isSirenMuted ? 'Resume Emergency Siren' : 'Silence Emergency Siren'}
              >
                {isSirenMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{isSirenMuted ? 'Siren Muted' : 'Silence Siren'}</span>
              </button>

              <button
                type="button"
                onClick={handleNavigate}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-red-900/40 transition active:scale-95"
              >
                <Navigation className="w-4 h-4" />
                Navigate
              </button>

              <button
                type="button"
                onClick={() => setShowEvidenceModal(true)}
                className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Camera className="w-4 h-4 text-amber-400" />
                Evidence
              </button>

              <button
                type="button"
                onClick={() => globalFightDispatcher.clearActiveAlert()}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
                title="Dismiss banner (the incident stays open)"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Operator triage row */}
          <div className="mt-3 flex flex-col gap-2 border-t border-slate-800 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] font-semibold text-slate-400">
              Operator triage — every AI alert must be confirmed or rejected so the model can be
              calibrated.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-500"
              >
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                Confirm detection
              </button>
              <button
                type="button"
                onClick={handleFalsePositive}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-slate-200 transition hover:bg-slate-700"
              >
                <Ban className="w-3.5 h-3.5" aria-hidden="true" />
                False positive
              </button>
              <button
                type="button"
                onClick={handleEscalate}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-amber-500"
              >
                <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                Escalate
              </button>
            </div>
          </div>

          {triageNote && (
            <p
              role="status"
              className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold text-emerald-300"
            >
              {triageNote}
            </p>
          )}
        </div>
      </div>

      {/* Captured Evidence Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-600/20 text-red-400 rounded-lg border border-red-500/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">
                    AI Fight Incident Evidence Archive
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Incident ID: {activeAlert.id} • Model: C3S calibrated aggression detector
                    (Confidence: {activeAlert.confidence}%)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEvidenceModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto space-y-4">
              {/* Evidence Snapshot Photo */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    Auto-Captured Forensic Photo Snapshot
                  </span>
                  <button
                    type="button"
                    onClick={handleDownloadPhoto}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Photo
                  </button>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black aspect-video flex items-center justify-center">
                  {activeAlert.photoUrl ? (
                    <img
                      src={activeAlert.photoUrl}
                      alt="Incident Evidence"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-slate-500 text-sm">No photo available</div>
                  )}
                </div>
              </div>

              {/* Video Player or Link */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-rose-400" />
                    Recorded CCTV Incident Video Clip
                  </span>
                  {activeAlert.videoUrl && (
                    <a
                      href={activeAlert.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open Stream
                    </a>
                  )}
                </div>
                <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-2">
                  {activeAlert.videoUrl ? (
                    <video
                      controls
                      autoPlay
                      muted
                      loop
                      src={activeAlert.videoUrl}
                      className="w-full max-h-56 rounded-lg object-contain bg-black"
                    />
                  ) : (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      Video stream linked to camera server. Real-time footage archived in C3S SOC DVR.
                    </div>
                  )}
                </div>
              </div>

              {/* Responder Dispatch Roster */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  Auto-Dispatched Response Personnel
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 font-mono text-[10px]">NEAREST GUARD (ETA &lt;1m)</div>
                    <div className="font-bold text-slate-200 mt-0.5">{activeAlert.responders.guard.name}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      {activeAlert.responders.guard.callsign} • Distance: {activeAlert.responders.guard.distance}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 font-mono text-[10px]">NEAREST HOD / WARDEN</div>
                    <div className="font-bold text-slate-200 mt-0.5">{activeAlert.responders.hod.name}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      {activeAlert.responders.hod.department} • {activeAlert.responders.hod.distance}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 font-mono text-[10px]">CHIEF PROCTOR OFFICE</div>
                    <div className="font-bold text-slate-200 mt-0.5">{activeAlert.responders.proctor.name}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      {activeAlert.responders.proctor.office}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                Target Node: #{activeAlert.nodeId} ({activeAlert.nodeName})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEvidenceModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEvidenceModal(false);
                    handleNavigate();
                  }}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs text-white font-bold flex items-center gap-1.5 shadow-md shadow-red-900/50"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Route on Map
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
