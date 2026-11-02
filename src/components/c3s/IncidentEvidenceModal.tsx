// src/components/c3s/IncidentEvidenceModal.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Camera,
  Video,
  Sparkles,
  MapPin,
  Clock,
  Shield,
  ExternalLink,
  Download,
  CheckCircle2,
  Maximize2
} from 'lucide-react';
import type { C3SIncident } from '@/lib/mock-data/incidents';

interface IncidentEvidenceModalProps {
  incident: C3SIncident | null;
  isOpen: boolean;
  onClose: () => void;
}

export function IncidentEvidenceModal({ incident, isOpen, onClose }: IncidentEvidenceModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'photo' | 'video'>('all');
  const [isFullscreenPhoto, setIsFullscreenPhoto] = useState(false);

  if (!isOpen || !incident) return null;

  const photo =
    incident.photoUrl ||
    incident.evidence?.photoUrl ||
    'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80';

  const video =
    incident.videoUrl ||
    incident.evidence?.videoUrl ||
    '/videos/cctv_recorded_incident.mp4';

  const confidence = incident.evidence?.fightConfidence || 92;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 px-6 py-4 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black tracking-wider uppercase text-rose-200">
                    {incident.id}
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/20">
                    {incident.priority}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  {incident.title}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white cursor-pointer transition-colors"
              aria-label="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Subheader Meta & Tabs */}
          <div className="px-6 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                {incident.location}
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {incident.reportedAt}
              </span>
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-slate-900 border border-slate-800 p-1">
              {(['all', 'video', 'photo'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab === 'all' ? 'Split View' : tab === 'video' ? 'CCTV Video' : 'Photo Snapshot'}
                </button>
              ))}
            </div>
          </div>

          {/* Media Content Body */}
          <div className="p-6 overflow-y-auto space-y-5">
            <div className={`grid gap-4 ${activeTab === 'all' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              {/* CCTV Video Clip Player */}
              {(activeTab === 'all' || activeTab === 'video') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <Video className="w-4 h-4 text-cyan-400" />
                      Live CCTV Incident Footage
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800 px-2 py-0.5 rounded">
                      STREAM ACTIVE • 1080p
                    </span>
                  </div>

                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center shadow-inner group">
                    <video
                      src={video}
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />

                    {/* Camera OSD Watermark Overlay */}
                    <div className="absolute top-2 left-2 pointer-events-none flex items-center gap-1.5 bg-black/80 backdrop-blur-xs px-2 py-1 rounded-md text-[10px] font-mono text-emerald-400 border border-white/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      <span>CAM-SEC // {incident.zone || 'SECTOR-01'}</span>
                    </div>

                    <div className="absolute bottom-2 right-2 pointer-events-none bg-black/80 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 border border-white/10">
                      REC: {incident.reportedAt}
                    </div>
                  </div>
                </div>
              )}

              {/* Photo Evidence Snapshot */}
              {(activeTab === 'all' || activeTab === 'photo') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <Camera className="w-4 h-4 text-emerald-400" />
                      Photographic Forensic Snapshot
                    </span>
                    <a
                      href={photo}
                      download={`C3S_Evidence_${incident.id}.jpg`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export</span>
                    </a>
                  </div>

                  <div
                    onClick={() => setIsFullscreenPhoto(true)}
                    className="relative rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center shadow-inner cursor-zoom-in group"
                  >
                    <img
                      src={photo}
                      alt="Incident Evidence Snapshot"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Snapshot Telemetry Overlay */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/80 backdrop-blur-xs px-2 py-1 rounded-md text-[10px] font-mono text-emerald-400 border border-white/10">
                      <Camera className="w-3 h-3 text-emerald-400" />
                      <span>HIGH-RES CAPTURE</span>
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-black/80 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-300 border border-white/10">
                      <span>Node #{incident.location}</span>
                      <span className="text-cyan-400 flex items-center gap-1">
                        <Maximize2 className="w-3 h-3" /> Tap to zoom
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AI Intelligence & Responder Telemetry */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300 font-bold">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                  <span>C3S NEURAL RECOGNITION (Kaggle RWF-2000 AI)</span>
                </span>
                <span className="font-mono text-xs bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full">
                  {confidence}% CONFIDENCE
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Optical telemetry confirms incident signature at {incident.location}. Dispatched telemetry synced to Nearest Guard, Faculty Warden, and Chief Proctorial SOC.
              </p>
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-400">
                  Assigned Responder: <strong className="text-blue-400">{incident.assignedResponder || 'QRF Tactical Unit'}</strong>
                </span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Telemetry Delivered to Guard, Faculty & Proctor
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Fullscreen Photo Lightbox Modal */}
        {isFullscreenPhoto && (
          <div
            onClick={() => setIsFullscreenPhoto(false)}
            className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <img
              src={photo}
              alt="Fullscreen Evidence"
              className="max-w-full max-h-[92vh] object-contain rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setIsFullscreenPhoto(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}

