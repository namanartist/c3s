// src/pages/Landing/Hero.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Navigation,
  MapPin,
  Shield,
  ArrowRight,
  Sparkles,
  Layers,
  Radio,
  Eye,
  CheckCircle2,
  ChevronRight,
  Search
} from 'lucide-react';
import { motion } from 'motion/react';
import chrome from '@/assets/chrome.webp';
import firefox from '@/assets/firefox.webp';
import apple from '@/assets/safari.webp';

export default function Hero() {
  const navigate = useNavigate();
  const [activeFloorTab, setActiveFloorTab] = useState<'GF' | 'FF' | 'SF'>('FF');
  const [searchQuery, setSearchQuery] = useState('');

  const quickDestinations = [
    { label: 'SH-4 (Seminar Hall 4)', query: 'SH-4', map: 'Main_GF', badge: 'Seminar' },
    { label: 'Room 101 (J125)', query: '101', map: 'Main_FF', badge: 'Classroom' },
    { label: 'Room 102 (J126)', query: '102', map: 'Main_FF', badge: 'Classroom' },
    { label: 'Colloquium Hall', query: 'colloquium', map: 'Main_FF', badge: 'Seminar' },
    { label: 'Central Library', query: 'library', map: 'Campus_Map', badge: 'Facility' },
    { label: 'Main Gate', query: 'main gate', map: 'Campus_Map', badge: 'Access' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/map?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/map');
    }
  };

  const handleDestinationClick = (dest: typeof quickDestinations[0]) => {
    navigate(`/map?dest=${encodeURIComponent(dest.query)}&map=${dest.map}`);
  };

  return (
    <section className="relative w-full pt-28 pb-16 md:pt-36 md:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden blueprint-grid text-neutral-900 dark:text-white transition-colors">
      {/* Background radial atmosphere */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-blue-500/10 via-[#ff602e]/10 to-transparent blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-12 right-10 w-72 h-72 rounded-full bg-blue-600/5 blur-[90px] pointer-events-none z-0" />

      <div className="relative max-w-7xl mx-auto z-10">
        {/* Top Status & Accreditation Badge */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/80 dark:bg-white/[0.04] border border-neutral-200/80 dark:border-white/10 shadow-sm backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              MITS Gwalior Digital Twin & Defense Grid
            </span>
            <span className="text-neutral-300 dark:text-neutral-700">|</span>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hidden sm:inline">
              Multi-Floor Indoor GPS Active
            </span>
          </motion.div>
        </div>

        {/* Hero Title & Value Proposition */}
        <div className="text-center max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-extrabold tracking-tight leading-[1.04] select-none text-neutral-900 dark:text-white"
          >
            Protect Every Corner. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-[#ff602e] bg-clip-text text-transparent">
              Navigate Any Room.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed"
          >
            <strong className="text-neutral-900 dark:text-white font-bold block mb-1">
              Our Goal: Protecting Campus Safety Powered by Precision Wayfinding.
            </strong>
            Experience non-blocking multi-floor vector routing with automated level-of-detail,
            instant QR gate verification, and 24/7 AI-monitored campus surveillance.
          </motion.p>
        </div>

        {/* Primary Action Buttons (with Emergency SOS) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <Link to="/map" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white font-bold text-sm transition-all shadow-xl shadow-black/10 dark:shadow-white/5 active:scale-95 cursor-pointer">
              <Compass className="w-4 h-4 text-[#ff602e]" />
              <span>Launch Campus Map</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          <Link to="/student" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-white dark:bg-neutral-900/90 border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white hover:border-[#ff602e]/60 hover:bg-neutral-50 dark:hover:bg-neutral-800 font-bold text-sm transition-all shadow-sm active:scale-95 cursor-pointer">
              <Shield className="w-4 h-4 text-blue-500" />
              <span>Student Safety & Passes</span>
            </button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-red-500/10 dark:bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white font-bold text-sm transition-all active:scale-95 cursor-pointer">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Emergency SOS</span>
            </button>
          </Link>
        </motion.div>

        {/* Interactive Quick Search & Jump Bar (Shifted below Emergency SOS) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-8 max-w-2xl mx-auto"
        >
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex items-center p-1.5 rounded-2xl sm:rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-black/30 backdrop-blur-xl transition-all focus-within:border-blue-500/80 focus-within:ring-2 focus-within:ring-blue-500/20"
          >
            <div className="pl-4 pr-2 text-neutral-400">
              <Search className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Classroom (e.g. 101, 102), Lab, Hall, or Library..."
              className="flex-1 bg-transparent py-2.5 px-2 text-sm sm:text-base text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>Find Path</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick-select Destination Pills */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mr-1">
              Popular:
            </span>
            {quickDestinations.map((dest) => (
              <button
                key={dest.label}
                type="button"
                onClick={() => handleDestinationClick(dest)}
                className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/70 dark:bg-white/[0.04] border border-neutral-200/80 dark:border-white/10 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-neutral-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer shadow-xs"
              >
                <span>{dest.label}</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-100 dark:bg-white/10 text-neutral-500 dark:text-neutral-400 font-normal">
                  {dest.badge}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Interactive Digital Twin Showcase Widget */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="mt-14 max-w-5xl mx-auto"
        >
          <div className="relative rounded-[28px] sm:rounded-[36px] border border-neutral-200/90 dark:border-white/10 bg-white/90 dark:bg-[#0c0d0e]/90 shadow-2xl shadow-blue-500/5 backdrop-blur-2xl p-4 sm:p-6 overflow-hidden">
            {/* Top Showcase Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-600 animate-bounce" />
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    Live Route: Main Gate ➔ Room 101 (J125)
                  </span>
                </div>
              </div>

              {/* Floor Switcher Mockup */}
              <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-white/5 p-1 rounded-xl">
                {(['GF', 'FF', 'SF'] as const).map((floor) => (
                  <button
                    key={floor}
                    type="button"
                    onClick={() => setActiveFloorTab(floor)}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                      activeFloorTab === floor
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {floor === 'GF' ? 'Ground' : floor === 'FF' ? 'First Floor (101)' : 'Second'}
                  </button>
                ))}
              </div>
            </div>

            {/* Showcase Visual Canvas */}
            <div className="relative mt-4 h-[280px] sm:h-[340px] rounded-2xl bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 border border-neutral-200/60 dark:border-white/5 overflow-hidden flex flex-col justify-between p-4 sm:p-6">
              {/* Subtle Blueprint Grid inside mockup */}
              <div
                className="absolute inset-0 opacity-20 dark:opacity-30 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Floating Architectural Wing Badges */}
              <div className="relative z-10 flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                  🏛️ West Lecture Wing
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                  🎓 Central Promenade (101 & 102)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  🚪 South Entry 01
                </span>
              </div>

              {/* Simulated Visual Route Path & Nodes */}
              <div className="relative z-10 flex items-center justify-between max-w-3xl mx-auto w-full my-auto px-4">
                {/* Node 1: Start Point */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/20">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] sm:text-xs font-bold text-neutral-900 dark:text-white">Main Gate</p>
                    <p className="text-[9px] text-neutral-400">Outdoor Campus</p>
                  </div>
                </div>

                {/* Animated Connecting Line */}
                <div className="flex-1 mx-3 sm:mx-6 flex flex-col items-center gap-1.5">
                  <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden relative">
                    <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-blue-500 to-[#ff602e] w-full animate-pulse" />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                    <span>140m • 2 min walk</span>
                  </div>
                </div>

                {/* Node 2: Stairs Transition */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-500/10 border-2 border-indigo-500 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-lg shadow-indigo-500/20">
                    <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] sm:text-xs font-bold text-neutral-900 dark:text-white">Stairs 01</p>
                    <p className="text-[9px] text-neutral-400">GF ➔ FF</p>
                  </div>
                </div>

                {/* Animated Connecting Line 2 */}
                <div className="flex-1 mx-3 sm:mx-6 flex flex-col items-center gap-1.5">
                  <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden relative">
                    <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-[#ff602e] w-full" />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-500 bg-neutral-200/50 dark:bg-white/10 px-2 py-0.5 rounded-full">
                    <span>Indoor Corridor</span>
                  </div>
                </div>

                {/* Node 3: Target Room */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#ff602e]/10 border-2 border-[#ff602e] flex items-center justify-center text-[#ff602e] shadow-lg shadow-[#ff602e]/20 animate-pulse">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] sm:text-xs font-bold text-[#ff602e]">Room 101</p>
                    <p className="text-[9px] text-neutral-400">J125 Lecture Block</p>
                  </div>
                </div>
              </div>

              {/* Bottom Telemetry Bar */}
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-neutral-200/60 dark:border-white/5 text-[11px]">
                <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                  <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    Accuracy ± 0.6m
                  </span>
                  <span>•</span>
                  <span>Non-Blocking Dijkstra Engine</span>
                  <span>•</span>
                  <span className="hidden md:inline">Dynamic Spread Tags Active</span>
                </div>
                <Link
                  to="/map"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>Open Full Interactive Viewer</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Bottom Browser Badges */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
              <span className="text-[11px] text-neutral-500 font-medium">
                PWA Ready • Compatible with Chrome, Firefox, Safari & Android
              </span>
              <div className="flex items-center gap-3">
                <img src={chrome} alt="Chrome" className="w-4 h-4 opacity-70 hover:opacity-100 transition-opacity" />
                <img src={firefox} alt="Firefox" className="w-4 h-4 opacity-70 hover:opacity-100 transition-opacity" />
                <img src={apple} alt="Safari" className="w-4 h-4 opacity-70 hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
