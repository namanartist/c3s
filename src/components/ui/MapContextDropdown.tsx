// src/components/ui/MapContextDropdown.tsx
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Navigation,
  Video,
  BarChart3,
  ShieldCheck,
  ChevronDown,
  Check
} from 'lucide-react';
import { useSafetyStore } from '@/store/safetyStore';
import type { DashboardMode } from '@/types/safety';

interface ContextOption {
  id: DashboardMode;
  label: string;
  tag: string;
  desc: string;
  icon: typeof Navigation;
  iconColor: string;
  badge?: number;
  badgeColor?: string;
}

export function MapContextDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeDashboard = useSafetyStore((s) => s.activeDashboard);
  const setActiveDashboard = useSafetyStore((s) => s.setActiveDashboard);
  const incidents = useSafetyStore((s) => s.incidents);
  const cctvCameras = useSafetyStore((s) => s.cctvCameras);

  const activeIncidents = incidents.filter((i) => i.status !== 'resolved').length;
  const alertCameras = cctvCameras.filter((c) => c.status === 'alert').length;

  const options: ContextOption[] = [
    {
      id: 'nav',
      label: 'Safe Nav',
      tag: 'Public',
      desc: 'Student & visitor wayfinding',
      icon: Navigation,
      iconColor: 'text-blue-400'
    },
    {
      id: 'soc',
      label: 'CCTV SOC',
      tag: 'Security',
      desc: 'Live camera surveillance grid',
      icon: Video,
      iconColor: 'text-amber-400',
      badge: alertCameras,
      badgeColor: 'bg-amber-500 text-white'
    },
    {
      id: 'analytics',
      label: 'Safety Intel',
      tag: 'Intel',
      desc: 'Incident analytics & heatmaps',
      icon: BarChart3,
      iconColor: 'text-purple-400'
    },
    {
      id: 'patrol',
      label: 'Patrol & QRF',
      tag: 'Dispatch',
      desc: 'Security fleet & rapid response',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400',
      badge: activeIncidents,
      badgeColor: 'bg-red-500 text-white animate-pulse'
    }
  ];

  const currentOption = options.find((opt) => opt.id === activeDashboard) || options[0];
  const CurrentIcon = currentOption.icon;

  // Total alert badge for closed button
  const totalAlerts = alertCameras + activeIncidents;

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (mode: DashboardMode) => {
    setActiveDashboard(mode);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative select-none">
      {/* Minimal Context Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Switch dashboard context"
        className="group relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-950/85 hover:bg-neutral-900 active:scale-95 text-white text-xs font-semibold backdrop-blur-xl border border-white/15 shadow-xl shadow-black/30 transition-all duration-200 cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          <CurrentIcon className={`w-3.5 h-3.5 ${currentOption.iconColor} transition-transform group-hover:scale-110`} />
          <span className="font-bold tracking-tight text-[11px] sm:text-xs">
            {currentOption.label}
          </span>
        </div>

        {/* Minimal Alert Badge or Status Dot */}
        {activeDashboard !== 'nav' && currentOption.badge != null && currentOption.badge > 0 ? (
          <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${currentOption.badgeColor || 'bg-red-500 text-white'}`}>
            {currentOption.badge}
          </span>
        ) : totalAlerts > 0 && activeDashboard === 'nav' ? (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title={`${totalAlerts} active system alerts`} />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        )}

        <ChevronDown
          className={`w-3 h-3 text-white/50 transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : 'group-hover:text-white/80'}`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 w-64 bg-neutral-950/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl shadow-black/70 p-1.5 z-50 overflow-hidden"
          >
            {/* Header / Subtitle */}
            <div className="px-3 py-1.5 mb-1 border-b border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
                SYSTEM CONTEXT
              </span>
              <span className="text-[9px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            </div>

            {/* Context Items */}
            <div className="space-y-0.5">
              {options.map((option) => {
                const Icon = option.icon;
                const isSelected = activeDashboard === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all duration-150 cursor-pointer group ${
                      isSelected
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-neutral-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-blue-600/30 border border-blue-500/40 text-white'
                            : 'bg-white/5 text-neutral-400 group-hover:text-white'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? option.iconColor : ''}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold leading-tight truncate">
                            {option.label}
                          </span>
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/10 text-neutral-300">
                            {option.tag}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400 truncate leading-tight mt-0.5">
                          {option.desc}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {option.badge != null && option.badge > 0 && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase ${
                            option.badgeColor || 'bg-red-500 text-white'
                          }`}
                        >
                          {option.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
