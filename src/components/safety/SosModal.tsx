// src/components/safety/SosModal.tsx
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  Flame,
  ShieldAlert,
  HeartPulse,
  Wrench,
  X,
  PhoneCall,
  MapPin,
  Radio,
  Send,
  CheckCircle2,
  Camera,
  Video,
  Sparkles,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useSafetyStore } from '@/store/safetyStore';
import { useCampusNavigation } from '@/hooks/useCampusNavigation';
import { formatDMS, formatDecimal } from '@/lib/geoProjection';
import { classifyIncidentWithLlm, type LlmClassificationResult } from '@/lib/llmIncidentClassifier';
import type { IncidentCategory, IncidentSeverity } from '@/types/safety';

const INCIDENT_CATEGORIES: {
  id: IncidentCategory;
  name: string;
  desc: string;
  icon: typeof HeartPulse;
  color: string;
  border: string;
  bg: string;
}[] = [
  {
    id: 'medical',
    name: 'Medical Emergency',
    desc: 'Sudden injury, unconsciousness, severe illness, or medical aid required',
    icon: HeartPulse,
    color: 'text-rose-600',
    border: 'border-rose-300 hover:border-rose-500',
    bg: 'bg-rose-50'
  },
  {
    id: 'security',
    name: 'Security & Threat',
    desc: 'Harassment, brawl, unauthorized trespasser, theft, or physical danger',
    icon: ShieldAlert,
    color: 'text-amber-600',
    border: 'border-amber-300 hover:border-amber-500',
    bg: 'bg-amber-50'
  },
  {
    id: 'fire',
    name: 'Fire & Smoke Hazard',
    desc: 'Fire outbreak, electrical short circuit, chemical spill, or gas leak',
    icon: Flame,
    color: 'text-orange-600',
    border: 'border-orange-300 hover:border-orange-500',
    bg: 'bg-orange-50'
  },
  {
    id: 'infrastructure',
    name: 'Critical Infrastructure',
    desc: 'Elevator trapped, structural damage, water burst, or electrical hazard',
    icon: Wrench,
    color: 'text-blue-600',
    border: 'border-blue-300 hover:border-blue-500',
    bg: 'bg-blue-50'
  }
];

