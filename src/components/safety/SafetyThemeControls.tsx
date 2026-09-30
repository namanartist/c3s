// src/components/safety/SafetyThemeControls.tsx
import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Layers,
  Compass,
  Box,
  Moon,
  ShieldAlert,
  Radio,
  Map as MapIcon,
  Globe,
  AlertCircle
} from 'lucide-react';
import { useSafetyStore } from '@/store/safetyStore';
import type { MapTheme } from '@/types/safety';

export function SafetyThemeControls() {
  const activeTheme = useSafetyStore((s) => s.activeTheme);
  const setTheme = useSafetyStore((s) => s.setTheme);
  const is3dMode = useSafetyStore((s) => s.is3dMode);
  const toggle3dMode = useSafetyStore((s) => s.toggle3dMode);
  const setBearing = useSafetyStore((s) => s.setBearing);
  const incidents = useSafetyStore((s) => s.incidents);
  const setSelectedIncident = useSafetyStore((s) => s.setSelectedIncident);
  const showSafetyAmenities = useSafetyStore((s) => s.showSafetyAmenities);
  const toggleSafetyAmenities = useSafetyStore((s) => s.toggleSafetyAmenities);
  const activeDashboard = useSafetyStore((s) => s.activeDashboard);

  const [layerMenuOpen, setLayerMenuOpen] = useState(false);

  const activeIncidentsCount = incidents.filter((i) => i.status !== 'resolved').length;

  const themes: { id: MapTheme; label: string; icon: typeof MapIcon; desc: string }[] = [
    { id: 'standard', label: 'Clean Vector', icon: MapIcon, desc: 'Architectural blueprint layout' },
    { id: 'satellite', label: 'Satellite Hybrid', icon: Globe, desc: 'High-res aerial imagery' },
    { id: '3d', label: '3D Perspective', icon: Box, desc: 'Isometric tilt & depth' },
    { id: 'dark', label: 'Tactical Dark', icon: Moon, desc: 'High-contrast emergency night mode' },
    { id: 'safety', label: 'Safety Radar', icon: Radio, desc: 'CCTV & Security coverage zones' }
  ];

  return (
    <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-2.5 select-none">
      {/* Active Incidents Ticker (Only for security / operator dashboards) */}
      {activeDashboard !== 'nav' && activeIncidentsCount > 0 && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => {
            const firstActive = incidents.find((i) => i.status !== 'resolved');
            if (firstActive) setSelectedIncident(firstActive);
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-xs shadow-lg shadow-red-500/25 hover:from-red-700 hover:to-rose-700 transition-all cursor-pointer border border-red-400/40 animate-pulse"
        >
          <AlertCircle className="w-4 h-4" />
          <span>{activeIncidentsCount} LIVE INCIDENT{activeIncidentsCount > 1 ? 'S' : ''}</span>
        </motion.button>
      )}

      {/* Floating Control Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white/90 backdrop-blur-xl border border-neutral-200/80 rounded-2xl shadow-xl shadow-neutral-900/10">
        {/* Layer / Theme Menu Button */}
        <div className="relative">
          <button
            onClick={() => setLayerMenuOpen(!layerMenuOpen)}
            className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
              layerMenuOpen
                ? 'bg-neutral-900 text-white shadow-md'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
            title="Map Themes & Layers"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline capitalize">{activeTheme}</span>
          </button>

          {/* Theme Dropdown */}
          {layerMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="absolute top-12 right-0 w-64 bg-white/98 backdrop-blur-2xl border border-neutral-200 rounded-3xl shadow-2xl p-2 z-40 space-y-1"
            >
              <div className="px-3 py-2 border-b border-neutral-100 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  Select Map Style
                </span>
                <span className="text-[10px] font-bold text-neutral-500">MITS Campus</span>
              </div>

              {themes.map((t) => {
                const Icon = t.icon;
                const isSelected = activeTheme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setLayerMenuOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-2xl text-left transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'bg-blue-50/80 border border-blue-200/70 text-blue-900 shadow-sm'
                        : 'hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white shadow-md' : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold">{t.label}</p>
                      <p className="text-[10px] text-neutral-400 truncate">{t.desc}</p>
                    </div>
                  </button>
                );
              })}

              {/* Safety Amenity Toggle */}
              <div className="pt-2 mt-1 border-t border-neutral-100">
                <button
                  onClick={() => toggleSafetyAmenities()}
                  className={`w-full p-2.5 rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between ${
                    showSafetyAmenities ? 'bg-emerald-50 text-emerald-900' : 'hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold">Safety Amenities Layer</span>
                  </div>
                  <span
                    className={`w-8 h-4 rounded-full transition-colors relative ${
                      showSafetyAmenities ? 'bg-emerald-600' : 'bg-neutral-200'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                        showSafetyAmenities ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* 3D Tilt Toggle */}
        <button
          onClick={toggle3dMode}
          className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
            is3dMode
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-neutral-700 hover:bg-neutral-100'
          }`}
          title="Toggle 3D Perspective Tilt"
        >
          <Box className="w-4 h-4" />
          <span className="text-[11px] font-mono">{is3dMode ? '3D' : '2D'}</span>
        </button>

        {/* True North Compass Reset */}
        <button
          onClick={() => setBearing(0)}
          className="p-2 rounded-xl text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          title="Reset to True North"
        >
          <Compass className="w-4 h-4 text-red-500" />
        </button>
      </div>
    </div>
  );
}
