// src/components/safety/IncidentCard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  ShieldAlert,
  HeartPulse,
  Wrench,
  Navigation,
  Clock,
  MapPin,
  CheckCircle2,
  ExternalLink,
  X,
  Phone,
  Camera,
  Video,
  Sparkles,
  Radio,
  UserCheck
} from 'lucide-react';
import { useSafetyStore } from '@/store/safetyStore';
import { useCampusNavigation } from '@/hooks/useCampusNavigation';
import { formatDMS, getGoogleMapsUrl, getOsmUrl } from '@/lib/geoProjection';

export function IncidentCard() {
  const activeDashboard = useSafetyStore((s) => s.activeDashboard);
  const setActiveDashboard = useSafetyStore((s) => s.setActiveDashboard);
  const selectedIncident = useSafetyStore((s) => s.selectedIncident);
  const setSelectedIncident = useSafetyStore((s) => s.setSelectedIncident);
  const dispatchResponder = useSafetyStore((s) => s.dispatchResponder);
  const advanceResponderStatus = useSafetyStore((s) => s.advanceResponderStatus);
  const navigate = useNavigate();

  const { routeToSosIncident } = useCampusNavigation();
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNowTimestamp(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Hide confidential SOS details from public users in nav mode
  if (activeDashboard === 'nav' || !selectedIncident) return null;

  const getCategoryIcon = () => {
    switch (selectedIncident.category) {
      case 'medical':
        return <HeartPulse className="w-5 h-5 text-rose-500" />;
      case 'security':
        return <ShieldAlert className="w-5 h-5 text-amber-500" />;
      case 'fire':
        return <Flame className="w-5 h-5 text-orange-500" />;
      case 'infrastructure':
      default:
        return <Wrench className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityBadge = () => {
    switch (selectedIncident.severity) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
      default:
        return 'bg-amber-500 text-white';
    }
  };

  const timeAgo = () => {
    const mins = Math.max(1, Math.round((nowTimestamp - selectedIncident.timestamp) / 60000));
    return `${mins}m ago`;
  };

  const handleRouteToIncident = () => {
    dispatchResponder(selectedIncident.id, 'QRF Tactical Patrol 1');
    setActiveDashboard('nav');

    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/map')) {
      navigate(`/map?incident=${encodeURIComponent(selectedIncident.id)}`);
    } else {
      routeToSosIncident(selectedIncident);
      setSelectedIncident(null);
    }
  };

  const isResolved = selectedIncident.status === 'resolved';
  const isEnRoute = selectedIncident.responderStatus === 'enroute';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 w-full max-w-md bg-slate-900/95 text-slate-100 backdrop-blur-2xl border border-red-500/40 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden"
      >
        {/* Top Emergency Header */}
        <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 px-5 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider">Live SOS Incident</span>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${getSeverityBadge()}`}>
              {selectedIncident.severity}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/80 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo()}
            </span>
            <button
              onClick={() => setSelectedIncident(null)}
              className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 shadow-inner">
              {getCategoryIcon()}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-black text-white leading-tight">
                {selectedIncident.title}
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {selectedIncident.description}
              </p>
            </div>
          </div>

          {/* AI LLM Triage Badge if available */}
          {selectedIncident.evidence?.aiClassification && (
            <div className="p-3 rounded-2xl border border-cyan-500/30 bg-cyan-950/30 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-cyan-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AI TRIAGE // {selectedIncident.evidence.aiClassification.category?.toUpperCase()}</span>
                </span>
                <span className="font-mono text-[10px] bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  {Math.round((selectedIncident.evidence.aiClassification.confidence || 0.95) * 100)}% CONFIDENCE
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {selectedIncident.evidence.aiClassification.reasoning}
              </p>
              {selectedIncident.evidence.aiClassification.recommendedAction && (
                <p className="text-[11px] text-emerald-400 font-semibold pt-1 border-t border-cyan-500/20">
                  Rec: {selectedIncident.evidence.aiClassification.recommendedAction}
                </p>
              )}
            </div>
          )}

          {/* Auto-Captured Evidence: Photo Snapshot & Video Clip */}
          {selectedIncident.evidence && (selectedIncident.evidence.photoUrl || selectedIncident.evidence.videoUrl) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Camera className="w-3 h-3 text-emerald-400" />
                  Auto-Captured Evidence
                </p>
                {selectedIncident.evidence.fightConfidence && (
                  <span className="text-[10px] font-mono bg-red-950 text-red-300 border border-red-800 px-1.5 py-0.5 rounded">
                    Kaggle RWF-2000: {selectedIncident.evidence.fightConfidence}%
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedIncident.evidence.photoUrl && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black aspect-video flex items-center justify-center">
                    <img
                      src={selectedIncident.evidence.photoUrl}
                      alt="Incident Snapshot"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-mono text-emerald-400 border border-white/10">
                      <Camera className="w-2.5 h-2.5" />
                      <span>PHOTO EVIDENCE</span>
                    </div>
                  </div>
                )}

                {selectedIncident.evidence.videoUrl && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black aspect-video flex items-center justify-center">
                    <video
                      src={selectedIncident.evidence.videoUrl}
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-mono text-cyan-400 border border-white/10">
                      <Video className="w-2.5 h-2.5" />
                      <span>CCTV CLIP</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location & GPS Info */}
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                {selectedIncident.map.replace('_', ' ')} • Floor {selectedIncident.floor === 0 ? 'Ground' : selectedIncident.floor}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={getOsmUrl(selectedIncident.lat, selectedIncident.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"
                >
                  <span>OSM</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <span className="text-slate-600">•</span>
                <a
                  href={getGoogleMapsUrl(selectedIncident.lat, selectedIncident.lng, selectedIncident.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
                >
                  <span>Satellite</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              {formatDMS(selectedIncident.lat, selectedIncident.lng)}
            </div>

            {selectedIncident.reportedBy && (
              <div className="text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-800 flex items-center justify-between">
                <span>Reported by: {selectedIncident.reportedBy}</span>
                {selectedIncident.phone && (
                  <a href={`tel:${selectedIncident.phone}`} className="text-emerald-400 font-bold flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5" /> Call
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Responder Dispatch & En Route Status Banner */}
          {selectedIncident.responderAssigned && (
            <div className="p-3 rounded-2xl border border-blue-500/40 bg-blue-950/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-spin" />
                <div>
                  <p className="font-bold text-white">{selectedIncident.responderAssigned}</p>
                  <p className="text-[10px] font-mono text-cyan-300 uppercase">
                    STATUS: {selectedIncident.responderStatus || 'DISPATCHED'} {selectedIncident.responderEta ? `• ETA: ${selectedIncident.responderEta}` : ''}
                  </p>
                </div>
              </div>

              {isEnRoute && (
                <button
                  onClick={() => advanceResponderStatus(selectedIncident.id, 'on_scene')}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  On Scene
                </button>
              )}
            </div>
          )}

          {/* Notified Responders: Guard, Faculty, Proctor */}
          {selectedIncident.notifiedResponders && selectedIncident.notifiedResponders.length > 0 && (
            <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs">
              <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold mb-1 flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                Auto-Dispatched Responders
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedIncident.notifiedResponders.map((resp, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 font-medium"
                  >
                    {resp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            {!isResolved ? (
              <>
                <button
                  type="button"
                  onClick={handleRouteToIncident}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 active:scale-95 transition-all cursor-pointer"
                >
                  <Navigation className="w-4 h-4 fill-white" />
                  <span>{isEnRoute ? 'ROUTE ON MAP' : 'DISPATCH QRF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => advanceResponderStatus(selectedIncident.id, 'resolved')}
                  className="py-3 px-3 rounded-2xl bg-slate-800 hover:bg-emerald-950/60 hover:text-emerald-400 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                  title="Mark incident as resolved"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Resolve</span>
                </button>
              </>
            ) : (
              <span className="w-full py-3 rounded-2xl bg-emerald-500/20 text-emerald-400 text-center font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-500/40">
                <CheckCircle2 className="w-4 h-4" />
                <span>Incident Resolved &amp; Archived</span>
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
