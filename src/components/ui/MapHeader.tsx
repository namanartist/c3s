// src/components/ui/MapHeader.tsx
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, QrCode, PanelLeft } from 'lucide-react';
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
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-2.5 py-1.5 rounded-full shadow-lg border border-slate-200/90 dark:border-white/10 transition-colors pointer-events-auto">
        <ThemeToggle />
        <button
          type="button"
          onClick={() => useGateStore.getState().setScannerModalOpen(true)}
          className="p-1.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20 active:scale-95 transition-all cursor-pointer"
          title="Scan Campus Gate QR"
        >
          <QrCode className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => useSafetyStore.getState().setSosModalOpen(true)}
          className="px-2.5 py-1 rounded-full bg-red-600 text-white font-black text-[10px] shadow-sm active:scale-95 transition-all cursor-pointer animate-pulse"
          title="Emergency SOS"
        >
          SOS
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-6 right-6 z-10 flex items-center gap-3 sm:gap-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-lg border border-slate-200/80 dark:border-white/10 transition-colors">
      <div
        onClick={() => navigate('/')}
        className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity"
        title="Campus Safety Map Home"
      >
        <img src={clgLogo} alt="MITS Logo" className="h-8 w-auto" decoding="async" />
        <span className="text-gray-300 text-sm">×</span>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black tracking-tight text-gray-900 dark:text-white leading-none">C3S MAP</span>
            <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded text-[8px] font-black">
              {proctorMode ? 'PROCTOR' : 'CAMPUS'}
            </span>
          </div>
          <span className="text-[9px] font-bold text-emerald-600 tracking-wide mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {proctorMode ? 'LIVE OPERATIONS ACTIVE' : 'LIVE CAMPUS MAP'}
          </span>
        </div>
      </div>

      <div className="h-4 w-[1px] bg-gray-200 dark:bg-white/10" />

      <button
        type="button"
        onClick={() => useGateStore.getState().setScannerModalOpen(true)}
        className="px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-black text-xs flex items-center gap-1.5 border border-blue-200 shadow-sm active:scale-95 transition-all cursor-pointer"
        title="Scan Campus Gate QR (Check-In / Check-Out)"
      >
        <QrCode className="w-3.5 h-3.5" />
        <span>Gate QR</span>
      </button>

      {proctorMode && (
        <button
          type="button"
          onClick={() => useSafetyStore.getState().setSosModalOpen(true)}
          className="px-3 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-red-500/30 active:scale-95 transition-all cursor-pointer animate-pulse"
          title="Open Emergency SOS Trigger"
        >
          <span className="w-2 h-2 rounded-full bg-white" />
          <span>SOS</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
          sidebarOpen
            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
        }`}
        title={sidebarOpen ? "Collapse Sidebar" : "Open Sidebar"}
      >
        <PanelLeft className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Sidebar</span>
      </button>

      <ThemeToggle />
      <div className="h-4 w-[1px] bg-gray-200 dark:bg-white/10" />
      <div className="relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all duration-200 pointer-events-auto cursor-pointer"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-3.5 w-36 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200 dark:border-white/10 p-1.5 flex flex-col gap-0.5 z-20 pointer-events-auto transition-colors"
            >
              <button
                onClick={() => {
                  navigate('/');
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                Home
              </button>
              <button
                onClick={() => {
                  navigate('/gate');
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
              >
                Gate Keeper
              </button>
              <button
                onClick={() => {
                  navigate('/proctor');
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                C3S Operations
              </button>
              <button
                onClick={() => {
                  navigate('/support');
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                Support
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
