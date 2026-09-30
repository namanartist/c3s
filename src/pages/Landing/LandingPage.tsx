// src/pages/Landing/LandingPage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Compass,
  Users,
  Camera,
  QrCode,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles,
  Radio,
  Sliders,
  GraduationCap,
  Building2,
  DoorOpen,
  PhoneCall,
  Activity,
  Layers,
  ChevronRight,
  Lock
} from 'lucide-react';
import { useC3SStore } from '@/store/c3sStore';
import { useSafetyStore } from '@/store/safetyStore';
import { useCrowdMonitoring, getCrowdBadgeStyle, calculateCrowdDensity } from '@/lib/crowdMonitoringApi';
import { ROLE_DEFINITIONS, getRoleDefaultPath, getMockUserForRole } from '@/lib/rbac';
import { type C3SRole } from '@/lib/mock-data/users';
import { CampusMap } from '@/components/c3s/CampusMap';
import { RoleSwitcherModal } from '@/components/c3s/RoleSwitcherModal';
import { SosModal } from '@/components/safety/SosModal';
import { useHumanDetection } from '@/hooks/useHumanDetection';
import { LiveDetectionOverlay } from '@/components/safety/LiveDetectionOverlay';

export default function LandingPage() {
  const navigate = useNavigate();
  const { currentRole, setRole, isLocationActive } = useC3SStore();
  const realCrowdCount = useSafetyStore((s) => s.realCrowdCount);
  const setSosModalOpen = useSafetyStore((s) => s.setSosModalOpen);
  const { isOnline, syncCrowdData } = useCrowdMonitoring();

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());

  // Optical Vision Engine attached to CCTV preview
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const detectionResult = useHumanDetection(liveVideoRef, 'cam_landing_01', true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalHeadcount = realCrowdCount > 0 ? realCrowdCount : 206;
  const crowdDensity = calculateCrowdDensity(Math.round(totalHeadcount / 12));
  const crowdStyle = getCrowdBadgeStyle(crowdDensity);

  const activeRoleDef = ROLE_DEFINITIONS[currentRole];
  const activeUser = getMockUserForRole(currentRole);

  const primaryRoleCards: { role: C3SRole; icon: React.ElementType; tag: string }[] = [
    { role: 'STUDENT', icon: GraduationCap, tag: 'Turn-by-Turn Map & SOS' },
    { role: 'GATE_KEEPER', icon: QrCode, tag: 'Digital Check-in / Out' },
    { role: 'SECURITY_GUARD', icon: Shield, tag: 'QRF Patrol & SOS Queue' },
    { role: 'CONTROL_ROOM_OPERATOR', icon: Radio, tag: '12-Cam Optical Matrix' },
    { role: 'SUPER_ADMIN', icon: Sliders, tag: 'Audit Logs & Policies' }
  ];

  const handleLaunchRole = (role: C3SRole) => {
    setRole(role);
    const target = getRoleDefaultPath(role);
    navigate(target);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#FFFFFF] text-slate-800 selection:bg-blue-600 selection:text-white font-sans">
      {/* Modals */}
      <RoleSwitcherModal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} />
      <SosModal />

      {/* Top Institutional Bar */}
      <div className="border-b border-slate-200 bg-slate-900 text-slate-300 px-4 py-2 text-xs">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white tracking-wide">
              MADHAV INSTITUTE OF TECHNOLOGY &amp; SCIENCE • GWALIOR
            </span>
            <span className="text-slate-500 hidden md:inline">|</span>
            <span className="text-slate-400 hidden md:inline font-mono">
              Estd. 1957 • Autonomous &amp; NAAC A++ Accredited
            </span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>DEFENSE GRID: SECURE</span>
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {currentTime} IST
            </span>
          </div>
        </div>
      </div>

      {/* Main Sticky Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 px-4 sm:px-6 py-3.5 backdrop-blur-md shadow-xs">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
          {/* Logo & Platform Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform font-black text-sm">
              C3S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-slate-900 uppercase">
                  UniMap <span className="text-blue-600">//</span> C3S
                </span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700 border border-blue-200">
                  V2.4 OPERATIONAL
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Campus Safety &amp; Vector Navigation Network</p>
            </div>
          </Link>

          {/* Center Navigation Links (Clean Handcoded Craft) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/80 text-xs font-bold text-slate-600">
            <Link to="/map" className="px-3.5 py-1.5 rounded-xl hover:text-slate-900 hover:bg-white transition-all">
              3D Vector Map
            </Link>
            <Link to="/student" className="px-3.5 py-1.5 rounded-xl hover:text-slate-900 hover:bg-white transition-all">
              Student Suite
            </Link>
            <Link to="/gate-keeper" className="px-3.5 py-1.5 rounded-xl hover:text-slate-900 hover:bg-white transition-all">
              Gate Kiosk
            </Link>
            <Link to="/security" className="px-3.5 py-1.5 rounded-xl hover:text-slate-900 hover:bg-white transition-all">
              Patrol QRF
            </Link>
            <Link to="/control-room" className="px-3.5 py-1.5 rounded-xl hover:text-slate-900 hover:bg-white transition-all">
              SOC Command
            </Link>
            <Link to="/admin" className="px-3.5 py-1.5 rounded-xl hover:text-slate-900 hover:bg-white transition-all">
              Admin Audit
            </Link>
          </nav>

          {/* Right Action Stack: Active Role Pill & SOS Trigger */}
          <div className="flex items-center gap-2.5">
            {/* Active Role Pill with 1-Click Switcher */}
            <button
              type="button"
              onClick={() => setIsRoleModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 px-3 py-2 text-xs font-bold text-slate-700 transition shadow-xs cursor-pointer"
              title="Click to switch active role and permissions"
            >
              <span className={`w-2 h-2 rounded-full ${activeRoleDef.badgeBg.replace('bg-', 'bg-') || 'bg-blue-600'}`} />
              <div className="text-left hidden sm:block">
                <div className="text-[10px] text-slate-400 uppercase font-mono leading-none">ROLE:</div>
                <div className="text-xs font-black text-slate-900 leading-tight">{activeRoleDef.shortLabel}</div>
              </div>
              <span className="text-[10px] font-bold text-blue-600 ml-1">Switch ▾</span>
            </button>

            {/* Instant Emergency SOS Trigger */}
            <button
              type="button"
              onClick={() => setSosModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-red-500/25 active:scale-95 transition-all cursor-pointer animate-pulse border border-red-400/40"
              title="Broadcast 1-tap SOS: Auto-records video evidence & alerts QRF"
            >
              <ShieldAlert className="h-4 w-4" />
              <span className="hidden sm:inline">1-TAP SOS</span>
            </button>

            <Link
              to="/login"
              className="hidden md:flex items-center gap-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2.5 text-xs font-black transition cursor-pointer"
            >
              <span>Sign In</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section (Bespoke Handcoded Craftsmanship) */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-[#F8FAFC] via-[#FFFFFF] to-[#F8FAFC] pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        {/* Subtle Architectural Grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(to right, #E2E8F0 1px, transparent 1px), linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="text-center max-w-4xl mx-auto">
            {/* Top Institutional Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-bold text-blue-700 shadow-xs mb-4">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Next-Generation Autonomous Campus Operating System</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.08]">
              Institutional Safety, Real-Time Crowd Telemetry &amp; Turn-by-Turn Indoor Navigation
            </h1>

            {/* Subheading */}
            <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
              A unified, offline-first platform designed specifically for <strong className="text-slate-900 font-bold">MITS Gwalior</strong>.
              Seamlessly integrates client-side vector Dijkstra indoor pathfinding, edge computer vision crowd sensing, and 1-tap multimodal SOS dispatch.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                to="/map"
                className="flex items-center gap-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 px-6 py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Launch Interactive 3D Map</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => handleLaunchRole('STUDENT')}
                className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 active:scale-98 px-5 py-3.5 text-xs sm:text-sm font-bold text-slate-800 transition shadow-xs cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>Student Command Portal</span>
              </button>

              <button
                type="button"
                onClick={() => handleLaunchRole('CONTROL_ROOM_OPERATOR')}
                className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 active:scale-98 px-5 py-3.5 text-xs sm:text-sm font-bold text-slate-800 transition shadow-xs cursor-pointer"
              >
                <Radio className="w-4 h-4 text-rose-600" />
                <span>SOC Surveillance Console</span>
              </button>
            </div>
          </div>

          {/* Handcoded Live Telemetry Stat Strip */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-w-5xl mx-auto">
            {/* Metric 1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Live Headcount</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${crowdStyle.bg}`}>
                  {crowdStyle.label}
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                  {totalHeadcount}
                </span>
                <span className="text-xs text-slate-500 font-medium font-mono">PERSONS</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400 font-mono">Optical AI Sensing</p>
            </div>

            {/* Metric 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Physical Gates</span>
                <span className="text-emerald-600 font-bold font-mono">3 / 3 ACTIVE</span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                  1,480
                </span>
                <span className="text-xs text-slate-500 font-medium font-mono">CHECK-INS</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400 font-mono">Daily QR Registry</p>
            </div>

            {/* Metric 3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Optical CCTV Nodes</span>
                <span className="text-blue-600 font-bold font-mono">100% ONLINE</span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                  12
                </span>
                <span className="text-xs text-slate-500 font-medium font-mono">STREAMS</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400 font-mono">Real-time Vision Bboxes</p>
            </div>

            {/* Metric 4 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Emergency QRF SLA</span>
                <span className="text-rose-600 font-bold font-mono">&lt; 90s</span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                  4
                </span>
                <span className="text-xs text-slate-500 font-medium font-mono">PATROL UNITS</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400 font-mono">Auto Video Evidence</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live System Dual Showcase: Real Interactive Map & Real Optical Human Vision Stream */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              <span className="text-xs font-mono font-black uppercase tracking-wider text-blue-600">
                LIVE PRODUCTION SYSTEMS
              </span>
            </div>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Interactive Campus Vector Map &amp; Real-Time Optical AI Stream
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl">
              Experience the actual live components: clean architectural light vector maps with movement tracking, side-by-side with real computer vision human detection.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/map"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition shadow-xs"
            >
              <span>Explore Full Turn-by-Turn Map</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Real Interactive Campus Map */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    MITS Campus Master Vector Map
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Apple/Google Maps Architectural Light Theme • Auto-Follow Enabled
                  </p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                LIVE VECTOR SVG
              </span>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
              <CampusMap height="h-72 sm:h-96" highlightLocation="Academic Block A" />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-mono pt-1">
              <span>Main Gate 01 • Jubilee Gate 04 • Workshop Gate 03</span>
              <span className="text-blue-600 font-bold">Try [Simulate Walk] or [Auto-Track]</span>
            </div>
          </div>

          {/* Right: Real Optical AI Surveillance Stream */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-200">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    Live Optical AI Crowd Stream
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Sector: Academic Courtyard • 24 FPS Differencing
                  </p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                HEADCOUNT: {detectionResult.count}
              </span>
            </div>

            {/* Video Viewport with Real Bounding Box Overlay */}
            <div className="relative mt-4 h-72 sm:h-96 w-full rounded-2xl bg-black overflow-hidden border border-slate-800 shadow-inner">
              <video
                ref={liveVideoRef}
                src="/videos/crowd.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <LiveDetectionOverlay detection={detectionResult} />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-mono pt-1">
              <span>Vision Engine: <strong className="text-emerald-600 font-bold">Active Optical Bboxes</strong></span>
              <Link to="/control-room/cameras" className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                <span>View All 12 Cams</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Access Control (RBAC) Dedicated Suite Matrix */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-bold text-slate-700 shadow-xs mb-3">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Granular Role-Based Access Control (RBAC)</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900">
              One Unified Campus. Dedicated Operational Consoles.
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              Choose an operational tier below. Clicking any role instantly activates the authenticated session and routes directly to the dedicated workspace.
            </p>
          </div>

          {/* 5 Primary Operational Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {primaryRoleCards.map(({ role, icon: IconComponent, tag }) => {
              const def = ROLE_DEFINITIONS[role];
              const user = getMockUserForRole(role);
              const isCurrent = currentRole === role;

              return (
                <div
                  key={role}
                  className={`flex flex-col justify-between rounded-3xl border bg-white p-5 shadow-md transition-all hover:shadow-xl hover:-translate-y-1 ${
                    isCurrent
                      ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-blue-500/10'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div>
                    {/* Role Icon & Current Badge */}
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-2xl ${def.badgeBg} ${def.badgeText} border ${def.badgeBorder}`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      {isCurrent && (
                        <span className="flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-black text-white shadow-xs">
                          <CheckCircle2 className="w-3 h-3" /> ACTIVE
                        </span>
                      )}
                    </div>

                    <span className="mt-4 inline-block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      {tag}
                    </span>

                    <h3 className="mt-1 text-base font-black text-slate-900">
                      {def.shortLabel}
                    </h3>

                    <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                      {def.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <div className="text-[11px] font-mono text-slate-600 mb-3">
                      <div className="font-bold truncate text-slate-800">{user.name}</div>
                      <div className="text-slate-400">{user.universityId}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLaunchRole(role)}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-blue-600 active:scale-98 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <span>Launch Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setIsRoleModalOpen(true)}
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
            >
              <span>View All 10 Administrative &amp; Faculty Tiers (HOD, Dean, Coordinator, Proctor)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Engineering Foundations & Institutional Principles */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Handcoded Architecture. Zero Third-Party Cloud Bloat.
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Every layer of C3S is engineered to run offline-first with sub-millisecond responsiveness on standard campus infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Arch Card 1 */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mb-4">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-slate-900">Async Dijkstra Pathfinding</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Custom min-heap priority queue graph solver that yields to the main thread via requestAnimationFrame. Computes multi-floor traversals across 7 vector SVG maps without freezing the UI.
            </p>
          </div>

          {/* Arch Card 2 */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mb-4">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-slate-900">Zero-Touch Multimodal SOS</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              1-tap activation triggers instant camera and microphone capture. Records 4-second HD video evidence and GPS coordinates, executes AI triage, and auto-dispatches with zero clicks required from a person in distress.
            </p>
          </div>

          {/* Arch Card 3 */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-4">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-slate-900">Edge Optical Vision Telemetry</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Privacy-first silhouette clustering and frame differencing directly from HTML5 video buffers. Generates normalized person bounding boxes and real headcount without sending biometric facial data to external servers.
            </p>
          </div>
        </div>
      </section>

      {/* Institutional Footer */}
      <footer className="border-t border-slate-200 bg-slate-950 text-slate-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs">
                MITS
              </div>
              <span className="text-sm font-black tracking-wider text-white uppercase">
                MADHAV INSTITUTE OF TECHNOLOGY &amp; SCIENCE
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-400 max-w-sm leading-relaxed">
              Race Course Road, Gola ka Mandir, Gwalior, Madhya Pradesh 474005.
              Autonomous institute established in 1957, affiliated to RGPV Bhopal.
            </p>
            <div className="mt-4 flex items-center gap-4 text-xs font-mono text-slate-400">
              <span>Security SOC: +91 751 2409300</span>
              <span>•</span>
              <span className="text-rose-400 font-bold">Helpline: 112 / 108</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white">System Consoles</h4>
            <ul className="mt-3 space-y-2 text-xs text-slate-400">
              <li><Link to="/map" className="hover:text-white transition">Interactive Campus Map</Link></li>
              <li><Link to="/student" className="hover:text-white transition">Student Safety Portal</Link></li>
              <li><Link to="/gate-keeper" className="hover:text-white transition">Gate Checkpoint Kiosk</Link></li>
              <li><Link to="/security" className="hover:text-white transition">QRF Patrol Response</Link></li>
              <li><Link to="/control-room" className="hover:text-white transition">Central Control Room</Link></li>
              <li><Link to="/admin" className="hover:text-white transition">Super Admin Console</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Emergency Services</h4>
            <ul className="mt-3 space-y-2 text-xs text-slate-400 font-mono">
              <li className="flex justify-between"><span>Campus Security:</span> <strong className="text-white">+91 751 2409300</strong></li>
              <li className="flex justify-between"><span>National Police:</span> <strong className="text-white">112</strong></li>
              <li className="flex justify-between"><span>Ambulance:</span> <strong className="text-white">108</strong></li>
              <li className="flex justify-between"><span>Women Helpline:</span> <strong className="text-white">1090</strong></li>
              <li className="flex justify-between"><span>Fire &amp; Rescue:</span> <strong className="text-white">101</strong></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <span>© 2026 MITS Gwalior. Built with React 19, TypeScript, Vite &amp; Tailwind CSS.</span>
          <span className="font-mono text-[11px] text-slate-400">UniMap V2 • C3S Campus Defense Network</span>
        </div>
      </footer>
    </div>
  );
}
