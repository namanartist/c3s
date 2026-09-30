import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useCampusNavigation } from '@/hooks/useCampusNavigation';
import { useSafetyStore } from '@/store/safetyStore';

export function SOSSystem() {
  const { isMobile } = useCampusNavigation();
  const setSosModalOpen = useSafetyStore((s) => s.setSosModalOpen);

  return (
    <button
      type="button"
      onClick={() => setSosModalOpen(true)}
      className={`fixed z-50 flex flex-col items-center justify-center bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white rounded-full shadow-[0_0_25px_rgba(225,29,72,0.65)] transition-all hover:scale-105 active:scale-95 cursor-pointer animate-pulse border-2 border-white/40 ${
        isMobile ? 'bottom-6 right-6 w-14 h-14' : 'bottom-8 right-8 w-16 h-16'
      }`}
      aria-label="1-Tap Emergency SOS (Auto-Records Video & Dispatches)"
      title="1-Tap Emergency SOS: Auto-records 4-second video evidence, GPS coordinates, and alerts security QRF"
    >
      <ShieldAlert className={isMobile ? "w-6 h-6" : "w-7 h-7"} />
      <span className="text-[8px] font-black uppercase tracking-tighter mt-0.5">SOS</span>
    </button>
  );
}
