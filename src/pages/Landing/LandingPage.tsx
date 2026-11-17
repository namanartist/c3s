// src/pages/Landing/LandingPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Users,
  Shield,
  QrCode,
  Radio,
  Sliders,
  GraduationCap,
  ChevronRight,
  ArrowRight,
  MapPin,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { useC3SStore } from '@/store/c3sStore';
import { ROLE_DEFINITIONS } from '@/lib/rbac';
import { type C3SRole } from '@/lib/mock-data/users';
import { SosModal } from '@/components/safety/SosModal';
import { Navbar } from '@/components/ui';
import Footer from '@/components/ui/footer/Footer';
import { motion } from 'motion/react';
import Hero from './Hero';
import About from './About';
import Features from './Features';
import Workflow from './Workflow';
import './landing.css';

const PRIMARY_ROLE_CARDS: Array<{
  role: C3SRole;
  icon: React.ElementType;
  tag: string;
  description: string;
  highlights: string[];
  accentBorder: string;
}> = [
  {
    role: 'PROCTOR',
    icon: Radio,
    tag: 'SOC Central Command',
    description:
      'Unified CCTV matrix with calibrated AI aggression alerts — every alert requires an operator verdict.',
    highlights: ['Live 24/7 CCTV grid', 'AI aggression detection', 'Threat overlay map'],
    accentBorder: 'hover:border-rose-500',
  },
  {
    role: 'GUARD',
    icon: Shield,
    tag: 'Tactical Rapid Response',
    description:
      'Active incident queue with the shortest safe route to the incident, and one-tap radio to SOC.',
    highlights: ['Live incident queue', 'Direct GPS route to alert', 'Intercom & dispatch'],
    accentBorder: 'hover:border-amber-500',
  },
  {
    role: 'GATEKEEPER',
    icon: QrCode,
    tag: 'Access Control',
    description:
      'Sub-second QR pass verification, real-time occupancy tracking and immutable audit trails.',
    highlights: ['Sub-second QR scanner', 'Occupancy meter', 'Offline pass validation'],
    accentBorder: 'hover:border-emerald-500',
  },
  {
    role: 'STUDENT',
    icon: GraduationCap,
    tag: 'Student Safety & SOS',
    description:
      'A 1-tap SOS with automatic evidence capture, dynamic QR gate passes and multi-floor routing to any room.',
    highlights: ['1-tap emergency beacon', 'QR entry/exit pass', 'Room & responder routing'],
    accentBorder: 'hover:border-blue-500',
  },
  {
    role: 'ADMIN',
    icon: Sliders,
    tag: 'Institutional Governance',
    description:
      'Granular role-based access control, camera health monitoring, gate logs and audit reports.',
    highlights: ['Granular permissions', 'Gate & device management', 'Comprehensive audit logs'],
    accentBorder: 'hover:border-purple-500',
  },
];

const CAMPUS_DIRECTORY = {
  academic: [
    { name: 'Room 101 (J125)', desc: 'First Floor · Central Promenade', map: 'Main_FF', query: '101' },
    { name: 'Room 102 (J126)', desc: 'First Floor · Lecture Block', map: 'Main_FF', query: '102' },
    { name: 'Colloquium Hall', desc: 'Seminar & Conference Hall', map: 'Main_FF', query: 'colloquium' },
    { name: 'BE Computer Lab', desc: 'Software Engineering Labs', map: 'Main_FF', query: 'lab' },
    { name: 'Mechanical Workshops', desc: 'Fabrication & Machine Labs', map: 'Campus_Map', query: 'workshops' },
    { name: 'Drawing Hall (J124)', desc: 'Architecture & Design Studios', map: 'Main_FF', query: 'drawing' },
  ],
  facilities: [
    { name: 'Central Library', desc: 'Main Campus Reading Complex', map: 'Campus_Map', query: 'library' },
    { name: 'Campus Canteen', desc: 'Dining & Cafeteria Court', map: 'Campus_Map', query: 'canteen' },
    { name: 'Main Gate (Gate 1)', desc: 'Primary Campus Entrance', map: 'Campus_Map', query: 'main gate' },
    { name: 'Jubilee Gate (Gate 2)', desc: 'Secondary Transit Access', map: 'Campus_Map', query: 'jubilee' },
  ],
  services: [
    { name: "Director's Office", desc: 'Administrative Headquarters', map: 'Main_GF', query: 'director' },
    { name: 'Chief Proctor Office', desc: 'Discipline & Campus Security', map: 'Main_GF', query: 'proctor' },
    { name: 'First Aid & Health Center', desc: 'Emergency Medical Services (24/7)', map: 'Campus_Map', query: 'health' },
    { name: 'Security Control Room', desc: '24/7 Surveillance SOC', map: 'Campus_Map', query: 'control' },
  ],
};

