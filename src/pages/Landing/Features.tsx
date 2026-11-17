// src/pages/Landing/Features.tsx
import { Link } from 'react-router-dom';
import {
  Layers,
  Search,
  Accessibility,
  Navigation,
  School,
  HelpCircle,
  Coffee,
  Compass,
  ShieldAlert,
  Scan,
  Radio,
} from 'lucide-react';
import { motion } from 'motion/react';
import BorderGlow from '@/components/ui/borderGlow/borderGlow';
import './features.css';

export default function Features() {
  return (
    <section id="features" className="relative w-full px-2 py-4 sm:px-4 md:px-6">
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#050505] py-16 text-white sm:py-20 md:py-24">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute left-10 top-1/4 h-96 w-96 rounded-full bg-[#ff602e]/5 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-1/4 right-10 h-96 w-96 rounded-full bg-cyan-500/5 blur-[120px]" />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-6 md:px-10">
          {/* Section header */}
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <motion.div
              className="max-w-xl"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            >
              <span className="lp-eyebrow lp-eyebrow-accent">The platform</span>
              <h2 className="mt-4 text-3xl font-medium leading-[1.08] tracking-tight text-white sm:text-4xl md:text-[44px]">
                Every campus capability,
                <br />one defence grid.
              </h2>
            </motion.div>
            <motion.div
              className="shrink-0 text-left md:text-right"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.55, delay: 0.15, ease: 'easeOut' }}
            >
              <p className="text-sm font-medium text-neutral-400">
                From calibrated AI aggression detection to operator-confirmed dispatch —
                built to be fast under pressure.
              </p>
              <Link to="/map">
                <button className="mt-3 cursor-pointer rounded-full border border-white/10 bg-[#121212] px-4 py-2 text-xs font-semibold text-white transition-all hover:border-white/20 hover:bg-neutral-900">
                  Explore the Defence Grid
                </button>
              </Link>
            </motion.div>
          </div>

          {/* Bento grid — 4 large cards + 2 wide cards */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            {/* CARD 1 — AI surveillance (featured, wide) */}
            <motion.div
              className="col-span-1 md:col-span-2"
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <BorderGlow
              className="feature-grid-card flex h-[380px] w-full overflow-hidden rounded-3xl"
              borderRadius={28}
              backgroundColor="rgba(10, 10, 10, 0.75)"
              glowColor="0 90 65"
              colors={['#ff7a4d', '#f472b6', '#60a5fa']}
              glowIntensity={1.15}
            >
              <div className="flex h-full w-full flex-col justify-between p-6 sm:p-7">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/15 text-red-400">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-red-300">
                    <span className="h-1.5 w-1.5 animate-ping rounded-full bg-red-500" />
                    Live AI sentinel
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white sm:text-2xl">
                    AI Aggression Detection, Verified
                  </h3>
                  <p className="mt-2 max-w-md text-xs leading-relaxed text-neutral-400">
                    Continuous optical analysis flags physical altercations in real time.
                    Calibrated confidence, hysteresis-confirmed dispatch, and forensic
                    SHA-256-sealed evidence — never a single-frame guess.
                  </p>
                  <div className="mt-4 grid max-w-xs grid-cols-3 gap-2">
                    {[
                      { n: '14', label: 'Threat classes' },
                      { n: '0.82', label: 'Dispatch threshold' },
                      { n: 'SME', label: 'Verified by proctors' },
                    ].map(({ n, label }) => (
                      <div
                        key={label}
                        className="rounded-xl border border-white/5 bg-white/[0.04] p-2 text-center"
                      >
                        <p className="font-mono text-sm font-black text-white">{n}</p>
                        <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide text-neutral-500">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </BorderGlow>
            </motion.div>

            {/* CARD 2 — SOS responder routing */}
            <motion.div
              className="col-span-1 md:col-span-2"
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.08, ease: 'easeOut' }}
            >
              <BorderGlow
              className="feature-grid-card flex h-[380px] w-full overflow-hidden rounded-3xl"
              borderRadius={28}
              backgroundColor="rgba(10, 10, 10, 0.75)"
              glowColor="270 90 70"
              colors={['#c084fc', '#f472b6', '#38bdf8']}
              glowIntensity={1.15}
            >
              <div className="flex h-full w-full flex-col justify-between p-6 sm:p-7">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
                    <Layers className="h-6 w-6" />
                  </div>
                  <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-indigo-300">
                    GF · FF · SF
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white sm:text-2xl">Multi-Floor SOS Routing</h3>
                  <p className="mt-2 max-w-md text-xs leading-relaxed text-neutral-400">
                    Step-free vector routing across every floor plan with non-blocking Dijkstra —
                    built to get responders to an SOS in seconds, with automatic floor transitions.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {['Ground Floor', 'First Floor (101)', 'Second Floor'].map((floor, i) => (
                      <span
                        key={floor}
                        className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${
                          i === 1
                            ? 'bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/30'
                            : 'bg-white/[0.06] text-neutral-400'
                        }`}
                      >
                        {floor}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </BorderGlow>
            </motion.div>

            {/* CARD 3 — Room finder */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: 0.12, ease: 'easeOut' }}
            >
              <BorderGlow
              className="feature-grid-card flex h-[340px] w-full overflow-hidden rounded-3xl"
              borderRadius={28}
              backgroundColor="rgba(10, 10, 10, 0.75)"
              glowColor="190 90 65"
              colors={['#38bdf8', '#22d3ee', '#60a5fa']}
              glowIntensity={1.15}
            >
              <div className="flex h-full w-full flex-col justify-between p-6">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                    <Search className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-white">Smart Room Finder</h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
                    Rooms, labs, offices and facilities — instantly located with live coordinates.
                  </p>
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: 'CIoT Lab · AI Building', tag: 'Lab', tone: 'text-cyan-300 bg-cyan-500/10' },
                    { label: 'Conclave Centre · GF', tag: 'Seminar', tone: 'text-amber-300 bg-amber-500/10' },
                  ].map(({ label, tag, tone }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.04] px-2.5 py-2"
                    >
                      <span className="text-[10px] font-semibold text-neutral-300">{label}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${tone}`}>
                        {tag}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </BorderGlow>
            </motion.div>

            {/* CARD 4 — Accessibility */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: 0.18, ease: 'easeOut' }}
            >
              <BorderGlow
              className="feature-grid-card flex h-[340px] w-full overflow-hidden rounded-3xl"
              borderRadius={28}
              backgroundColor="rgba(10, 10, 10, 0.75)"
              glowColor="330 90 70"
              colors={['#fb7185', '#f472b6', '#c084fc']}
              glowIntensity={1.15}
            >
              <div className="flex h-full w-full flex-col justify-between p-6">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-pink-500/30 bg-pink-500/10 text-pink-400">
                    <Accessibility className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-white">Accessibility First</h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
                    Step-free routing preferred automatically — ramps and elevators over stairs.
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.04] px-3 py-2.5">
                  <span className="text-[10px] font-semibold text-emerald-300">Elevators · OK</span>
                  <div className="h-4 w-7 rounded-full bg-[#ff602e] p-0.5">
                    <div className="ml-auto h-3 w-3 rounded-full bg-white" />
                  </div>
                </div>
              </div>
            </BorderGlow>
            </motion.div>

            {/* CARD 5 — Live ETA */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: 0.24, ease: 'easeOut' }}
            >
              <BorderGlow
              className="feature-grid-card flex h-[340px] w-full overflow-hidden rounded-3xl"
              borderRadius={28}
              backgroundColor="rgba(10, 10, 10, 0.75)"
              glowColor="220 90 65"
              colors={['#60a5fa', '#38bdf8', '#c084fc']}
              glowIntensity={1.15}
            >
              <div className="flex h-full w-full flex-col justify-between p-6">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-400">
                    <Navigation className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-white">Live ETA &amp; Compass</h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
                    Turn-by-turn responder guidance with live arrival time — from gate to the SOS room.
                  </p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.04] p-3">
                  <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wide">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Radio className="h-3 w-3" />Active
                    </span>
                    <span className="text-neutral-500">ETA 3 min</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-800">
                    <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-emerald-500 to-[#ff602e]" />
                  </div>
                </div>
              </div>
            </BorderGlow>
            </motion.div>

            {/* CARD 6 — Gate pass */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: 0.3, ease: 'easeOut' }}
            >
              <BorderGlow
              className="feature-grid-card flex h-[340px] w-full overflow-hidden rounded-3xl"
              borderRadius={28}
              backgroundColor="rgba(10, 10, 10, 0.75)"
              glowColor="150 90 60"
              colors={['#34d399', '#2dd4bf', '#22c55e']}
              glowIntensity={1.15}
            >
              <div className="flex h-full w-full flex-col justify-between p-6">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    <Scan className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-white">Instant Gate Passes</h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
                    Sub-second QR verification for entry, exit and occupancy — online or offline.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { n: '0.4s', label: 'Verify' },
                    { n: '24/7', label: 'Uptime' },
                    { n: '3', label: 'Gates live' },
                  ].map(({ n, label }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-white/5 bg-white/[0.04] p-2 text-center"
                    >
                      <p className="font-mono text-sm font-black text-emerald-300">{n}</p>
                      <p className="text-[8px] font-semibold uppercase text-neutral-500">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </BorderGlow>
            </motion.div>
          </div>

          {/* Legacy quick-find trio */}
          <div className="mt-12 text-center">
            <motion.h3
              className="text-2xl font-medium tracking-tight text-white md:text-3xl"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              Every Place Mapped. Every SOS Reachable.
            </motion.h3>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                icon: School,
                label: 'Locate classrooms, lecture theatres and labs.',
                tone: 'text-orange-300 bg-orange-500/10 border-orange-500/20',
              },
              {
                icon: HelpCircle,
                label: 'Find administration offices, help desks and support.',
                tone: 'text-blue-300 bg-blue-500/10 border-blue-500/20',
              },
              {
                icon: Coffee,
                label: 'Discover cafeterias, libraries and common areas.',
                tone: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
              },
            ].map(({ icon: Icon, label, tone }, index) => (
              <motion.div
                key={label}
                className="feature-grid-card flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: index * 0.12, ease: 'easeOut' }}
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${tone}`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <p className="max-w-[220px] text-sm font-semibold leading-snug text-neutral-200">
                  {label}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link to="/developers" className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 hover:underline">
              <Compass className="h-4 w-4" />
              Built by MITS Gwalior · C3S Defence Grid
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
