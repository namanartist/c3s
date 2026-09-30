// src/components/ui/MapHeader.tsx
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu } from 'lucide-react';
import logoWebp from '@/assets/UNIMAP_LOGO.webp';
import clgLogo from '@/assets/clg_logo.webp';
import { useCampusNavigation } from '@/hooks/useCampusNavigation';

export interface MapHeaderProps {}

export function MapHeader({}: MapHeaderProps) {
  const navigate = useNavigate();
  const { isMobile, isMenuOpen, setIsMenuOpen } = useCampusNavigation();

  if (isMobile) return null;

  return (
    <div className="absolute top-6 right-6 z-10 flex items-center gap-4 bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-full shadow-lg border border-black/[0.04]">
      <div
        onClick={() => navigate('/')}
        className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity"
        title="Go to Home"
      >
        <img src={clgLogo} alt="College Logo" className="h-8 w-auto" decoding="async" />
        <span className="text-gray-300 text-sm">×</span>
        <img src={logoWebp} alt="UniMap Logo" className="h-8 w-auto" decoding="async" />
      </div>
      <div className="h-4 w-[1px] bg-gray-200" />
      <div className="relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-orange-50 hover:text-[#ff602e] text-gray-700 transition-all duration-200 pointer-events-auto cursor-pointer"
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
              className="absolute right-0 mt-3.5 w-32 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-black/[0.04] p-1.5 flex flex-col gap-0.5 z-20 pointer-events-auto"
            >
              <button
                onClick={() => {
                  navigate('/');
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-[#ff602e] rounded-lg transition-colors cursor-pointer"
              >
                Home
              </button>
              <button
                onClick={() => {
                  navigate('/support');
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-[#ff602e] rounded-lg transition-colors cursor-pointer"
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
