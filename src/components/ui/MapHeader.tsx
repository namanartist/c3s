// src/components/ui/MapHeader.tsx
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, QrCode, PanelLeft, ShieldAlert, Home, Shield, School, Settings, HelpCircle } from 'lucide-react';
import clgLogo from '@/assets/clg_logo.webp';
import { useCampusNavigation } from '@/hooks/useCampusNavigation';
import { useSafetyStore } from '@/store/safetyStore';
import { useGateStore } from '@/store/gateStore';
import { isProctorRole } from '@/lib/viewerRole';
import ThemeToggle from '@/components/ui/ThemeToggle';

export interface MapHeaderProps { }

export function MapHeader({ }: MapHeaderProps) {
  const navigate = useNavigate();
  const { isMobile, sidebarOpen, setSidebarOpen, isMenuOpen, setIsMenuOpen } = useCampusNavigation();
  const proctorMode = isProctorRole();

  if (isMobile) {
    return (
      <div className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-2.5 py-1.5 rounded-full shadow-lg border border-slate-200/90 dark:border-white/10 transition-colors pointer-events-auto">
        <ThemeToggle />
        <button
          type="button"
          onClick={() => useGateStore.getState().setScannerModalOpen(true)}
          className="p-1.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20 active:scale-95 transition-all cursor-pointer"
          title="Scan Campus Gate QR"
        >
          <QrCode className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => useSafetyStore.getState().setSosModalOpen(true)}
          className="px-2.5 py-1 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-[10px] shadow-sm active:scale-95 transition-all cursor-pointer animate-pulse"
          title="Emergency SOS"
        >
          SOS
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-5 right-5 z-20 flex items-center gap-3 bg-white/90 dark:bg-[#0A0F1D]/90 backdrop-blur-2xl px-4 py-2 rounded-2xl shadow-xl border border-slate-200/80 dark:border-white/10 pointer-events-auto transition-colors">
      <div
        onClick={() => navigate('/')}
        className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity"
        title="Campus Safety Map Home"
      >
        <img src={clgLogo} alt="MITS Logo" className="h-8 w-auto object-contain" decoding="async" />
        <span className="text-slate-300 dark:text-slate-700 text-xs font-mono">/</span>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black tracking-tight text-slate-900 dark:text-white leading-none">
              MITS MAP
            </span>
            <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded text-[8px] font-black uppercase tracking-wider">
              {proctorMode ? 'PROCTOR' : '3D VECTOR'}
            </span>
          </div>
          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wide mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            {proctorMode ? 'SOC OPERATIONS LIVE' : 'CAMPUS MESH LIVE'}
          </span>
        </div>
      </div>

      <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10" />

      {/* Gate QR Fast Trigger */}
      <button
        type="button"
        onClick={() => useGateStore.getState().setScannerModalOpen(true)}
        className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1.5 border border-blue-200/80 dark:border-blue-800/50 shadow-xs active:scale-95 transition-all cursor-pointer"
        title="Scan Campus Gate QR (Check-In / Check-Out)"
      >
        <QrCode className="w-3.5 h-3.5" />
        <span>Gate QR</span>
      </button>

      {/* Emergency SOS Button */}
      <button
        type="button"
        onClick={() => useSafetyStore.getState().setSosModalOpen(true)}
        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-red-500/25 active:scale-95 transition-all cursor-pointer"
        title="Open Emergency SOS Trigger"
      >
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span>SOS</span>
      </button>

      {/* Sidebar Toggle Shortcut */}
      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
          sidebarOpen
            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
        }`}
        title={sidebarOpen ? "Collapse Sidebar" : "Open Sidebar"}
      >
        <PanelLeft className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Navigator</span>
      </button>

      {/* Theme Toggle */}
      <ThemeToggle />

      <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10" />

      {/* Overflow App Navigation Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
          aria-label="Navigation Menu"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className="absolute right-0 mt-3 w-48 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-1.5 flex flex-col gap-1 z-30 transition-colors"
            >
              <button
                type="button"
                onClick={() => {
                  navigate('/');
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 text-blue-500" />
                <span>UniMap Home</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  navigate('/student');
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <School className="w-3.5 h-3.5 text-indigo-500" />
                <span>Student Base</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  navigate('/security');
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Security Patrol</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  navigate('/support');
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
                <span>Support & Help</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