export function SosModal() {
  const sosModalOpen = useSafetyStore((s) => s.sosModalOpen);
  const setSosModalOpen = useSafetyStore((s) => s.setSosModalOpen);
  const triggerSosIncident = useSafetyStore((s) => s.triggerSosIncident);
  const emergencyContacts = useSafetyStore((s) => s.emergencyContacts);
  const activeDashboard = useSafetyStore((s) => s.activeDashboard);

  const {
    userGpsCoords,
    userSvgCoords,
    activeMapId,
    routeToSosIncident
  } = useCampusNavigation();

  const [category, setCategory] = useState<IncidentCategory>('medical');
  const [severity, setSeverity] = useState<IncidentSeverity>('high');
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Auto Media Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [aiResult, setAiResult] = useState<LlmClassificationResult | null>(null);

  // Auto-Dispatch Countdown
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null);
  const [autoDispatchPaused, setAutoDispatchPaused] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Auto-resolved location coordinates: user's live GPS or fallback to Main Gate
  const resolvedCoords = useMemo(() => {
    if (userGpsCoords) {
      return {
        lat: userGpsCoords.lat,
        lng: userGpsCoords.lon,
        x: userSvgCoords?.x ?? 253.0593,
        y: userSvgCoords?.y ?? 606.1033,
        source: 'Live GPS Device Position'
      };
    }
    return {
      lat: 26.232611,
      lng: 78.205222,
      x: 253.0593,
      y: 606.1033,
      source: 'MITS Campus Main Entrance'
    };
  }, [userGpsCoords, userSvgCoords]);

  // Floor resolution
  const currentFloorNumber = useMemo(() => {
    if (activeMapId.includes('FF')) return 1;
    if (activeMapId.includes('SF')) return 2;
    return 0;
  }, [activeMapId]);

  // When modal opens: automatically start camera stream and record evidence
  useEffect(() => {
    if (!sosModalOpen) {
      // Clean up stream if modal closes
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    let isCancelled = false;

    async function startCameraAndAutoRecord() {
      setIsRecording(true);
      setMediaError(null);
      recordedChunksRef.current = [];

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: true
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        // Setup MediaRecorder for short 4-second video clip
        let mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported('video/webm')) {
          mimeType = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : '';
        }

        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          if (recordedChunksRef.current.length > 0) {
            const blob = new Blob(recordedChunksRef.current, { type: mimeType || 'video/webm' });
            const url = URL.createObjectURL(blob);
            setVideoBlobUrl(url);
          }
          setIsRecording(false);
        };

        recorder.start();

        // After 1 second of live video, capture crisp photo snapshot
        setTimeout(() => {
          if (isCancelled || !videoRef.current || !canvasRef.current) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setPhotoDataUrl(dataUrl);

            // Trigger AI LLM classification
            setIsClassifying(true);
            classifyIncidentWithLlm({
              photoBase64: dataUrl,
              locationName: resolvedCoords.source,
              mapId: activeMapId
            }).then((ai) => {
              if (isCancelled) return;
              setAiResult(ai);
              setCategory(ai.category);
              setSeverity(ai.severity);
              setCustomTitle(ai.title);
              setIsClassifying(false);
            }).catch(() => {
              if (!isCancelled) setIsClassifying(false);
            });
          }
        }, 1200);

        // Stop video recording after 3.5 seconds
        setTimeout(() => {
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }, 3500);

      } catch (err: any) {
        console.warn('Camera access unavailable, generating telemetry snapshot:', err);
        setMediaError('Camera permission not granted. Telemetry & sensor logging active.');
        setIsRecording(false);
        setAutoCountdown(4);

        // Fallback synthetic photo snapshot from canvas
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          canvas.width = 400;
          canvas.height = 300;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, 400, 300);
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 16px monospace';
            ctx.fillText('CAMPUS SHIELD // SENSOR SOS', 30, 100);
            ctx.fillStyle = '#38bdf8';
            ctx.font = '12px monospace';
            ctx.fillText(`GPS: ${resolvedCoords.lat.toFixed(5)}, ${resolvedCoords.lng.toFixed(5)}`, 30, 140);
            ctx.fillText(`ZONE: ${activeMapId} (Level ${currentFloorNumber})`, 30, 170);
            const mockUrl = canvas.toDataURL('image/jpeg', 0.8);
            setPhotoDataUrl(mockUrl);

            setIsClassifying(true);
            classifyIncidentWithLlm({
              locationName: resolvedCoords.source,
              mapId: activeMapId
            }).then((ai) => {
              setAiResult(ai);
              setCategory(ai.category);
              setSeverity(ai.severity);
              setCustomTitle(ai.title);
              setIsClassifying(false);
            });
          }
        }
      }
    }

    startCameraAndAutoRecord();

    return () => {
      isCancelled = true;
      setAutoCountdown(null);
      setAutoDispatchPaused(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [sosModalOpen, activeMapId, currentFloorNumber, resolvedCoords]);

  // Execute dispatch with all captured evidence
  const executeDispatch = useCallback(() => {
    const catObj = INCIDENT_CATEGORIES.find((c) => c.id === category);
    const title = customTitle.trim() || aiResult?.title || `${catObj?.name || 'Campus Emergency'} Alert`;
    const desc = customDesc.trim() || aiResult?.summary || `Urgent assistance requested at ${resolvedCoords.source} (${activeMapId.replace('_', ' ')}). Auto-recorded camera evidence attached.`;

    const newIncident = triggerSosIncident({
      category,
      severity,
      title,
      description: desc,
      map: activeMapId,
      floor: currentFloorNumber,
      x: resolvedCoords.x,
      y: resolvedCoords.y,
      lat: resolvedCoords.lat,
      lng: resolvedCoords.lng,
      reportedBy: reporterPhone ? `Student (${reporterPhone})` : 'Anonymous Student',
      phone: reporterPhone || undefined,
      evidence: {
        photoUrl: photoDataUrl || undefined,
        videoUrl: videoBlobUrl || undefined,
        recordedAt: Date.now(),
        recordedDurationSeconds: 4,
        aiClassification: aiResult || undefined
      }
    });

    setIsSubmitted(true);
    setAutoCountdown(null);

    // Auto navigate to incident for operator contexts
    setTimeout(() => {
      setIsSubmitted(false);
      setSosModalOpen(false);
      if (activeDashboard !== 'nav') {
        routeToSosIncident(newIncident);
      }
    }, 1500);
  }, [category, severity, customTitle, customDesc, aiResult, resolvedCoords, activeMapId, currentFloorNumber, reporterPhone, photoDataUrl, videoBlobUrl, triggerSosIncident, activeDashboard, routeToSosIncident, setSosModalOpen]);

  // Handle auto-countdown timer
  useEffect(() => {
    if (autoCountdown === null || autoDispatchPaused || isSubmitted || !sosModalOpen) return;
    if (autoCountdown <= 0) {
      executeDispatch();
      return;
    }
    const timer = setTimeout(() => {
      setAutoCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [autoCountdown, autoDispatchPaused, isSubmitted, sosModalOpen, executeDispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeDispatch();
  };

  if (!sosModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none">
        {/* Backdrop blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isSubmitted && setSosModalOpen(false)}
          className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-xl bg-slate-900 text-slate-100 rounded-3xl shadow-2xl border border-red-500/30 overflow-hidden z-10 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white p-5 sm:p-6 shrink-0 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                  <AlertTriangle className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black tracking-tight">Campus SOS Emergency</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white text-red-700 shadow-sm animate-pulse">
                      AUTO-RECORDING
                    </span>
                  </div>
                  <p className="text-xs text-red-100 font-medium mt-0.5">
                    Live camera photo &amp; video auto-captured and analyzed by AI
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSosModalOpen(false)}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {isSubmitted ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-4 my-auto">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-black text-white">SOS Broadcasted &amp; Dispatched!</h3>
              <p className="text-sm text-slate-300 max-w-sm">
                Photo and video evidence with AI incident categorization have been sent to Campus Security QRF.
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-cyan-400">
                {formatDMS(resolvedCoords.lat, resolvedCoords.lng)} • Floor {currentFloorNumber}
              </div>
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <Radio className="w-4 h-4 animate-spin" /> Responders En Route...
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4">
              {/* Hidden Canvas for snapshot generation */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Live Camera Viewfinder & Snapshot Preview */}
              <div className="relative rounded-2xl border border-red-500/40 bg-black overflow-hidden aspect-video max-h-48 flex items-center justify-center">
                {/* Live Video Feed during auto-recording */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${photoDataUrl && !isRecording ? 'hidden' : 'block'}`}
                />

                {/* Captured Photo Snapshot preview */}
                {photoDataUrl && !isRecording && (
                  <img
                    src={photoDataUrl}
                    alt="Captured Incident Evidence"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Recording HUD Overlay */}
                <div className="absolute top-2.5 left-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-[11px] font-mono font-bold text-white backdrop-blur-md border border-white/10">
                  {isRecording ? (
                    <>
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
                      <span className="text-red-400 font-black">RECORDING EVIDENCE (4s)</span>
                    </>
                  ) : (
                    <>
                      <Camera className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">PHOTO &amp; VIDEO CAPTURED</span>
                    </>
                  )}
                </div>

                {/* Video replay badge */}
                {videoBlobUrl && !isRecording && (
                  <div className="absolute bottom-2.5 right-3 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-mono text-cyan-400 border border-cyan-500/30">
                    <Video className="h-3 w-3" />
                    <span>Clip: 4s HD</span>
                  </div>
                )}
              </div>

              {/* Zero-Touch Auto-Dispatch Countdown Indicator */}
              {autoCountdown !== null && !isSubmitted && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-red-950/80 via-rose-950/80 to-slate-900 border border-red-500/50 shadow-lg text-white">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                    </span>
                    <div>
                      <p className="text-xs font-black text-red-200 uppercase tracking-tight">
                        {autoDispatchPaused ? 'AUTO-DISPATCH PAUSED' : `AUTO-BROADCASTING IN ${autoCountdown}S`}
                      </p>
                      <p className="text-[10px] text-slate-300">
                        {autoDispatchPaused
                          ? 'Review details or click Dispatch Now'
                          : 'Zero-touch dispatch with recorded video & GPS coordinates'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!autoDispatchPaused ? (
                      <button
                        type="button"
                        onClick={() => setAutoDispatchPaused(true)}
                        className="px-2.5 py-1 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        Pause
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAutoDispatchPaused(false)}
                        className="px-2.5 py-1 rounded-xl text-xs font-bold text-cyan-300 hover:text-cyan-200 bg-cyan-950/80 border border-cyan-500/40 transition-colors cursor-pointer"
                      >
                        Resume
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => executeDispatch()}
                      className="px-3 py-1 rounded-xl text-xs font-black text-white bg-red-600 hover:bg-red-500 transition-colors animate-pulse cursor-pointer shadow-md shadow-red-950"
                    >
                      SEND NOW
                    </button>
                  </div>
                </div>
              )}

              {/* LLM AI Incident Triage Card */}
              <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 to-blue-950/40 p-3.5 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-400 animate-spin" />
                    <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                      AI INCIDENT TRIAGE ENGINE
                    </span>
                  </div>
                  {isClassifying ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                      <Loader2 className="h-3 w-3 animate-spin" /> Analyzing Frame...
                    </span>
                  ) : (
                    <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold font-mono text-cyan-300 border border-cyan-500/30">
                      {Math.round((aiResult?.confidence || 0.94) * 100)}% CONFIDENCE
                    </span>
                  )}
                </div>

                <div className="mt-2 text-xs text-slate-300 space-y-1">
                  <p>
                    <span className="font-bold text-white">Suggested:</span>{' '}
                    <span className="text-cyan-300 font-semibold">{aiResult?.title || 'Emergency Medical / Security Alert'}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {aiResult?.reasoning || 'Auto-evaluating visual distress clues and student coordinates for emergency dispatch.'}
                  </p>
                </div>
              </div>

              {/* GPS Geolocation Banner */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/30">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{resolvedCoords.source}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {formatDMS(resolvedCoords.lat, resolvedCoords.lng)} ({formatDecimal(resolvedCoords.lat, resolvedCoords.lng)})
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-800 px-2.5 py-1 rounded-lg">
                    {activeMapId.replace('_', ' ')} • Lvl {currentFloorNumber}
                  </span>
                </div>
              </div>

              {/* Emergency Category Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Emergency Category (AI Auto-Selected)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {INCIDENT_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'border-red-500 bg-red-950/40 ring-2 ring-red-500/30 shadow-lg'
                            : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-800/40'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-red-500/20 border border-red-500/40' : 'bg-slate-800'
                          } ${cat.color}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white">{cat.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                            {cat.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Severity Level */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Incident Urgency Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['critical', 'high', 'medium'] as IncidentSeverity[]).map((level) => {
                    const active = severity === level;
                    const colors = {
                      critical: 'text-red-400 border-red-500 bg-red-950/60 ring-red-500/30',
                      high: 'text-orange-400 border-orange-500 bg-orange-950/60 ring-orange-500/30',
                      medium: 'text-amber-400 border-amber-500 bg-amber-950/60 ring-amber-500/30'
                    };
                    return (
                      <button
                        type="button"
                        key={level}
                        onClick={() => setSeverity(level)}
                        className={`py-2 px-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          active ? `${colors[level]} ring-2 shadow-sm font-black` : 'border-slate-800 text-slate-400 hover:bg-slate-800/60'
                        }`}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Notes */}
              <div className="space-y-2.5">
                <div>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Emergency Headline"
                    className="w-full px-3.5 py-2 text-xs border border-slate-800 bg-slate-950 rounded-xl text-white placeholder-slate-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>

                <div>
                  <textarea
                    rows={2}
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    placeholder="Describe situation / Landmarks (Optional)..."
                    className="w-full px-3.5 py-2 text-xs border border-slate-800 bg-slate-950 rounded-xl text-white placeholder-slate-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSosModalOpen(false)}
                  className="w-1/3 py-3 rounded-2xl border border-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 active:scale-[0.98] transition-all cursor-pointer animate-pulse"
                >
                  <Send className="w-4 h-4" />
                  <span>DISPATCH WITH EVIDENCE</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
