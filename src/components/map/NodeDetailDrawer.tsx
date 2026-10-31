// src/components/map/NodeDetailDrawer.tsx
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Navigation,
  AlertTriangle,
  X,
  Compass,
  ArrowRight,
  Layers,
  Building2,
  Copy,
  Check,
  Footprints
} from 'lucide-react';
import { useSafetyStore } from '@/store/safetyStore';
import { useCampusNavigation } from '@/hooks/useCampusNavigation';
import type { MapNode } from '@/types';

export function NodeDetailDrawer() {
  const selectedNode = useSafetyStore((s) => s.selectedNodeForDetail);
  const setSelectedNode = useSafetyStore((s) => s.setSelectedNodeForDetail);
  const setSosModalOpen = useSafetyStore((s) => s.setSosModalOpen);

  const {
    currentLocation,
    handleDestinationSelect,
    handleCurrentLocationSelect,
    nodesMap,
    edges
  } = useCampusNavigation();

  const [copied, setCopied] = React.useState(false);

  if (!selectedNode) return null;

  // Find adjacent connected nodes
  const connectedEdges = edges.filter(
    (e) => e.from_node === selectedNode.id || e.to_node === selectedNode.id
  );
  const neighbors = connectedEdges.map((e) => {
    const neighborId = e.from_node === selectedNode.id ? e.to_node : e.from_node;
    const neighborNode = nodesMap[neighborId];
    return {
      id: neighborId,
      name: neighborNode?.name || neighborId,
      type: e.type,
      distance: Math.round(e.distance ?? (e as any).weight ?? 0)
    };
  });

  const handleCopy = () => {
    const text = `${selectedNode.name || selectedNode.id} [${selectedNode.map}] (x: ${selectedNode.x}, y: ${selectedNode.y})`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSetDestination = () => {
    handleDestinationSelect(selectedNode);
    setSelectedNode(null);
  };

  const handleSetStart = () => {
    handleCurrentLocationSelect(selectedNode);
    setSelectedNode(null);
  };

  const handleReportHere = () => {
    setSelectedNode(null);
    setSosModalOpen(true);
  };

  const buildingName = selectedNode.map?.startsWith('AI')
    ? 'AI & Computer Science Complex'
    : selectedNode.map?.startsWith('Main')
    ? 'Main Academic Block'
    : 'Campus Grounds';

  const floorLabel = selectedNode.map?.includes('GF')
    ? 'Ground Floor (Level 0)'
    : selectedNode.map?.includes('FF')
    ? 'First Floor (Level 1)'
    : selectedNode.map?.includes('TF')
    ? 'Third Floor (Level 3)'
    : selectedNode.map?.includes('SF')
    ? 'Second Floor (Level 2)'
    : 'Outdoor / Ground';

  // Compute straight-line estimate if current location is known
  let estDistance: number | null = null;
  if (currentLocation && currentLocation.x != null && currentLocation.y != null) {
    const dx = selectedNode.x - currentLocation.x;
    const dy = selectedNode.y - currentLocation.y;
    estDistance = Math.round(Math.sqrt(dx * dx + dy * dy) * 0.85); // approx meter calibration
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 p-5 shadow-2xl shadow-slate-950/25 backdrop-blur-2xl text-slate-900 dark:text-slate-100 transition-colors"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-500/30 bg-orange-500/10 text-[#ff602e] shadow-lg shadow-orange-500/10">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#ff602e] uppercase">
                  {selectedNode.type || 'CAMPUS NODE'}
                </span>
                <span className="font-mono text-[10px] text-slate-400">ID: {selectedNode.id}</span>
              </div>
              <h3 className="mt-1 text-base font-black text-slate-900 dark:text-white leading-tight">
                {selectedNode.name || selectedNode.id}
              </h3>
            </div>
          </div>

          <button
            onClick={() => setSelectedNode(null)}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Location Specs & Distance Estimate */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-slate-200/70 dark:border-white/5 bg-slate-50 dark:bg-slate-950/50 p-2.5">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Building2 className="h-3.5 w-3.5 text-blue-500" />
              <span className="font-semibold uppercase text-[10px]">FACILITY</span>
            </div>
            <p className="mt-1 font-bold text-slate-900 dark:text-slate-200 truncate">{buildingName}</p>
          </div>

          <div className="rounded-xl border border-slate-200/70 dark:border-white/5 bg-slate-50 dark:bg-slate-950/50 p-2.5">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Layers className="h-3.5 w-3.5 text-emerald-500" />
              <span className="font-semibold uppercase text-[10px]">FLOOR LEVEL</span>
            </div>
            <p className="mt-1 font-bold text-slate-900 dark:text-slate-200 truncate">{floorLabel}</p>
          </div>
        </div>

        {/* Distance from Current Location if available */}
        {estDistance !== null && (
          <div className="mt-2 flex items-center justify-between rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 px-3 py-1.5 text-xs text-blue-800 dark:text-blue-300">
            <div className="flex items-center gap-2">
              <Footprints className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold">
                Approx. ~{Math.max(1, Math.round(estDistance / 75))} min walk from your start point
              </span>
            </div>
            <span className="font-bold font-mono">~{estDistance}m</span>
          </div>
        )}

        {/* Coordinates Banner */}
        <div className="mt-2.5 flex items-center justify-between rounded-xl border border-slate-200/70 dark:border-white/5 bg-slate-100/60 dark:bg-slate-950/30 px-3 py-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 truncate">
            <Compass className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span className="truncate">
              SVG: ({Math.round(selectedNode.x)}, {Math.round(selectedNode.y)})
              {selectedNode.lat ? ` • GPS: ${selectedNode.lat.toFixed(5)}, ${selectedNode.lng?.toFixed(5)}` : ''}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline shrink-0 ml-2 cursor-pointer"
            title="Copy coordinates"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Connected Routes / Neighbors preview */}
        {neighbors.length > 0 && (
          <div className="mt-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              CONNECTED NODES ({neighbors.length})
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
              {neighbors.slice(0, 5).map((nbr) => (
                <span
                  key={nbr.id}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 font-mono text-[10px] text-slate-700 dark:text-slate-300"
                >
                  <ArrowRight className="h-2.5 w-2.5 text-orange-500" />
                  <span className="max-w-[120px] truncate">{nbr.name}</span>
                  <span className="text-slate-400">({nbr.distance}m)</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            onClick={handleSetDestination}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-[#ff602e] hover:from-orange-600 hover:to-[#ea580c] px-3 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <Navigation className="h-3.5 w-3.5" />
            <span>NAVIGATE</span>
          </button>

          <button
            onClick={handleSetStart}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 px-3 py-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 active:scale-95 transition-all cursor-pointer"
          >
            <MapPin className="h-3.5 w-3.5 text-emerald-600" />
            <span>SET START</span>
          </button>

          <button
            onClick={handleReportHere}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 px-3 py-2.5 text-xs font-bold text-rose-800 dark:text-rose-300 active:scale-95 transition-all cursor-pointer"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
            <span>REPORT SOS</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
