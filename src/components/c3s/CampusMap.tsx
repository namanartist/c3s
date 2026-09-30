// src/components/c3s/CampusMap.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Shield,
  Camera,
  AlertTriangle,
  Compass,
  Radio,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  LocateFixed,
  Play,
  Pause,
  Footprints,
  Layers,
  Sparkles,
  X,
  ShieldAlert,
  Building2,
  MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';
import { useSafetyStore } from '@/store/safetyStore';

interface CampusMapProps {
  height?: string;
  showControls?: boolean;
  highlightLocation?: string;
  onSelectZone?: (zoneName: string) => void;
}

// Campus SVG Master coordinates (matches /maps/Campus_Map.svg viewBox)
const SVG_VIEWBOX = {
  minX: 0,
  minY: 0,
  width: 1092.2019,
  height: 670.0992
};

// Realistic Waypoints for Simulated Campus Movement
const CAMPUS_WALK_WAYPOINTS = [
  { x: 253, y: 606, name: 'Main Gate 01 (Entrance)', sector: 'Gate 01 Plaza' },
  { x: 330, y: 550, name: 'South Boulevard Boulevard', sector: 'Main Walkway' },
  { x: 320, y: 470, name: 'West Lawn Junction', sector: 'West Lawns' },
  { x: 420, y: 470, name: 'Main Academic South Entrance', sector: 'Main Academic Building' },
  { x: 510, y: 400, name: 'Central Atrium Open Courtyard', sector: 'Central Atrium' },
  { x: 510, y: 320, name: 'Central Library Plaza', sector: 'Library Square' },
  { x: 540, y: 220, name: 'North Boulevard Path', sector: 'North Walkway' },
  { x: 570, y: 150, name: 'AI & CSE Complex South Portal', sector: 'AI & CSE Complex' },
  { x: 570, y: 95, name: 'AI Labs & Innovation Wing', sector: 'AI Building Foyer' },
];

