// src/pages/Landing/Hero.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  Layers,
  Radio,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Hero() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const quickDestinations = [
    { label: 'Room 101 (J125)', query: '101', map: 'Main_FF', badge: 'Classroom' },
    { label: 'Room 102 (J126)', query: '102', map: 'Main_FF', badge: 'Classroom' },
    { label: 'Colloquium Hall', query: 'colloquium', map: 'Main_FF', badge: 'Seminar' },
    { label: 'Seminar Hall 4', query: 'SH-4', map: 'Main_GF', badge: 'Seminar' },
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

  const handleDestinationClick = (dest: (typeof quickDestinations)[0]) => {
    navigate(`/map?dest=${encodeURIComponent(dest.query)}&map=${dest.map}`);
  };

  return (
    <section className="relative w-full overflow-hidden blueprint-grid">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-blue-500/10 via-[#ff602e]/10 to-transparent blur-[130px]" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-14 pt-24 sm:px-6 md:grid-cols-12 md:gap-8 md:pb-20 md:pt-32 lg:px-8">
        {/* Left: Value proposition */}
        <div className="md:col-span-6">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-1.5 backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              MITS Gwalior · Multi-Floor Digital Twin
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-4xl font-extrabold leading-[1.04] tracking-tight text-neutral-900 dark:text-white sm:text-6xl lg:text-[68px]"
          >
            Protect Every Corner.
            <br />
            <span className="lp-gradient-text">Answer Every SOS.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
            className="mt-5 max-w-xl text-base leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-lg"
          >
            24/7 AI-validated surveillance, calibrated aggression detection and a 1-tap SOS
            with automatic evidence — fused into one campus defence grid that routes responders
            straight to the emergency.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.28 }}
            className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"
          >
            <Link to="/student" className="w-full sm:w-auto">
              <button className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-red-600 px-6 font-bold text-white shadow-lg shadow-red-600/30 transition-all hover:bg-red-500 active:scale-[0.98] sm:w-auto sm:px-7">
                <Radio className="h-4 w-4" />
                <span>Open Emergency SOS</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <Link to="/map" className="w-full sm:w-auto">
              <button className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white/70 px-6 font-bold text-neutral-800 backdrop-blur-md transition-all hover:border-neutral-400 active:scale-[0.98] dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-200 dark:hover:bg-white/[0.08] sm:w-auto">
                <Compass className="h-4 w-4 text-blue-500" />
                <span>Campus Grid &amp; Safe Routing</span>
              </button>
            </Link>
          </motion.div>

          {/* Quick search */}
          <motion.form
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.36 }}
            onSubmit={handleSearchSubmit}
            className="mt-6 flex items-center rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-sm backdrop-blur-xl transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-white/10 dark:bg-[#0c0d0e]"
            aria-label="Find any room, lab, library or gate — or route to an SOS"
          >
            <Search className="ml-3 h-5 w-5 shrink-0 text-neutral-400" />
            <label htmlFor="hero-room-search" className="sr-only">
              Search rooms, labs, libraries, gates or an SOS destination
            </label>
            <input
              id="hero-room-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find a room, gate — or the route to an SOS..."
              className="w-full bg-transparent px-3 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-white"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-blue-700 active:scale-[0.98] sm:px-5"
            >
              <span className="sm:hidden">Find</span>
              <span className="hidden sm:inline">Find Route</span>
            </button>
          </motion.form>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Popular:
            </span>
            {quickDestinations.map((dest) => (
              <button
                key={dest.label}
                type="button"
                onClick={() => handleDestinationClick(dest)}
                className="group cursor-pointer rounded-full border border-neutral-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-neutral-700 backdrop-blur transition-all hover:border-blue-500 hover:text-blue-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-300 dark:hover:text-blue-400"
              >
                {dest.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Live digital twin spotlight */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.22 }}
          className="md:col-span-6"
        >
          <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white/90 shadow-2xl shadow-blue-500/5 backdrop-blur-2xl dark:border-white/10 dark:bg-[#0c0d0e]/90">
            {/* Window chrome */}
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-white/5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                C3S · SOS Dispatch Console · Live
              </span>
            </div>

            <div className="relative p-5 sm:p-6">
              {/* SOS responder routing — the map's core safety function */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-red-500" />
                  <div className="leading-tight">
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">
                      SOS · Guard-07 → Room 101 (J125)
                    </p>
                    <p className="text-[10px] text-neutral-400">140m · 2 min · Multi-floor responder route</p>
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-bold text-red-600 dark:text-red-400">
                  <Radio className="h-3 w-3 animate-pulse" />EN ROUTE
                </span>
              </div>

              {/* Responder route */}
              <div className="mt-4 space-y-3">
                {[
                  { name: 'SOS verified · Room 101 (J125)', detail: 'AI aggression alert · calibrated 0.94 confidence', done: true },
                  { name: 'Take Lift 01 to First Floor', detail: 'Step-free responder route · GF → FF', done: true },
                  { name: 'Destination: Room 101 SOS', detail: 'Auto-evidence recording · channel sealed', done: false },
                ].map((step) => (
                  <div key={step.name} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        step.done
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-[#ff602e] text-[#ff602e]'
                      }`}
                    >
                      {step.done ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff602e]" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-800 dark:text-neutral-100">
                        {step.name}
                      </p>
                      <p className="text-[10px] text-neutral-400">{step.detail}</p>
                    </div>
                    <Layers
                      className={`ml-auto h-3.5 w-3.5 shrink-0 ${
                        step.done ? 'text-emerald-500' : 'text-neutral-300 dark:text-neutral-700'
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* Detection telemetry */}
              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-2.5 text-center dark:border-white/5 dark:bg-white/[0.03]">
                  <p className="font-mono text-lg font-black text-neutral-900 dark:text-white">14</p>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">
                    CCTV streams
                  </p>
                </div>
                <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-2.5 text-center dark:border-white/5 dark:bg-white/[0.03]">
                  <p className="font-mono text-lg font-black text-emerald-600 dark:text-emerald-400">0</p>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">
                    Active threats
                  </p>
                </div>
                <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-2.5 text-center dark:border-white/5 dark:bg-white/[0.03]">
                  <p className="font-mono text-lg font-black text-neutral-900 dark:text-white">&lt;3s</p>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">
                    SOS response
                  </p>
                </div>
              </div>

              {/* Footer telemetry */}
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-neutral-100 pt-3 text-[10px] text-neutral-400 dark:border-white/5">
                <span className="flex items-center gap-1.5">
                  <Radio className="h-3 w-3 animate-pulse text-emerald-500" />
                  AI validation active
                </span>
                <Link
                  to="/map"
                  className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline dark:text-blue-400"
                >
                  Open responder map <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="lp-rule" />
    </section>
  );
}
