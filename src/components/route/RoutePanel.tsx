// src/components/route/RoutePanel.tsx
import { memo, useRef, type TouchEvent } from 'react';
import {
  Navigation,
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  ArrowDown,
  Compass,
  ArrowRight,
  ArrowLeft,
  X,
  Accessibility,
  Globe,
  ExternalLink,
  ShieldAlert,
  BookOpen,
  Flame,
  CheckCircle2,
  Footprints,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useSafetyStore } from '@/store/safetyStore';
import { isProctorRole } from '@/lib/viewerRole';
import { useCampusNavigation } from '@/hooks/useCampusNavigation';
import { parseRoomName } from '@/lib/roomParser';
import { formatTime, formatDistance } from '@/lib/routeBuilder';
import { formatDMS, formatDecimal, getGoogleMapsUrl, getOsmUrl } from '@/lib/geoProjection';

export interface RoutePanelProps { }

const POPULAR_SPOTS = [
  { id: 'room_J125', name: 'Classroom 101 (J125)', map: 'Main_FF', x: 133.6177, y: 337.6854, building: 'Main', floor: 1, category: 'Academic', desc: 'First Floor Room 101', color: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400', icon: BookOpen },
  { id: 'room_J126', name: 'Classroom 102 (J126)', map: 'Main_FF', x: 176.6123, y: 337.5387, building: 'Main', floor: 1, category: 'Academic', desc: 'First Floor Room 102', color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400', icon: BookOpen },
  { id: 'room_J101', name: 'Colloquium Hall (J101)', map: 'Main_FF', x: 341.3025, y: 489.9517, building: 'Main', floor: 1, category: 'Academic', desc: 'Conference Hall', color: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400', icon: BookOpen },
  { id: 'room_J001', name: 'Conclave (J001)', map: 'Main_GF', x: 406.8033, y: 487.5583, building: 'Main', floor: 0, category: 'Academic', desc: 'Seminar Room', color: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400', icon: BookOpen },
  { id: 'room_J102', name: 'SH-7 (J102)', map: 'Main_FF', x: 156.9493, y: 469.9952, building: 'Main', floor: 1, category: 'Academic', desc: 'Lecture Hall 7', color: 'bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400', icon: Flame },
  { id: 'Jubilee_Gate', name: 'Jubilee Gate', map: 'Campus_Map', x: 749.9669, y: 127.5277, building: 'Campus', floor: 0, category: 'Gate', desc: 'East Campus Access', color: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400', icon: Compass }
];

export const RoutePanel = memo(function RoutePanel({ }: RoutePanelProps) {
  const {
    isMobile,
    isBottomSheetExpanded,
    setIsBottomSheetExpanded,
    destination,
    currentLocation,
    isNavigating,
    isComputingRoute,
    navigationDirections,
    navigationSteps,
    activeStepIndex,
    setActiveStepIndex,
    handleDestinationSelect,
    handleDestinationClear,
    handleResetNavigation,
    handleStartNavigation,
    handleExitNavigation,
    nodesMap,
    edges,
    floors,
    routeDistance,
    routeDuration,
    accessibleOnly,
    setAccessibleOnly,
    isSimulating,
    setIsSimulating,
    compassHeading,
    setActiveSearchField
  } = useCampusNavigation();

  const isRouteActive = !!(destination && currentLocation);

  const renderDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'right':
        return <CornerUpRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'left':
        return <CornerUpLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'up':
        return <ArrowUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'down':
        return <ArrowDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'straight':
      default:
        return <ArrowUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  const cleanNodeName = (nodeId: string) => {
    const node = nodesMap[nodeId];
    if (!node) return nodeId;

    if (node.type === 'room' || node.type === 'landmark' || node.type === 'entrance' || node.type === 'exit') {
      const name = node.name || parseRoomName(node.id)?.name;
      if (name) {
        const lower = name.toLowerCase();
        if (!lower.includes('node') && !lower.includes('junction') && !lower.includes('road') && !lower.includes('corridor') && !lower.includes('intersection')) {
          return name;
        }
      }
    }

    const edgesList = edges || [];
    for (const edge of edgesList) {
      const from = edge.from_node ?? (edge as any).from;
      const to = edge.to_node ?? (edge as any).to;
      if (from === nodeId || to === nodeId) {
        const neighborId = from === nodeId ? to : from;
        const neighbor = nodesMap[neighborId];
        if (neighbor && (neighbor.type === 'room' || neighbor.type === 'landmark' || neighbor.type === 'entrance' || neighbor.type === 'exit')) {
          const name = neighbor.name || parseRoomName(neighborId)?.name;
          if (name) {
            const lower = name.toLowerCase();
            if (!lower.includes('node') && !lower.includes('junction') && !lower.includes('road') && !lower.includes('corridor') && !lower.includes('intersection')) {
              return name;
            }
          }
        }
      }
    }

    if (node.name) {
      const cleaned = node.name
        .replace(/intersection/gi, '')
        .replace(/corridor/gi, '')
        .replace(/road/gi, '')
        .replace(/node/gi, '')
        .replace(/junction/gi, '')
        .replace(/  +/g, ' ')
        .trim();
      if (cleaned) return cleaned;
    }

    return 'Walkway Path';
  };

  const getStepLabel = (step: any, index: number) => {
    let startName = cleanNodeName(step.start_node);
    const endName = cleanNodeName(step.end_node);
    if (startName === endName) {
      const node = nodesMap[step.start_node];
      if (node && node.name) {
        const cleaned = node.name
          .replace(/intersection/gi, '')
          .replace(/corridor/gi, '')
          .replace(/road/gi, '')
          .replace(/node/gi, '')
          .replace(/junction/gi, '')
          .replace(/  +/g, ' ')
          .trim();
        if (cleaned) {
          startName = cleaned;
        } else {
          startName = 'Walkway';
        }
      } else {
        startName = 'Walkway';
      }
    }
    return {
      title: `Step ${String(index + 1).padStart(2, '0')}`,
      desc: `${startName} → ${endName}`
    };
  };

  const getMapDisplayName = (mapId: string | null) => {
    if (!mapId) return 'Campus';
    if (mapId === 'Campus_Map') return 'Campus Map';
    const floorMeta = floors.find(f => f.map === mapId);
    if (floorMeta) {
      return `${floorMeta.building.toUpperCase()} • ${floorMeta.floor === 0 ? 'GF' : `F${floorMeta.floor}`}`;
    }
    return mapId.replace('_', ' ');
  };

  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current === null) return;
    const currentY = e.changedTouches[0].clientY;
    const diffY = currentY - touchStartY.current;
    const threshold = 40;
    if (diffY < -threshold) {
      setIsBottomSheetExpanded(true);
    } else if (diffY > threshold) {
      setIsBottomSheetExpanded(false);
    }
    touchStartY.current = null;
  };

  // Mobile Bottom Sheet
  if (isMobile) {
    return (
      <div
        data-lenis-prevent
        className={`fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#0A0F1D]/95 backdrop-blur-2xl rounded-t-[32px] shadow-2xl border-t border-slate-200/90 dark:border-white/10 z-30 transition-all duration-300 ease-out flex flex-col ${
          isBottomSheetExpanded ? 'translate-y-0 h-[78vh]' : 'translate-y-[calc(78vh-130px)] h-[78vh]'
        }`}
      >
        {/* Drag Handle */}
        <div
          onClick={() => setIsBottomSheetExpanded(!isBottomSheetExpanded)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="w-full py-3 flex justify-center cursor-pointer select-none shrink-0"
        >
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        {isNavigating ? (
          // Active Mobile Turn-by-Turn Mode
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header bar */}
            <div className="px-5 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-white/10 shrink-0">
              <div className="flex flex-col min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {isComputingRoute ? 'Computing...' : formatTime(routeDuration)}
                  </span>
                  {!isComputingRoute && (
                    <span className="text-xs font-bold text-slate-400">
                      ({formatDistance(routeDistance)})
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mt-0.5">
                  Step {activeStepIndex + 1} of {navigationSteps.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExitNavigation}
                  className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 font-bold text-xs transition-colors cursor-pointer"
                >
                  Exit
                </button>
              </div>
            </div>

            {/* Turn by turn list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              <div className="flex items-center gap-2 mb-2">
                <button
                  disabled={activeStepIndex === 0}
                  onClick={() => setActiveStepIndex((p) => Math.max(0, p - 1))}
                  className="flex-1 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs disabled:opacity-40 transition-all cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    if (activeStepIndex === navigationSteps.length - 1) {
                      handleResetNavigation();
                    } else {
                      setActiveStepIndex((p) => Math.min(navigationSteps.length - 1, p + 1));
                    }
                  }}
                  className="flex-1 h-9 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer"
                >
                  {activeStepIndex === navigationSteps.length - 1 ? 'Finish Route' : 'Next Step'}
                </button>
              </div>

              {navigationDirections.map((step, index) => (
                <div
                  key={index}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    {renderDirectionIcon(step.direction)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {step.instruction}
                    </p>
                    {step.distance && (
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">{step.distance}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Mobile Route Summary when destination is picked
          <div className="flex-1 flex flex-col p-5 overflow-y-auto space-y-3 custom-scrollbar">
            {isRouteActive && (
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-lg font-black text-slate-900 dark:text-white">
                    {formatTime(routeDuration)}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {formatDistance(routeDistance)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleStartNavigation}
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                >
                  <Navigation className="w-4 h-4 fill-white" />
                  <span>Start Turn-by-Turn Navigation</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // DESKTOP VIEW
  return (
    <div className="space-y-4">
      {/* 1. Turn-by-Turn Active Navigation Mode */}
      {isNavigating && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Turn-by-Turn Navigation
              </h3>
            </div>
            <button
              type="button"
              onClick={handleResetNavigation}
              className="text-[11px] font-bold text-red-500 hover:text-red-600 px-2.5 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            >
              End Navigation
            </button>
          </div>

          {/* Compass & Simulation Control Banner */}
          <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-xs">
                <Compass
                  className="w-5 h-5 text-emerald-600 dark:text-emerald-400 transition-transform duration-300 ease-out"
                  style={{ transform: `rotate(${compassHeading}deg)` }}
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {isSimulating ? 'Simulated Route Walk' : 'Live Direction Tracking'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  Heading {Math.round(compassHeading)}° • {activeStepIndex + 1} of {navigationSteps.length}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSimulating(!isSimulating)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1.5 shadow-xs hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer"
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isSimulating ? 'Pause' : 'Simulate'}</span>
            </button>
          </div>

          {/* Step Timeline */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Navigation Segments
            </span>
            <div className="relative pl-3.5 space-y-2.5">
              <div className="absolute left-[7px] top-3.5 bottom-3.5 w-[2px] bg-slate-200 dark:bg-white/10" />

              {navigationSteps.map((step, idx) => {
                const isActive = idx === activeStepIndex;
                const { title, desc } = getStepLabel(step, idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveStepIndex(idx)}
                    className={`w-full text-left relative flex items-start gap-3 p-3 rounded-2xl transition-all border cursor-pointer ${
                      isActive
                        ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-sm'
                        : 'bg-white/80 dark:bg-slate-900/60 border-slate-200/70 dark:border-white/5 hover:bg-slate-100/60'
                    }`}
                  >
                    <div
                      className={`absolute -left-[11px] top-4 w-2.5 h-2.5 rounded-full border-2 ${
                        isActive
                          ? 'bg-blue-600 border-white ring-2 ring-blue-300'
                          : 'bg-slate-300 dark:bg-slate-700 border-white dark:border-slate-900'
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                          {title}
                        </span>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                          {getMapDisplayName(step.map)}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                        {desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Step Detailed Guidance */}
          {navigationSteps[activeStepIndex] && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Walking Maneuvers
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {navigationDirections.length} directions
                </span>
              </div>

              {/* Prev / Next Segment buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={activeStepIndex === 0}
                  onClick={() => setActiveStepIndex((p) => Math.max(0, p - 1))}
                  className="h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-bold text-xs disabled:opacity-40 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer shadow-xs"
                >
                  Previous Segment
                </button>
                <button
                  type="button"
                  disabled={activeStepIndex === navigationSteps.length - 1}
                  onClick={() => setActiveStepIndex((p) => Math.min(navigationSteps.length - 1, p + 1))}
                  className="h-9 rounded-xl bg-blue-600 text-white font-bold text-xs disabled:opacity-40 hover:bg-blue-700 active:scale-95 transition-all cursor-pointer shadow-md shadow-blue-500/25"
                >
                  Next Segment
                </button>
              </div>

              <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                {navigationDirections.map((step, index) => (
                  <div key={index} className="flex items-start gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
                      {renderDirectionIcon(step.direction)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                        {step.instruction}
                      </p>
                      {step.distance && (
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">{step.distance}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Route Preview Mode (When destination is active but navigation has not started) */}
      {!isNavigating && isRouteActive && (
        <div className="space-y-3.5 border-t border-slate-200/80 dark:border-white/10 pt-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-transparent border border-blue-500/20 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {isComputingRoute ? 'Computing...' : formatTime(routeDuration)}
                  </span>
                  {!isComputingRoute && (
                    <span className="text-xs font-bold text-slate-400">
                      ({formatDistance(routeDistance)})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                    {accessibleOnly ? '♿ Step-Free Route' : '🚶 Multi-Floor Connected'}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">
                    {navigationSteps.length} {navigationSteps.length === 1 ? 'floor' : 'floors'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartNavigation}
                disabled={isComputingRoute}
                className="h-11 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Navigation className="w-4 h-4 fill-white" />
                <span>Start</span>
              </button>
            </div>

            {/* Origin & Destination badges */}
            <div className="space-y-2 pt-2 border-t border-blue-100 dark:border-white/5 text-xs font-medium">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-bold truncate">{currentLocation.name}</span>
                <span className="text-[10px] text-slate-400 uppercase font-mono ml-auto shrink-0">
                  {currentLocation.map ? currentLocation.map.replace('_', ' ') : 'Campus'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                <span className="font-bold truncate">{destination.name}</span>
                <span className="text-[10px] text-slate-400 uppercase font-mono ml-auto shrink-0">
                  {destination.map ? destination.map.replace('_', ' ') : 'Campus'}
                </span>
              </div>
            </div>
          </div>

          {/* Multi-floor transitions */}
          {navigationSteps.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Route Floor Transitions
              </span>
              <div className="flex flex-col gap-2">
                {navigationSteps.map((step, idx) => {
                  const isActive = idx === activeStepIndex;
                  const { title, desc } = getStepLabel(step, idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveStepIndex(idx)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isActive
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-white/5 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                            {title}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                            {getMapDisplayName(step.map)}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                          {desc}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Empty State: Popular Destinations & Highlights (when no route is active) */}
      {!isNavigating && !isRouteActive && (
        <div className="space-y-3.5 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Quick Highlights
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {POPULAR_SPOTS.map((loc) => {
              const Icon = loc.icon;
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => handleDestinationSelect(loc)}
                  className="bg-white dark:bg-slate-900/80 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 border border-slate-200/80 dark:border-white/5 hover:border-blue-400 dark:hover:border-blue-500/40 rounded-2xl p-3.5 shadow-xs flex items-center gap-3.5 transition-all text-left active:scale-[0.99] group cursor-pointer"
                >
                  <div className={`w-10 h-10 rounded-2xl ${loc.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {loc.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {loc.desc}
                    </p>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg shrink-0">
                    {loc.building} • F{loc.floor}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

export default RoutePanel;