export const CampusMap: React.FC<CampusMapProps> = ({
  height = 'h-[440px]',
  showControls = true,
  highlightLocation,
  onSelectZone
}) => {
  const { isInsideCampus, isLocationActive, responders } = useC3SStore();
  const cctvCameras = useSafetyStore((s) => s.cctvCameras);
  const incidents = useSafetyStore((s) => s.incidents);
  const setSosModalOpen = useSafetyStore((s) => s.setSosModalOpen);
  const setSelectedCamera = useSafetyStore((s) => s.setSelectedCamera);

  // Map state
  const [activeMapId, setActiveMapId] = useState<'Campus_Map' | 'Main_GF' | 'AI_GF'>('Campus_Map');
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoadingSvg, setIsLoadingSvg] = useState<boolean>(true);

  // Layer filters
  const [showCameras, setShowCameras] = useState<boolean>(true);
  const [showResponders, setShowResponders] = useState<boolean>(true);
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  // Pan & Zoom Camera state
  const [zoom, setZoom] = useState<number>(1.25);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isAutoTracking, setIsAutoTracking] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Live Location & Movement Simulation state
  const [userPos, setUserPos] = useState<{ x: number; y: number }>({ x: 253, y: 606 });
  const [heading, setHeading] = useState<number>(340);
  const [isSimulatingWalk, setIsSimulatingWalk] = useState<boolean>(false);
  const [currentWaypointIdx, setCurrentWaypointIdx] = useState<number>(0);
  const [simSpeedMps] = useState<number>(1.4);

  // 1. Fetch the real vector SVG map
  useEffect(() => {
    let isCurrent = true;
    setIsLoadingSvg(true);

    const mapUrl = `/maps/${activeMapId}.svg`;
    fetch(mapUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (!isCurrent) return;
        setSvgContent(text);
        setIsLoadingSvg(false);
      })
      .catch((err) => {
        console.warn(`Could not load /maps/${activeMapId}.svg:`, err);
        setIsLoadingSvg(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [activeMapId]);

  // 2. Auto-Zoom & Auto-Follow: Keep camera smoothly centered on user location
  const centerOnUserLocation = useCallback((targetZoom = 2.1) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (!(w > 0 && h > 0)) return;

    // Relative to SVG viewBox
    const scaleFactor = Math.min(w / SVG_VIEWBOX.width, h / SVG_VIEWBOX.height) || 1;
    const centerViewportX = w / 2;
    const centerViewportY = h / 2;

    const userPixelX = userPos.x * scaleFactor;
    const userPixelY = userPos.y * scaleFactor;

    const nextPanX = centerViewportX - userPixelX * targetZoom;
    const nextPanY = centerViewportY - userPixelY * targetZoom;

    setZoom(targetZoom);
    setPan({ x: nextPanX, y: nextPanY });
    setIsAutoTracking(true);
  }, [userPos]);

  // Initial auto-zoom on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      centerOnUserLocation(1.85);
    }, 400);
    return () => clearTimeout(timer);
  }, [centerOnUserLocation]);

  // Auto-follow as user position moves
  useEffect(() => {
    if (!isAutoTracking) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (!(w > 0 && h > 0)) return;

    const scaleFactor = Math.min(w / SVG_VIEWBOX.width, h / SVG_VIEWBOX.height) || 1;
    const centerViewportX = w / 2;
    const centerViewportY = h / 2;

    const userPixelX = userPos.x * scaleFactor;
    const userPixelY = userPos.y * scaleFactor;

    setPan({
      x: centerViewportX - userPixelX * zoom,
      y: centerViewportY - userPixelY * zoom,
    });
  }, [userPos, zoom, isAutoTracking]);

  // 3. Movement Simulation Engine (Walking patrol along realistic campus nodes)
  useEffect(() => {
    if (!isSimulatingWalk) return;

    const interval = setInterval(() => {
      setUserPos((prev) => {
        const target = CAMPUS_WALK_WAYPOINTS[currentWaypointIdx];
        const dx = target.x - prev.x;
        const dy = target.y - prev.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Calculate heading angle
        const angleRad = Math.atan2(dx, -dy);
        const angleDeg = ((angleRad * 180) / Math.PI + 360) % 360;
        setHeading(Math.round(angleDeg));

        // If reached waypoint, advance to next
        if (dist < 8) {
          const nextIdx = (currentWaypointIdx + 1) % CAMPUS_WALK_WAYPOINTS.length;
          setCurrentWaypointIdx(nextIdx);
          return prev;
        }

        // Move 4.5 units per step (~1.4 m/s walking speed)
        const step = 4.5;
        const moveX = prev.x + (dx / dist) * step;
        const moveY = prev.y + (dy / dist) * step;

        return { x: moveX, y: moveY };
      });
    }, 80);

    return () => clearInterval(interval);
  }, [isSimulatingWalk, currentWaypointIdx]);

  // 4. Mouse & Touch Dragging Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy
    });
    // User manually panning temporarily disengages auto-follow
    setIsAutoTracking(false);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.90 : 1.10;
    const nextZoom = Math.max(0.7, Math.min(4.5, zoom * factor));
    setZoom(nextZoom);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(4.5, z * 1.25));
  const handleZoomOut = () => setZoom((z) => Math.max(0.7, z / 1.25));
  const handleResetZoom = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setIsAutoTracking(false);
  };

  // Active waypoint location name
  const currentWaypoint = CAMPUS_WALK_WAYPOINTS[currentWaypointIdx];

  // Campus Cameras projected coordinates on SVG
  const cameraNodes = useMemo(() => [
    { id: 'CAM-01', name: 'Main Gate 01 Turnstiles', x: 253, y: 590, status: 'ONLINE' },
    { id: 'CAM-02', name: 'South Boulevard Vehicle Lane', x: 330, y: 530, status: 'ONLINE' },
    { id: 'CAM-03', name: 'West Lawn & Sports Arena', x: 150, y: 220, status: 'ONLINE' },
    { id: 'CAM-04', name: 'Main Academic South Foyer', x: 420, y: 450, status: 'ONLINE' },
    { id: 'CAM-05', name: 'Central Atrium Open Courtyard', x: 510, y: 365, status: 'ONLINE' },
    { id: 'CAM-06', name: 'Central Library & Plaza', x: 510, y: 280, status: 'ONLINE' },
    { id: 'CAM-07', name: 'AI & CSE Innovation Lab Hub', x: 570, y: 120, status: 'ONLINE' },
    { id: 'CAM-08', name: 'East Campus Hostels Entry', x: 780, y: 280, status: 'ONLINE' },
    { id: 'CAM-09', name: 'Jubilee Gate 04 Perimeter', x: 60, y: 535, status: 'ONLINE' }
  ], []);

  // Guard positions on campus
  const guardNodes = useMemo(() => [
    { id: 'G-1', callsign: 'Guard 01 (Patrol Alpha)', x: 340, y: 490, role: 'Mobile Patrol' },
    { id: 'G-2', callsign: 'Guard 02 (Vikram Rathore)', x: 490, y: 380, role: 'Central QRF' },
    { id: 'G-3', callsign: 'Guard 03 (East Post)', x: 740, y: 310, role: 'Hostel Gate Post' },
    { id: 'G-4', callsign: 'Guard 04 (Main Gate)', x: 265, y: 615, role: 'Entry Control' },
  ], []);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      className={`relative w-full ${height} overflow-hidden rounded-2xl border border-slate-200 bg-[#F8FAFC] select-none shadow-xl cursor-${isDragging ? 'grabbing' : 'grab'}`}
    >
      {/* Architectural Subtle Grid Overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(to right, #E2E8F0 1px, transparent 1px), linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Top Left: Status & Building Selector Floating Badge */}
      <div className="absolute top-3 left-3 z-30 flex flex-wrap items-center gap-1.5 pointer-events-auto">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/95 px-3 py-1.5 backdrop-blur-md shadow-sm">
          <Compass className="h-3.5 w-3.5 text-blue-600 animate-spin" style={{ animationDuration: '24s' }} />
          <span className="text-xs font-black tracking-wide text-slate-800 uppercase">UniMap Live</span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 border border-emerald-200">
            LIGHT THEME
          </span>
        </div>

        {/* Building Toggle Pills */}
        <div className="flex items-center gap-1 bg-white/95 rounded-xl border border-slate-200 p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveMapId('Campus_Map')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMapId === 'Campus_Map'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            🗺️ Campus
          </button>
          <button
            type="button"
            onClick={() => setActiveMapId('Main_GF')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMapId === 'Main_GF'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            🏛️ Main GF
          </button>
          <button
            type="button"
            onClick={() => setActiveMapId('AI_GF')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMapId === 'AI_GF'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            💻 AI GF
          </button>
        </div>

        {/* Turn-by-Turn Full 3D Map Link */}
        <Link
          to="/map"
          className="hidden sm:flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 text-xs font-black text-blue-700 backdrop-blur-md transition-all shadow-sm"
        >
          <span>Full Turn-by-Turn</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Top Right: Layer Visibility & Instant SOS Trigger */}
      {showControls && (
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 pointer-events-auto">
          {/* Quick Instant Auto-Video SOS Button */}
          <button
            type="button"
            onClick={() => setSosModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-red-500/25 active:scale-95 transition-all cursor-pointer animate-pulse border border-red-400/40"
            title="Broadcast Immediate Emergency SOS with Automatic Video Proof"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-white" />
            <span>1-TAP SOS</span>
          </button>

          {/* Layer toggles */}
          <div className="hidden md:flex items-center gap-1 rounded-xl border border-slate-200 bg-white/95 p-1 backdrop-blur-md shadow-sm">
            <button
              type="button"
              onClick={() => setShowIncidents(!showIncidents)}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                showIncidents ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <AlertTriangle className="h-3 w-3" /> Alerts
            </button>
            <button
              type="button"
              onClick={() => setShowResponders(!showResponders)}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                showResponders ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Shield className="h-3 w-3" /> Guards
            </button>
            <button
              type="button"
              onClick={() => setShowCameras(!showCameras)}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                showCameras ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Camera className="h-3 w-3" /> CCTV
            </button>
          </div>
        </div>
      )}

      {/* Floating Tactical Bottom-Left Action HUD: Simulation & Auto-Follow */}
      <div className="absolute bottom-3 left-3 z-30 flex flex-wrap items-center gap-2 pointer-events-auto">
        {/* Auto-Track & Auto-Zoom Toggle Button */}
        <button
          type="button"
          onClick={() => {
            if (isAutoTracking) {
              setIsAutoTracking(false);
            } else {
              centerOnUserLocation(2.2);
            }
          }}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black tracking-wide backdrop-blur-md transition-all shadow-md cursor-pointer ${
            isAutoTracking
              ? 'bg-blue-600 text-white shadow-blue-500/25 border border-blue-500'
              : 'bg-white/95 text-slate-700 hover:bg-blue-50 hover:text-blue-600 border border-slate-200'
          }`}
          title="Auto-Follow keeps your moving location dead-centered with auto-zoom"
        >
          <LocateFixed className={`h-3.5 w-3.5 ${isAutoTracking ? 'animate-pulse' : ''}`} />
          <span>{isAutoTracking ? 'AUTO-TRACK: ON' : 'AUTO-TRACK: OFF'}</span>
          {isAutoTracking && <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />}
        </button>

        {/* Live Movement Simulation Button */}
        <button
          type="button"
          onClick={() => {
            setIsSimulatingWalk(!isSimulatingWalk);
            if (!isSimulatingWalk) {
              setIsAutoTracking(true);
            }
          }}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black tracking-wide backdrop-blur-md transition-all shadow-md cursor-pointer ${
            isSimulatingWalk
              ? 'bg-emerald-600 text-white shadow-emerald-500/25 border border-emerald-500 animate-pulse'
              : 'bg-white/95 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200'
          }`}
          title="Simulate realistic student movement walking across campus to test auto-tracking and camera glide"
        >
          {isSimulatingWalk ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          <span>{isSimulatingWalk ? 'WALKING IN PROGRESS' : 'SIMULATE WALK'}</span>
        </button>

        {/* Telemetry pill */}
        {isSimulatingWalk && (
          <div className="hidden lg:flex items-center gap-2 rounded-xl bg-slate-900/90 text-white px-3 py-1 text-[11px] font-mono shadow-md border border-slate-700">
            <span className="text-emerald-400 font-bold">1.4 m/s</span>
            <span className="text-slate-400">•</span>
            <span className="text-cyan-300 font-bold">{heading}° N</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-200 truncate max-w-[140px]">{currentWaypoint.sector}</span>
          </div>
        )}
      </div>

      {/* Floating Right: Zoom & Reset Stack */}
      <div className="absolute bottom-3 right-3 z-30 flex flex-col items-center gap-1 pointer-events-auto bg-white/95 backdrop-blur-xl rounded-xl border border-slate-200 p-1 shadow-lg">
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="h-[1px] w-5 bg-slate-200 my-0.5" />
        <button
          type="button"
          onClick={() => centerOnUserLocation(2.2)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
          title="Snap to Current Location & Auto-Zoom"
        >
          <LocateFixed className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleResetZoom}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer"
          title="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Interactive Map Canvas with Pan & Zoom Transform */}
      <div
        className="w-full h-full relative"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >
        {/* Render Vector SVG Background */}
        {svgContent ? (
          <div
            className="w-full h-full pointer-events-none select-none [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-mono">
            {isLoadingSvg ? 'Loading Campus Vector Map...' : 'Vector Map Unavailable'}
          </div>
        )}

        {/* Dynamic Interactive SVG Overlay for Live Entities */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          viewBox={`${SVG_VIEWBOX.minX} ${SVG_VIEWBOX.minY} ${SVG_VIEWBOX.width} ${SVG_VIEWBOX.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* User Direction Flashlight Cone Beam */}
            <linearGradient id="userMiniCompassBeam" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>

            {/* Radar glow */}
            <radialGradient id="userRadarGlowLight" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.7" />
              <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Real CCTV Camera Nodes */}
          {showCameras &&
            cameraNodes.map((cam) => (
              <g
                key={cam.id}
                className="cursor-pointer pointer-events-auto transition-transform hover:scale-125"
                onClick={() => {
                  setSelectedEntity(`Camera Node: ${cam.name} (${cam.status})`);
                  const matched = cctvCameras.find((c) => c.id === cam.id);
                  if (matched) setSelectedCamera(matched);
                }}
              >
                <circle cx={cam.x} cy={cam.y} r="12" fill="#047857" stroke="#ffffff" strokeWidth="2.5" />
                <circle cx={cam.x} cy={cam.y} r="4" fill="#ffffff" />
                <rect x={cam.x - 22} y={cam.y - 25} width="44" height="15" rx="4" fill="#065f46" />
                <text x={cam.x} y={cam.y - 14} fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                  {cam.id}
                </text>
              </g>
            ))}

          {/* Active Security Guards */}
          {showResponders &&
            guardNodes.map((guard) => (
              <g
                key={guard.id}
                className="cursor-pointer pointer-events-auto transition-transform hover:scale-125"
                onClick={() => setSelectedEntity(`${guard.callsign} • ${guard.role}`)}
              >
                <circle cx={guard.x} cy={guard.y} r="13" fill="#1e40af" stroke="#ffffff" strokeWidth="2.5" />
                <polygon
                  points={`${guard.x},${guard.y - 6} ${guard.x + 5},${guard.y + 4} ${guard.x - 5},${guard.y + 4}`}
                  fill="#ffffff"
                />
                <rect x={guard.x - 30} y={guard.y + 14} width="60" height="14" rx="4" fill="#1e3a8a" opacity="0.9" />
                <text x={guard.x} y={guard.y + 24} fill="#ffffff" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                  {guard.id}
                </text>
              </g>
            ))}

          {/* Active Emergency SOS Beacons */}
          {showIncidents &&
            incidents
              .filter((i) => i.status !== 'resolved')
              .map((inc) => (
                <g
                  key={inc.id}
                  className="cursor-pointer pointer-events-auto"
                  onClick={() => setSelectedEntity(`🚨 ${inc.title} (${inc.severity.toUpperCase()} PRIORITY)`)}
                >
                  <circle cx={inc.x || 420} cy={inc.y || 460} r="28" fill="#ef4444" opacity="0.25" className="animate-ping" />
                  <circle cx={inc.x || 420} cy={inc.y || 460} r="14" fill="#dc2626" stroke="#ffffff" strokeWidth="2.5" />
                  <text x={inc.x || 420} y={inc.y ? inc.y + 4 : 464} fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">
                    !
                  </text>
                  <rect x={(inc.x || 420) - 40} y={(inc.y || 460) - 26} width="80" height="16" rx="4" fill="#991b1b" />
                  <text x={inc.x || 420} y={(inc.y || 460) - 14} fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                    {inc.category.toUpperCase()} SOS
                  </text>
                </g>
              ))}

          {/* High-Precision Google/Apple Maps Location Puck (Dynamic Moving Position) */}
          <g className="cursor-pointer pointer-events-auto" onClick={() => setSelectedEntity('Your Current Position')}>
            {/* Accuracy Halo */}
            <circle
              cx={userPos.x}
              cy={userPos.y}
              r="34"
              fill="url(#userRadarGlowLight)"
              stroke="#0284c7"
              strokeWidth="1.2"
              strokeDasharray="4 3"
              opacity="0.6"
            />

            {/* Flashlight Heading Cone */}
            <g transform={`translate(${userPos.x}, ${userPos.y}) rotate(${heading})`}>
              <path d="M 0 0 L -22 -48 A 54 54 0 0 1 22 -48 Z" fill="url(#userMiniCompassBeam)" />
            </g>

            {/* Blue Center Puck */}
            <circle cx={userPos.x} cy={userPos.y} r="8.5" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx={userPos.x} cy={userPos.y} r="3.5" fill="#ffffff" />

            {/* Location Tag */}
            <rect
              x={userPos.x - 38}
              y={userPos.y + 13}
              width="76"
              height="18"
              rx="9"
              fill="#0f172a"
              stroke="#0284c7"
              strokeWidth="1.5"
            />
            <text x={userPos.x} y={userPos.y + 25} fill="#38bdf8" fontSize="8.5" fontWeight="bold" textAnchor="middle">
              📍 YOU (LIVE)
            </text>
          </g>
        </svg>
      </div>

      {/* Floating Selected Entity Inspector Card */}
      {selectedEntity && (
        <div className="absolute bottom-14 left-4 z-40 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-2.5 text-xs backdrop-blur-xl shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-blue-600 animate-pulse" />
            <span className="font-bold text-slate-800">{selectedEntity}</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedEntity(null)}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};