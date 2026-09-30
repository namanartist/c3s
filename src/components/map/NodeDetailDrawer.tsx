// src/components/map/NodeDetailDrawer.tsx
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Navigation,
  AlertTriangle,
  Shield,
  X,
  Compass,
  ArrowRight,
  Layers,
  Building2,
  Copy,
  Check
} from 'lucide-react';
import { useSafetyStore } from '@/store/safetyStore';
import { useCampusNavigation } from '@/hooks/useCampusNavigation';
import type { MapNode } from '@/types';

export function NodeDetailDrawer() {
  const selectedNode = useSafetyStore((s) => s.selectedNodeForDetail);
  const setSelectedNode = useSafetyStore((s) => s.setSelectedNodeForDetail);
  const setSosModalOpen = useSafetyStore((s) => s.setSosModalOpen);

  const {
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
    : selectedNode.map?.includes('SF')
    ? 'Second Floor (Level 2)'
    : 'Outdoor / Ground';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg rounded-2xl border border-slate-700/80 bg-slate-900/95 p-5 shadow-2xl shadow-black/80 backdrop-blur-xl text-slate-100"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-950/40 text-cyan-400 shadow-lg shadow-cyan-500/10">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300 uppercase">
                  {selectedNode.type || 'NODE'}
                </span>
                <span className="font-mono text-[10px] text-slate-400">ID: {selectedNode.id}</span>
              </div>
              <h3 className="mt-1 text-base font-black text-white leading-tight">
                {selectedNode.name || selectedNode.id}
              </h3>
            </div>
          </div>

          <button
            onClick={() => setSelectedNode(null)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Location Specs */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Building2 className="h-3.5 w-3.5 text-slate-500" />
              <span className="font-semibold uppercase text-[10px]">FACILITY</span>
            </div>
            <p className="mt-1 font-bold text-slate-200 truncate">{buildingName}</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Layers className="h-3.5 w-3.5 text-slate-500" />
              <span className="font-semibold uppercase text-[10px]">FLOOR LEVEL</span>
            </div>
            <p className="mt-1 font-bold text-slate-200 truncate">{floorLabel}</p>
          </div>
        </div>

        {/* Coordinates Banner */}
        <div className="mt-2.5 flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/40 px-3 py-2 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Compass className="h-3.5 w-3.5 text-cyan-400" />
            <span>
              SVG: X={Math.round(selectedNode.x)} Y={Math.round(selectedNode.y)}
              {selectedNode.lat ? ` • GPS: ${selectedNode.lat.toFixed(5)}, ${selectedNode.lng?.toFixed(5)}` : ''}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
            title="Copy coordinates"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Connected Routes / Neighbors preview */}
        {neighbors.length > 0 && (
          <div className="mt-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              CONNECTED NODES ({neighbors.length})
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
              {neighbors.slice(0, 5).map((nbr) => (
                <span
                  key={nbr.id}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-800/60 px-2 py-0.5 font-mono text-[10px] text-slate-300"
                >
                  <ArrowRight className="h-2.5 w-2.5 text-cyan-400" />
                  <span className="max-w-[120px] truncate">{nbr.name}</span>
                  <span className="text-slate-500">({nbr.distance}m)</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            onClick={handleSetDestination}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-600 to-blue-600 px-3 py-2.5 text-xs font-black text-white shadow-lg shadow-cyan-600/20 hover:from-cyan-500 hover:to-blue-500 active:scale-95 transition-all"
          >
            <Navigation className="h-3.5 w-3.5" />
            <span>NAVIGATE</span>
          </button>

          <button
            onClick={handleSetStart}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 active:scale-95 transition-all"
          >
            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
            <span>SET START</span>
          </button>

          <button
            onClick={handleReportHere}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-900/60 active:scale-95 transition-all"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            <span>REPORT SOS</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
