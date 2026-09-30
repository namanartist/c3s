import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Video,
  Activity,
  Users,
  ShieldAlert,
  AlertTriangle,
  Eye,
  CheckCircle2,
  MapPin,
  Navigation
} from 'lucide-react';
import { useSafetyStore } from '@/store/safetyStore';
import { useCampusNavigation } from '@/hooks/useCampusNavigation';
import { formatDMS } from '@/lib/geoProjection';
import {
  useCrowdMonitoring,
  getCameraVideoFeedUrl,
  getCrowdBadgeStyle
} from '@/lib/crowdMonitoringApi';
import { useHumanDetection } from '@/hooks/useHumanDetection';
import { LiveDetectionOverlay } from '@/components/safety/LiveDetectionOverlay';

export function CctvSocDashboard() {
  const cctvCameras = useSafetyStore((s) => s.cctvCameras);
  const incidents = useSafetyStore((s) => s.incidents);
  const activeAlert = useSafetyStore((s) => s.activeAlert);
  const triggerCampusAlert = useSafetyStore((s) => s.triggerCampusAlert);
  const clearCampusAlert = useSafetyStore((s) => s.clearCampusAlert);
  const updateIncidentStatus = useSafetyStore((s) => s.updateIncidentStatus);

  const { routeToSosIncident, setSelectedMapId } = useCampusNavigation();

  const [activeCamId, setActiveCamId] = useState<string>('cam_gate_1');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [ptzPan, setPtzPan] = useState<number>(0);
  const [isNightVision, setIsNightVision] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  const focusedCamera = cctvCameras.find((c) => c.id === activeCamId) || cctvCameras[0];
  const activeIncidents = incidents.filter((i) => i.status !== 'resolved');
  const alertCameras = cctvCameras.filter((camera) => camera.status === 'alert').length;
  const onlineCameras = cctvCameras.filter((camera) => camera.status === 'online').length;

  // Crowd Monitoring & Human Vision AI
  const { health, isOnline, isRefreshing, syncCrowdData } = useCrowdMonitoring();
  const [streamMode, setStreamMode] = useState<'stream' | 'hud'>('stream');
  const [feedError, setFeedError] = useState(false);
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const liveDetection = useHumanDetection(mainVideoRef, focusedCamera?.id, streamMode === 'stream');

  useEffect(() => {
    setFeedError(false);
  }, [activeCamId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDispatchIncident = (inc: typeof incidents[0]) => {
    updateIncidentStatus(inc.id, 'responding', 'QRF Unit 1 Dispatched');
    routeToSosIncident(inc);
    if (inc.map) setSelectedMapId(inc.map);
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-neutral-950/95 backdrop-blur-2xl text-white select-none overflow-hidden pt-20 pb-6 px-6">
      {/* Top Banner Alert if active */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white flex items-center justify-between shadow-xl shadow-red-600/30 border border-red-400/40"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
              </span>
              <div>
                <span className="text-xs font-black uppercase tracking-wider">{activeAlert.title}</span>
                <span className="text-xs text-red-100 ml-2 font-medium">{activeAlert.message}</span>
              </div>
            </div>
            <button
              onClick={clearCampusAlert}
              className="px-3 py-1 bg-white text-red-700 text-xs font-black rounded-lg hover:bg-neutral-100 transition-all cursor-pointer"
            >
              DISMISS ALERT
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SOC Command Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white">C3S SURVEILLANCE & SECURITY OPERATIONS CENTER</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                LIVE SOC FEED
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-medium mt-0.5 flex items-center gap-3">
              <span>MITS Gwalior Campus CCTV Coverage Grid</span>
              <span>•</span>
              <span className="font-mono text-neutral-300">{currentTime} IST</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                6 / 6 CAMERAS OPERATIONAL
              </span>
            </p>
          </div>
        </div>

        {/* Global Emergency Action Bar & Crowd Link Status */}
        <div className="flex items-center gap-2">
          {/* Crowd Monitoring Service Status Pill */}
          <div
            onClick={() => syncCrowdData()}
            title="Click to refresh crowd telemetry from C:\Users\naman\Crowd_monitoring"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-white/10 text-xs font-mono cursor-pointer hover:border-blue-500/50 transition-all"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-neutral-300">
              CROWD AI:{' '}
              <strong className={isOnline ? 'text-emerald-400' : 'text-amber-400'}>
                {isOnline ? 'LINKED' : 'STANDBY'}
              </strong>
            </span>
            <span className="text-neutral-500">•</span>
            <span className="text-neutral-300 font-bold">
              👥 {health.totalCrowdInCampus || cctvCameras.reduce((acc, c) => acc + (c.crowdCount || 0), 0)} Total
            </span>
          </div>

          <button
            onClick={() =>
              triggerCampusAlert({
                type: 'lockdown',
                active: true,
                title: 'CAMPUS TACTICAL LOCKDOWN INITIATED',
                message: 'All exterior gates closing. Security guards dispatched to all perimeter gates.',
                issuedBy: 'SOC Commander'
              })
            }
            className="px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Lockdown</span>
          </button>

          <button
            onClick={() =>
              triggerCampusAlert({
                type: 'evacuation',
                active: true,
                title: 'CAMPUS SAFETY EVACUATION SIREN',
                message: 'Evacuate all buildings toward Open Sports Grounds and Jubilee Gate lawns.',
                issuedBy: 'SOC Chief'
              })
            }
            className="px-3.5 py-2 rounded-xl bg-orange-600/20 hover:bg-orange-600 text-orange-300 hover:text-white border border-orange-500/40 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Evacuation</span>
          </button>

          <button
            onClick={() =>
              triggerCampusAlert({
                type: 'all_clear',
                active: true,
                title: 'ALL CLEAR SIGNAL ISSUED',
                message: 'Campus perimeter verified safe. Normal operations resume.',
                issuedBy: 'Patrol Chief'
              })
            }
            className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>All Clear</span>
          </button>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-2 py-4 sm:grid-cols-4">
        <SocMetric label="Open incidents" value={activeIncidents.length.toString()} tone="red" icon={ShieldAlert} />
        <SocMetric label="Cameras online" value={`${onlineCameras}/${cctvCameras.length}`} tone="emerald" icon={Video} />
        <SocMetric
          label={`Crowd: ${focusedCamera.crowdLabel || focusedCamera.name.split('•')[1] || focusedCamera.name}`}
          value={`${focusedCamera.crowdCount ?? 0} Detected`}
          tone={focusedCamera.crowdDensity === 'critical' ? 'red' : focusedCamera.crowdDensity === 'high' ? 'amber' : 'emerald'}
          icon={Users}
        />
        <SocMetric
          label="Density Status"
          value={focusedCamera.crowdDensity?.toUpperCase() || 'LOW'}
          tone={focusedCamera.crowdDensity === 'critical' ? 'red' : focusedCamera.crowdDensity === 'high' ? 'amber' : 'cyan'}
          icon={Activity}
        />
      </div>

      {/* Main SOC Workspace: Left = Feeds / PTZ, Right = Incident Triage */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pt-1 xl:flex-row xl:gap-6 xl:overflow-hidden">
        {/* Left Video Surveillance Area */}
        <div className="flex min-h-[520px] min-w-0 flex-1 flex-col gap-4 overflow-hidden">
          {/* Active Focused Camera Screen */}
          <div className="flex-1 relative rounded-3xl overflow-hidden border border-white/10 bg-neutral-900 shadow-2xl flex flex-col group">
            {/* Camera Viewport Canvas */}
            <div
              className={`flex-1 relative w-full h-full flex items-center justify-center overflow-hidden transition-all ${
                isNightVision ? 'brightness-125 contrast-150 hue-rotate-90 bg-emerald-950/80' : 'bg-neutral-950'
              }`}
            >
              {/* Scanline Effect Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none z-10 opacity-60" />

              {/* Viewport Content: Live Stream or Blueprint HUD */}
              {streamMode === 'stream' ? (
                <div
                  className="w-full h-full relative flex items-center justify-center overflow-hidden transition-transform duration-300"
                  style={{
                    transform: `scale(${zoomLevel}) translateX(${ptzPan * 20}px)`
                  }}
                >
                  <video
                    ref={mainVideoRef}
                    src={focusedCamera.id.includes('2') || focusedCamera.id.includes('4') || focusedCamera.id.includes('6') ? '/videos/crowd2.mp4' : '/videos/crowd.mp4'}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <LiveDetectionOverlay detection={liveDetection} />
                </div>
              ) : (
                <div
                  className="w-full h-full relative flex items-center justify-center p-8 transition-transform duration-300"
                  style={{
                    transform: `scale(${zoomLevel}) translateX(${ptzPan * 20}px)`
                  }}
                >
                  {/* Background Blueprint Grid */}
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]" />

                  {/* Radar Sweep Animation */}
                  <div
                    className="absolute w-80 h-80 rounded-full border border-blue-500/30 flex items-center justify-center animate-spin"
                    style={{ animationDuration: '8s' }}
                  >
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent to-blue-500" />
                  </div>

                  {/* Center Crosshair */}
                  <div className="relative z-0 text-center space-y-2 max-w-md">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-400 text-xs font-mono">
                      <Eye className="w-3.5 h-3.5" />
                      <span>AI CROWD ESTIMATION ACTIVE</span>
                    </div>

                    <h3 className="text-xl font-black text-white tracking-tight">
                      {focusedCamera.name}
                    </h3>
                    <p className="text-xs text-neutral-400 font-mono">
                      {focusedCamera.location} • {focusedCamera.zone}
                    </p>

                    {feedError && (
                      <p className="text-[11px] text-amber-400/90 font-mono bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-lg">
                        ℹ Live video feed standby. Run <span className="font-bold">detection.py</span> on :8001 to stream live RTSP/video.
                      </p>
                    )}

                    <div className="pt-4 flex items-center justify-center gap-4 text-xs font-mono text-neutral-500">
                      <span>LAT: {focusedCamera.lat.toFixed(6)}°</span>
                      <span>LON: {focusedCamera.lng.toFixed(6)}°</span>
                      <span>BEARING: {focusedCamera.bearingDeg}°</span>
                    </div>
                  </div>

                  {/* Simulated AI Detection Bounding Box */}
                  <div className="absolute top-1/3 left-1/4 border-2 border-emerald-400/80 bg-emerald-500/10 px-2 py-1 rounded-lg text-[10px] font-mono text-emerald-300 flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>AI HEADCOUNT: {focusedCamera.crowdCount || 3} DETECTED</span>
                  </div>

                  {focusedCamera.status === 'alert' && (
                    <div className="absolute bottom-1/3 right-1/4 border-2 border-red-500 bg-red-500/20 px-3 py-1.5 rounded-xl text-xs font-black font-mono text-red-300 flex items-center gap-2 animate-bounce">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span>HIGH CROWD CONGESTION • DISPATCH READY</span>
                    </div>
                  )}
                </div>
              )}

              {/* Screen HUD Overlay Indicators */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 font-mono text-xs">
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 text-white font-black animate-pulse shadow-md">
                  <span className="w-2 h-2 rounded-full bg-white" />
                  <span>REC</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-neutral-200">
                  {focusedCamera.resolution} • {focusedCamera.fps} FPS
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-emerald-400 font-bold">
                  {focusedCamera.zone}
                </span>
              </div>

              {/* Top Right Mode Switchers */}
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                <button
                  onClick={() => {
                    setStreamMode((m) => (m === 'stream' ? 'hud' : 'stream'));
                    if (streamMode === 'hud') setFeedError(false);
                  }}
                  className={`px-3 py-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                    streamMode === 'stream' && !feedError
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-black/60 border border-white/10 text-neutral-300 hover:bg-black/80'
                  }`}
                >
                  {streamMode === 'stream' && !feedError ? 'VIDEO FEED' : 'BLUEPRINT RADAR'}
                </button>
                <button
                  onClick={() => setIsNightVision(!isNightVision)}
                  className={`px-3 py-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                    isNightVision
                      ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                      : 'bg-black/60 border border-white/10 text-neutral-300 hover:bg-black/80'
                  }`}
                >
                  NV MODE {isNightVision ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Floating Live Crowd Intelligence Telemetry HUD (Bottom Right) */}
              <div className="absolute bottom-4 right-4 z-20 p-3 rounded-2xl bg-black/80 backdrop-blur-md border border-white/15 text-xs font-mono flex flex-col gap-1 min-w-[200px] shadow-2xl">
                <div className="flex items-center justify-between text-[11px] pb-1 border-b border-white/10">
                  <span className="text-neutral-400">CROWD AI TELEMETRY</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      getCrowdBadgeStyle(focusedCamera.crowdDensity || 'low').bg
                    }`}
                  >
                    {getCrowdBadgeStyle(focusedCamera.crowdDensity || 'low').label}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-neutral-400">Headcount:</span>
                  <strong className="text-white text-sm font-bold">
                    👥 {focusedCamera.crowdCount ?? 0} People
                  </strong>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span>Confidence:</span>
                  <span className="text-emerald-400 font-bold">
                    {Math.round((focusedCamera.confidence || 0.94) * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span>Latency:</span>
                  <span className="text-cyan-400 font-bold">
                    {focusedCamera.latencyMs || 38} ms
                  </span>
                </div>
              </div>

              {/* PTZ Quick Controls Overlay on Bottom Left */}
              <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 p-1.5 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 text-xs font-mono">
                <span className="text-neutral-400 font-bold px-2">PTZ:</span>
                <button
                  onClick={() => setPtzPan((p) => Math.max(p - 1, -3))}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer"
                  title="Pan Left"
                >
                  ◀ PAN L
                </button>
                <button
                  onClick={() => setPtzPan(0)}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 font-bold cursor-pointer"
                >
                  CENTER
                </button>
                <button
                  onClick={() => setPtzPan((p) => Math.min(p + 1, 3))}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer"
                  title="Pan Right"
                >
                  PAN R ▶
                </button>
                <div className="h-4 w-[1px] bg-white/20 mx-1" />
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
                  className="px-2 py-1 rounded-lg bg-blue-600/60 hover:bg-blue-600 text-white font-bold cursor-pointer"
                >
                  ZOOM +
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 1))}
                  className="px-2 py-1 rounded-lg bg-blue-600/60 hover:bg-blue-600 text-white font-bold cursor-pointer"
                >
                  ZOOM -
                </button>
              </div>
            </div>
          </div>

          {/* Camera Selector Filmstrip */}
          <div className="grid shrink-0 grid-cols-2 gap-2.5 sm:grid-cols-3 xl:h-24 xl:grid-cols-6">
            {cctvCameras.map((cam) => {
              const isSelected = cam.id === activeCamId;
              const badgeStyle = getCrowdBadgeStyle(cam.crowdDensity || 'low');
              return (
                <button
                  key={cam.id}
                  onClick={() => setActiveCamId(cam.id)}
                  className={`relative p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between overflow-hidden group ${
                    isSelected
                      ? 'bg-blue-950/80 border-blue-500 ring-2 ring-blue-500/30 shadow-lg'
                      : 'bg-neutral-900/80 border-white/10 hover:border-white/25 hover:bg-neutral-800/80'
                  }`}
                >
                  <video
                    src={cam.id.includes('2') || cam.id.includes('4') || cam.id.includes('6') ? '/videos/crowd2.mp4' : '/videos/crowd.mp4'}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-40 transition-opacity pointer-events-none"
                  />
                  <div className="relative z-10 flex items-center justify-between w-full">
                    <span className="text-[10px] font-black uppercase font-mono text-neutral-400">
                      {cam.id.replace('cam_', 'CAM ')}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-[10px] font-mono text-neutral-300 font-bold">
                        👥 {cam.crowdCount ?? 0}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          cam.status === 'alert'
                            ? 'bg-red-500 animate-ping'
                            : cam.status === 'online'
                            ? 'bg-emerald-500'
                            : 'bg-neutral-500'
                        }`}
                      />
                    </span>
                  </div>

                  <p className="text-[11px] font-bold text-white leading-tight truncate">
                    {cam.name.split('•')[1] || cam.name}
                  </p>

                  <div className="flex items-center justify-between text-[9px] font-mono text-neutral-400">
                    <span>{cam.zone}</span>
                    <span className={`px-1 rounded text-[8px] font-bold ${badgeStyle.bg}`}>
                      {cam.crowdDensity?.toUpperCase() || 'LOW'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar: Incident Triage & Quick Dispatch */}
        <div className="flex w-full shrink-0 flex-col gap-4 overflow-hidden xl:w-96">
          {/* Live Incident Queue Header */}
          <div className="p-4 rounded-3xl bg-neutral-900 border border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  LIVE INCIDENT QUEUE
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono bg-red-500 text-white">
                {activeIncidents.length} ACTIVE
              </span>
            </div>

            <p className="text-[11px] text-neutral-400 font-medium leading-relaxed">
              Real-time SOS broadcasts and verified campus anomalies requiring immediate QRF dispatch.
            </p>
          </div>

          {/* Incidents Scrollable List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {incidents.map((inc) => {
              const isResolved = inc.status === 'resolved';

              return (
                <div
                  key={inc.id}
                  className={`p-4 rounded-3xl border transition-all space-y-3 ${isResolved
                    ? 'bg-neutral-900/50 border-white/5 opacity-60'
                    : inc.severity === 'critical'
                      ? 'bg-red-950/40 border-red-500/40 ring-1 ring-red-500/20 shadow-lg shadow-red-950/40'
                      : 'bg-neutral-900 border-white/10'
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${isResolved
                          ? 'bg-emerald-500'
                          : inc.severity === 'critical'
                            ? 'bg-red-500 animate-pulse'
                            : 'bg-amber-500'
                          }`}
                      />
                      <span className="text-xs font-black text-white">{inc.title}</span>
                    </div>

                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${inc.severity === 'critical'
                        ? 'bg-red-500 text-white'
                        : 'bg-amber-500/30 text-amber-300'
                        }`}
                    >
                      {inc.severity}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed">{inc.description}</p>

                  <div className="p-2.5 rounded-2xl bg-black/40 border border-white/5 space-y-1 text-[11px] font-mono">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-400" />
                        {inc.map.replace('_', ' ')} • Floor {inc.floor === 0 ? 'G' : inc.floor}
                      </span>
                      <span>{formatDMS(inc.lat, inc.lng)}</span>
                    </div>

                    {inc.reportedBy && (
                      <div className="text-[10px] text-neutral-500 pt-1 border-t border-white/5">
                        Reported by: {inc.reportedBy}
                      </div>
                    )}
                  </div>

                  {/* Dispatch & Action Controls */}
                  <div className="flex items-center gap-2 pt-1">
                    {!isResolved ? (
                      <>
                        <button
                          onClick={() => handleDispatchIncident(inc)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-500/30 cursor-pointer active:scale-95 transition-all"
                        >
                          <Navigation className="w-3.5 h-3.5 fill-white" />
                          <span>DISPATCH & ROUTE</span>
                        </button>
                        <button
                          onClick={() => updateIncidentStatus(inc.id, 'resolved')}
                          className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-emerald-600/30 hover:text-emerald-300 text-neutral-300 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Resolve</span>
                        </button>
                      </>
                    ) : (
                      <span className="w-full py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-center font-bold text-xs flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SocMetric({ label, value, tone, icon: Icon }: { label: string; value: string; tone: 'red' | 'emerald' | 'amber' | 'cyan'; icon: typeof Video }) {
  const styles = {
    red: 'border-red-400/20 bg-red-400/10 text-red-300',
    emerald: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    amber: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
    cyan: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300'
  } as const;

  return (
    <div className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${styles[tone]}`}>
      <Icon className="h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <div className="truncate text-lg font-black leading-none text-white">{value}</div>
        <div className="mt-1 truncate text-[9px] font-black uppercase tracking-wider text-neutral-400">{label}</div>
      </div>
    </div>
  );
}