export default function LandingPage() {
  const navigate = useNavigate();
  const currentRole = useC3SStore((state) => state.currentRole);
  const [selectedDirectoryTab, setSelectedDirectoryTab] = useState<'academic' | 'facilities' | 'services'>('academic');

  const handleLaunchRole = (role: C3SRole) => {
    navigate('/login', { state: { role } });
  };

  return (
    <div className="relative min-h-screen w-full bg-[var(--lp-bg)] text-[var(--lp-ink)] antialiased selection:bg-blue-600 selection:text-white">
      <SosModal />
      <Navbar />

      {/* Hero */}
      <Hero />

      {/* Live telemetry strip */}
      <section className="border-b border-neutral-200/60 bg-white/70 px-4 py-8 backdrop-blur-xl dark:border-white/5 dark:bg-[#0a0a0a]/70">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 text-center lg:grid-cols-4">
          {[
            { value: '100', suffix: '%', label: 'Zones under surveillance' },
            { value: '<3', suffix: 's', label: 'SOS response alert' },
            { value: '14', suffix: '', label: 'CCTV streams monitored' },
            { value: '±0.8', suffix: 'm', label: 'SOS beacon precision' },
          ].map(({ value, suffix, label }, index) => (
            <motion.div
              key={label}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: index * 0.09, ease: 'easeOut' }}
            >
              <p className="text-2xl font-black text-neutral-900 dark:text-white sm:text-3xl">
                {value}
                <span className="ml-0.5 text-sm font-bold text-orange-500">{suffix}</span>
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <Workflow />

      {/* Platform capabilities */}
      <Features />

      {/* Role-based workspaces */}
      <section id="portals" className="relative w-full px-4 py-20 sm:px-6 md:py-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <motion.div
              className="max-w-2xl"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            >
              <span className="lp-eyebrow">
                <Users className="h-3.5 w-3.5" />
                Role-based workspaces
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white sm:text-4xl md:text-5xl">
                Purpose-built portals
                <br />for every stakeholder
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                A proctor triaging AI alerts, a guard running to an SOS, a gate keeper verifying
                a pass — one defence grid, shaped for each job.
              </p>
            </motion.div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm transition-all hover:border-neutral-400 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-200"
            >
              <span>Institutional Sign In</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PRIMARY_ROLE_CARDS.map(({ role, icon: Icon, tag, description, highlights, accentBorder }, index) => {
              const def = ROLE_DEFINITIONS[role];
              const isCurrent = currentRole === role;
              return (
                <motion.div
                  key={role}
                  className={`lp-card flex h-full flex-col justify-between p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    isCurrent ? 'border-blue-500 shadow-blue-500/10' : `border-neutral-200 dark:border-white/10 ${accentBorder}`
                  }`}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100 text-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-blue-400">
                        <Icon className="h-5 w-5" />
                      </span>
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                          <span className="h-1.5 w-1.5 animate-ping rounded-full bg-blue-500" />
                          Current role
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          Launch ready
                        </span>
                      )}
                    </div>
                    <p className="mt-4 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                      {tag}
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-neutral-900 dark:text-white">
                      {def?.shortLabel ?? role.replace(/_/g, ' ')}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                      {description}
                    </p>
                    <ul className="mt-4 space-y-1.5 border-t border-neutral-100 pt-4 dark:border-white/5">
                      {highlights.map((item) => (
                        <li
                          key={item}
                          className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLaunchRole(role)}
                    className="group/btn mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3 text-xs font-bold text-white transition-all hover:bg-blue-600 dark:bg-white dark:text-neutral-900 dark:hover:bg-blue-600 dark:hover:text-white"
                  >
                    <span>Launch {def?.shortLabel ?? role}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Campus directory */}
      <section className="border-y border-neutral-200/70 bg-neutral-100/50 px-4 py-16 dark:border-white/5 dark:bg-[#08090a]/60 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white sm:text-3xl">
                Campus Directory &amp; Finder
              </h2>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Jump to any verified node with live indoor coordinates.
              </p>
            </div>
            <div
              className="flex w-full max-w-xs rounded-2xl border border-neutral-200 bg-white p-1 sm:w-auto dark:border-white/10 dark:bg-white/5"
              role="tablist"
              aria-label="Directory categories"
            >
              {(['academic', 'facilities', 'services'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={selectedDirectoryTab === tab}
                  onClick={() => setSelectedDirectoryTab(tab)}
                  className={`flex-1 rounded-xl px-3 py-2 text-[11px] font-bold capitalize transition-all sm:flex-none sm:px-4 ${
                    selectedDirectoryTab === tab
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CAMPUS_DIRECTORY[selectedDirectoryTab].map((item) => (
              <a
                key={item.name}
                href={`/map?dest=${encodeURIComponent(item.query)}&map=${item.map}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-4 transition-all hover:border-blue-500 hover:shadow-lg dark:border-white/10 dark:bg-[#0e0f10]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-all group-hover:bg-blue-600 group-hover:text-white dark:bg-white/5 dark:text-blue-400">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-bold text-neutral-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                      {item.name}
                    </h4>
                    <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {item.desc}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-neutral-400 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-600" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <About />

      {/* Emergency CTA */}
      <section className="relative w-full px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-900 via-neutral-950 to-blue-950 p-8 text-white shadow-2xl sm:p-12"
          initial={{ opacity: 0, y: 36, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-[#ff602e]/10 blur-[100px]" />
          <div className="relative z-10 flex flex-col items-center justify-between gap-8 lg:flex-row">
            <div className="max-w-xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-300">
                <Radio className="h-4 w-4 animate-pulse" />
                <span>Campus Security Hotline: +91 751 240 9300</span>
              </div>
              <h3 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                Instant Help, Anytime.
                <br />
                <span className="lp-gradient-text">Anywhere on campus.</span>
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral-400">
                In any emergency, tap SOS. Your exact room and floor coordinates reach active
                security patrols within seconds — with evidence captured automatically.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <a href="/student" className="w-full sm:w-auto">
                <button className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-red-600 px-6 font-extrabold text-sm text-white shadow-lg shadow-red-600/25 transition-all hover:bg-red-500 active:scale-[0.98] sm:w-full">
                  <Radio className="h-5 w-5" />
                  <span>Open Emergency SOS</span>
                </button>
              </a>
              <a href="/map" className="w-full sm:w-auto">
                <button className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-white/10 bg-white/10 px-6 font-bold text-sm text-white transition-all hover:bg-white/20 sm:w-full">
                  <Compass className="h-5 w-5 text-[#ff602e]" />
                  <span>View Campus Grid</span>
                </button>
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Capabilities strip */}
      <section className="border-t border-neutral-200/60 px-4 py-8 dark:border-white/5 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400 sm:text-[11px]">
          {[
            'Calibrated AI detection',
            'SHA-256 evidence hashing',
            'Role-based access control',
            'Offline-ready QR passes',
            'Multi-floor responder routing',
          ].map((capability, index) => (
            <motion.span
              key={capability}
              className="flex items-center gap-2"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.07, ease: 'easeOut' }}
            >
              <ShieldAlert className="h-3 w-3 text-blue-500" />
              {capability}
            </motion.span>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
