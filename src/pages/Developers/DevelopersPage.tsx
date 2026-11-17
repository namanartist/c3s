// src/pages/Developers/DevelopersPage.tsx
/**
 * Developer & Leadership — the people behind C3S.
 * Premium command-center layout matching the rest of the platform:
 * floating glass command bar, ambient blueprint grid, motion-driven
 * sections, and a two-pane hero. Content is factual (MITS Gwalior).
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Code2,
  GraduationCap,
  Globe,
  CheckCircle2,
  HeartHandshake,
  Cpu,
  Award,
  Mail,
  Copy,
  Check,
  ShieldCheck,
  Layers,
  Terminal,
  Zap,
  Eye,
  Activity,
  Compass,
  GitBranch,
} from 'lucide-react';
import { motion } from 'motion/react';
import DrDKD from '@/assets/DrDheerajDixit.jpg';
import ThemeToggle from '@/components/ui/ThemeToggle';

// Icons for social channels
const GitHubIcon = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const LinkedInIcon = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const fadeUp = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
};

const sectionEyebrow = (icon: React.ReactNode, label: string, tone: string) => (
  <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] ${tone}`}>
    {icon}
    <span>{label}</span>
  </div>
);

export default function DevelopersPage() {
  const navigate = useNavigate();
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'frontend' | 'backend' | 'ai' | 'systems'>('all');

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText('namanlahariya@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const impactStats = [
    { value: '93.8%', label: 'Fight AI precision', tone: 'text-emerald-500 dark:text-emerald-400' },
    { value: '<3s', label: 'SOS → dispatch', tone: 'text-cyan-500 dark:text-cyan-400' },
    { value: '12', label: 'CCTV streams live', tone: 'text-indigo-500 dark:text-indigo-400' },
    { value: '1', label: 'Unified defence grid', tone: 'text-rose-500 dark:text-rose-400' },
  ];

  const careerHighlights = [
    {
      title: 'C3S Flagship System Architecture',
      desc: 'Conceived and engineered the Campus Surveillance & Safety System featuring 12-camera optical fight AI, non-blocking Dijkstra indoor pathfinding, and instant 1-tap SOS responder dispatch.',
    },
    {
      title: 'Clix Hub Campus Platform',
      desc: 'Built Clix Hub (Club Lifecycle & Experience Hub) for MITS Gwalior, digitalizing club governance, student event passes, and institutional Dean verification pipelines.',
    },
    {
      title: 'Frontend Battle Finalist @ MITS Gwalior',
      desc: 'Showcased high-concurrency UI architecture, vector SVG indoor map rendering, and intuitive administrative command centers.',
    },
    {
      title: 'Full-Stack & Intelligent Systems Engineering',
      desc: 'Deep specialization in React 19, TypeScript, Node.js, distributed MongoDB graph collections, and OpenCV spatio-temporal computer vision.',
    },
  ];

  const socialLinks = [
    {
      name: 'GitHub',
      handle: '@namanartist',
      url: 'https://github.com/namanartist',
      icon: <GitHubIcon size={17} className="text-slate-600 dark:text-slate-200" />,
    },
    {
      name: 'LinkedIn',
      handle: 'naman-lahariya',
      url: 'https://www.linkedin.com/in/naman-lahariya',
      icon: <LinkedInIcon size={17} className="text-blue-600 dark:text-blue-400" />,
    },
    {
      name: 'Portfolio',
      handle: 'namanlahariya.vercel.app',
      url: 'https://namanlahariya.vercel.app',
      icon: <Globe size={17} className="text-emerald-600 dark:text-emerald-400" />,
    },
  ];

  const skillMatrix = [
    { category: 'frontend' as const, name: 'React 19 & Next.js', badge: 'Advanced', desc: 'Server components, hooks, concurrent rendering & fast state pipelines' },
    { category: 'frontend' as const, name: 'TypeScript', badge: 'Type-Safe', desc: 'Strict type modeling, zero-error graph & API contracts' },
    { category: 'frontend' as const, name: 'Tailwind CSS & Motion', badge: 'UI / UX', desc: 'Hardware-accelerated animations, responsive glassmorphism & bento grids' },
    { category: 'backend' as const, name: 'Node.js & Express', badge: 'Core Backend', desc: 'Scalable REST APIs, asynchronous task workers & real-time sockets' },
    { category: 'backend' as const, name: 'MongoDB Graph Storage', badge: 'Database', desc: 'Spatial node/edge collections, building indexes & geo-query aggregation' },
    { category: 'ai' as const, name: 'Optical Flow Fight AI', badge: 'Vision Model', desc: 'Spatio-temporal frame differencing with Kaggle RWF-2000 93.8% benchmark' },
    { category: 'ai' as const, name: 'Real-time Person Detection', badge: 'Surveillance', desc: 'Crowd density estimation, bounding boxes & auto-dispatch triggers' },
    { category: 'systems' as const, name: 'Async Dijkstra Algorithm', badge: 'Routing Engine', desc: 'Yielding pathfinder via requestAnimationFrame preventing UI freeze' },
    { category: 'systems' as const, name: 'WGS84 & OSM Georeferencing', badge: 'Spatial GIS', desc: 'Coordinate affine transformation from GPS satellites to vector campus SVG' },
  ];

  const filteredSkills = activeTab === 'all' ? skillMatrix : skillMatrix.filter((s) => s.category === activeTab);
  const skillCounts = {
    all: skillMatrix.length,
    frontend: skillMatrix.filter((s) => s.category === 'frontend').length,
    backend: skillMatrix.filter((s) => s.category === 'backend').length,
    ai: skillMatrix.filter((s) => s.category === 'ai').length,
    systems: skillMatrix.filter((s) => s.category === 'systems').length,
  };

  const signatureBuilds = [
    {
      title: 'C3S — Campus Surveillance & Safety System',
      tagline: 'Autonomous institutional defence grid',
      desc: 'Real-time 12-cam CCTV surveillance grid, calibrated fight AI detection, 1-tap multimodal emergency SOS, and visitor self check-in at the gate.',
      badge: 'Current Platform',
      badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
      stats: '12 Cameras • <90s QRF ETA',
      link: '/',
      isInternal: true,
      cta: 'Open the live platform',
    },
    {
      title: 'Clix Hub — Club Lifecycle & Experience Hub',
      tagline: 'MITS Gwalior centralized experience platform',
      desc: 'Campus portal managing verified digital certificates, event ticketing, club leadership elections, and Dean approval pipelines.',
      badge: 'Live on Vercel',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      stats: '10+ Clubs • Verified Passes',
      link: 'https://clixhub.vercel.app',
      isInternal: false,
      cta: 'Visit live platform',
    },
    {
      title: 'MITS Vector Indoor Navigation Engine',
      tagline: 'Non-blocking multi-floor shortest path',
      desc: 'Custom Dijkstra operating on multi-floor SVG blueprints with GPS-to-SVG projection and wheelchair-accessible routing.',
      badge: 'Graph Engine',
      badgeClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30',
      stats: 'Zero-Freeze UI • 4 Floor Maps',
      link: '/map',
      isInternal: true,
      cta: 'Open the map engine',
    },
  ];

  const engineeringPillars = [
    {
      icon: Zap,
      title: 'Non-Blocking Pathfinding',
      desc: 'Yields execution to the main thread via requestAnimationFrame so the map canvas never stutters during computation.',
      step: '01',
    },
    {
      icon: Eye,
      title: 'Spatio-Temporal Vision',
      desc: 'Real-time optical-flow difference analysis detects aggressive motion and flags fights above 90% confidence.',
      step: '02',
    },
    {
      icon: ShieldCheck,
      title: 'Cryptographic QR Passes',
      desc: 'Time-rotating digital passes with zero manual gate logs and instant headcount tracking.',
      step: '03',
    },
    {
      icon: Activity,
      title: 'Rapid Incident Dispatch',
      desc: 'SOS alerts capture camera snapshots, pinpoint coordinates, and route the nearest rover guard in under 90s.',
      step: '04',
    },
  ];

  const partners = [
    {
      initials: 'AJ',
      name: 'Abhinav Jaiswal',
      role: 'Project Partner',
      dept: 'Technical Collaborator • MITS Gwalior',
      quote: 'Active contributor to system integration, real-world protocol verification, and campus emergency dispatch response testing.',
      focus: 'Integration & Testing',
      accent: 'cyan' as const,
    },
    {
      initials: 'AG',
      name: 'Abhinav Gupta',
      role: 'Project Partner',
      dept: 'Technical Collaborator • MITS Gwalior',
      quote: 'Collaborative developer dedicated to campus network verification, user flow refinement, and field data calibration.',
      focus: 'Field Validation & UX',
      accent: 'indigo' as const,
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-slate-50 font-sans text-slate-900 antialiased transition-colors selection:bg-sky-600 selection:text-white dark:bg-[#05070d] dark:text-slate-100">
      {/* ── Ambient backdrop ─────────────────────────────────────────── */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[540px] w-[540px] rounded-full bg-sky-500/[0.10] blur-[150px] dark:bg-sky-600/20" />
        <div className="absolute -right-40 top-1/4 h-[480px] w-[480px] rounded-full bg-indigo-500/[0.10] blur-[150px] dark:bg-indigo-600/20" />
        <div className="absolute -bottom-40 left-1/4 h-[460px] w-[460px] rounded-full bg-emerald-500/[0.08] blur-[160px] dark:bg-emerald-600/15" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.6) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
      </div>

      {/* ── Floating command bar ─────────────────────────────────────── */}
      <header className="sticky top-3 z-50 mx-auto max-w-6xl px-3 sm:top-4 sm:px-6">
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-white/85 p-1.5 shadow-lg shadow-slate-900/[0.04] backdrop-blur-2xl sm:p-2 dark:border-white/[0.08] dark:bg-[#070b16]/85 dark:shadow-black/40">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="group flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10">
              <img src="/c3s_logo.png" alt="C3S Logo" className="h-full w-full object-contain" />
            </span>
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-slate-800 dark:text-white">C3S</span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="hidden truncate font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 sm:inline dark:text-slate-400">People &amp; Craft</span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-2 text-[11px] font-bold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white"
              title="Copy link to this page"
              aria-label="Copy link to this page"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
              <span className="hidden md:inline">{copiedLink ? 'Copied' : 'Share'}</span>
            </button>
            <Link
              to="/map"
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-3 py-2 text-[11px] font-black text-white shadow-lg shadow-sky-600/25 transition hover:from-sky-500 hover:to-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <Compass className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Campus Grid</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl space-y-14 px-4 pb-20 pt-8 sm:space-y-16 sm:px-6 sm:pt-12 lg:space-y-20">
        {/* ═══ HERO ═══════════════════════════════════════════════════════ */}
        <section aria-label="Developer profile" className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-10">
          {/* Left — bio */}
          <div className="space-y-6 lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5"
            >
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
              </span>
              <span className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-sky-700 dark:text-sky-300">
                Lead Architect &amp; Campus Creator
              </span>
            </motion.div>

            <div>
              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.06 }}
                className="text-4xl font-black leading-[1.02] tracking-tight text-slate-900 sm:text-6xl dark:text-white"
              >
                Naman<br />Lahariya
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.14 }}
                className="mt-3 bg-gradient-to-r from-sky-500 via-cyan-400 to-indigo-500 bg-clip-text text-base font-extrabold text-transparent sm:text-2xl"
              >
                Full Stack Developer &amp; Intelligent Systems Architect
              </motion.p>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2 }}
              className="max-w-xl text-sm leading-relaxed text-slate-600 sm:text-[15px] dark:text-slate-300"
            >
              Engineer building high-concurrency institutional web architectures, non-blocking graph
              navigation engines and optical edge AI. Creator of the{' '}
              <span className="font-bold text-slate-900 dark:text-white">C3S Campus Surveillance &amp; Safety Network</span>{' '}
              and <span className="font-bold text-slate-900 dark:text-white">Clix Hub</span> at Madhav Institute
              of Technology and Science (MITS) Gwalior.
            </motion.p>

            {/* Quick facts */}
            <motion.dl
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.26 }}
              className="grid grid-cols-3 gap-2 border-y border-slate-200 py-4 dark:border-white/[0.08]"
            >
              {[
                { k: 'Role', v: 'Full Stack Architect' },
                { k: 'College', v: 'MITS Gwalior' },
                { k: 'Based in', v: 'Gwalior, India' },
              ].map(({ k, v }) => (
                <div key={k}>
                  <dt className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{k}</dt>
                  <dd className="mt-1 text-[11px] font-bold text-slate-800 sm:text-xs dark:text-slate-100">{v}</dd>
                </div>
              ))}
            </motion.dl>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.32 }}
              className="flex flex-wrap items-center gap-2.5"
            >
              <button
                type="button"
                onClick={handleCopyEmail}
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-sky-600/30 transition hover:from-sky-500 hover:to-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                {copiedEmail ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                    <span>Email copied!</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    <span>Get in touch</span>
                  </>
                )}
              </button>
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
                >
                  {item.icon}
                  <span>{item.name}</span>
                  <ExternalLink className="h-3 w-3 text-slate-400 transition-colors group-hover:text-sky-500" aria-hidden="true" />
                </a>
              ))}
            </motion.div>
          </div>

          {/* Right — portrait card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18, ease: 'easeOut' }}
            className="lg:col-span-5"
          >
            <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/[0.06] dark:border-white/[0.08] dark:bg-gradient-to-b dark:from-white/[0.05] dark:to-white/[0.01] dark:shadow-black/50">
              <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl dark:bg-sky-500/15" />
              <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/15" />

              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 dark:border-white/10">
                <img
                  src="https://github.com/namanartist.png"
                  alt="Naman Lahariya"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&auto=format&fit=crop&q=80';
                  }}
                  className="h-72 w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03] sm:h-80"
                />
                <span className="absolute right-3 top-3 flex items-center gap-2 rounded-full border border-emerald-500/40 bg-slate-950/85 px-3 py-1.5 backdrop-blur-md">
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="font-mono text-[9px] font-black uppercase tracking-widest text-emerald-400">Available</span>
                </span>
                <span className="absolute bottom-3 left-3 rounded-full border border-sky-500/40 bg-slate-950/85 px-3 py-1.5 font-mono text-[9px] font-black uppercase tracking-widest text-sky-400 backdrop-blur-md">
                  MITS Campus Creator
                </span>
              </div>

              {/* Stat tiles */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { k: 'Fight AI', v: '93.8%', tone: 'text-emerald-600 dark:text-emerald-400' },
                  { k: 'QRF ETA', v: '<90s', tone: 'text-cyan-600 dark:text-cyan-400' },
                  { k: 'CCTV', v: '12 cams', tone: 'text-indigo-600 dark:text-indigo-400' },
                ].map(({ k, v, tone }) => (
                  <div key={k} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-white/[0.06] dark:bg-white/[0.03]">
                    <p className="font-mono text-[8px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{k}</p>
                    <p className={`mt-0.5 text-base font-black ${tone}`}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* ═══ IMPACT BAND ══════════════════════════════════════════════ */}
        <motion.section
          aria-label="Platform impact"
          {...fadeUp}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white/70 p-2 backdrop-blur-xl md:grid-cols-4 dark:border-white/[0.08] dark:bg-white/[0.03]"
        >
          {impactStats.map(({ value, label, tone }) => (
            <div key={label} className="rounded-xl px-4 py-4 text-center transition-colors hover:bg-slate-50 md:py-5 dark:hover:bg-white/[0.03]">
              <p className={`font-mono text-2xl font-black leading-none md:text-3xl ${tone}`}>{value}</p>
              <p className="mt-1.5 font-mono text-[8px] font-bold uppercase leading-snug tracking-[0.18em] text-slate-400 sm:text-[9px] dark:text-slate-500">{label}</p>
            </div>
          ))}
        </motion.section>

        {/* ═══ SIGNATURE BUILDS ═════════════════════════════════════════ */}
        <section aria-label="Signature builds" className="space-y-6">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end dark:border-white/[0.08]">
            <div>
              {sectionEyebrow(<Cpu className="h-4 w-4" aria-hidden="true" />, 'Featured engineering work', 'text-sky-600 dark:text-sky-400')}
              <h2 className="mt-1.5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">Signature Builds</h2>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Real-world systems built for high throughput, sub-second pathfinding and autonomous safety response.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {signatureBuilds.map((build, index) => (
              <motion.article
                key={build.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-sky-500/40 hover:shadow-xl dark:border-white/[0.08] dark:bg-white/[0.02] dark:hover:border-sky-500/30"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-full border px-2.5 py-1 font-mono text-[8px] font-black uppercase tracking-widest ${build.badgeClass}`}>
                      {build.badge}
                    </span>
                    <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500">{build.stats}</span>
                  </div>
                  <h3 className="mt-4 text-base font-black leading-snug text-slate-900 transition-colors group-hover:text-sky-600 dark:text-white dark:group-hover:text-sky-400">
                    {build.title}
                  </h3>
                  <p className="mt-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{build.tagline}</p>
                  <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{build.desc}</p>
                </div>
                <div className="mt-5 border-t border-slate-100 pt-4 dark:border-white/[0.06]">
                  {build.isInternal ? (
                    <Link to={build.link} className="group/link inline-flex cursor-pointer items-center gap-1.5 text-xs font-black text-sky-600 transition-colors hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300">
                      {build.cta}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" aria-hidden="true" />
                    </Link>
                  ) : (
                    <a href={build.link} target="_blank" rel="noopener noreferrer" className="group/link inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400">
                      {build.cta}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        {/* ═══ MENTORSHIP ═══════════════════════════════════════════════ */}
        <section aria-label="Academic guidance" className="space-y-6">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end dark:border-white/[0.08]">
            <div>
              {sectionEyebrow(<GraduationCap className="h-4 w-4" aria-hidden="true" />, 'Academic guidance & department leadership', 'text-amber-600 dark:text-amber-400')}
              <h2 className="mt-1.5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">Under the Guidance of</h2>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Systems architecture guided by faculty mentorship, discrete mathematical rigor and institutional standards.
            </p>
          </div>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-50 via-white to-amber-50/50 p-6 shadow-lg sm:p-8 dark:from-amber-500/10 dark:via-white/[0.02] dark:to-transparent"
          >
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl dark:bg-amber-500/10" />
            <div className="relative flex flex-col items-center gap-6 text-center lg:flex-row lg:items-center lg:gap-10 lg:text-left">
              <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-2xl border-2 border-amber-500/40 bg-slate-900 shadow-2xl shadow-amber-500/20 sm:h-48 sm:w-48">
                <img src={DrDKD} alt="Dr. Dheeraj Kumar Dixit" className="h-full w-full object-cover" />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>

              <div className="min-w-0 flex-1 space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-[9px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                  <Award className="h-3.5 w-3.5" aria-hidden="true" />
                  Faculty Mentor &amp; Head of Department
                </span>
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">Dr. Dheeraj Kumar Dixit</h3>
                  <p className="mt-1 text-sm font-bold text-amber-600 dark:text-amber-400">HOD — Department of Mathematics and Computing</p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Madhav Institute of Technology and Science (MITS), Gwalior</p>
                </div>
                <p className="max-w-2xl text-xs italic leading-relaxed text-slate-600 sm:text-[13px] dark:text-slate-300">
                  &ldquo;Academic mentorship instilling mathematical precision, robust algorithm optimization,
                  graph traversal reliability, and ethical safety standards across institutional intelligent systems.&rdquo;
                </p>
                <div className="flex flex-wrap justify-center gap-2.5 pt-2 lg:justify-start">
                  <a
                    href="https://web.mitsgwalior.in/faculty-profiles-emc-2/dr-dheeraj-kumar-dixit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/25 transition hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    Official MITS profile
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                  <a
                    href="mailto:dheerajdixit@mitsgwalior.in"
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
                  >
                    <Mail className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                    Faculty email
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ═══ PROJECT PARTNERS ═════════════════════════════════════════ */}
        <section aria-label="Project partners" className="space-y-6">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end dark:border-white/[0.08]">
            <div>
              {sectionEyebrow(<HeartHandshake className="h-4 w-4" aria-hidden="true" />, 'Technical synergy & deployment', 'text-cyan-600 dark:text-cyan-400')}
              <h2 className="mt-1.5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">Project Partners</h2>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Key collaborators on architecture testing, multi-floor coordinate validation and field calibration.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {partners.map((partner, index) => (
              <motion.div
                key={partner.name}
                {...fadeUp}
                transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
                className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-white/[0.08] dark:bg-white/[0.02] ${
                  partner.accent === 'cyan' ? 'hover:border-cyan-500/40' : 'hover:border-indigo-500/40'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    aria-hidden="true"
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr font-black text-lg text-white shadow-lg ${
                      partner.accent === 'cyan'
                        ? 'from-cyan-600 to-sky-600 shadow-cyan-500/30'
                        : 'from-indigo-600 to-violet-600 shadow-indigo-500/30'
                    }`}
                  >
                    {partner.initials}
                  </div>
                  <div className="min-w-0">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-widest ${
                        partner.accent === 'cyan'
                          ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
                          : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                      }`}
                    >
                      {partner.role}
                    </span>
                    <h3 className="mt-2 text-lg font-black text-slate-900 dark:text-white">{partner.name}</h3>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{partner.dept}</p>
                  </div>
                </div>
                <p className="mt-4 text-xs italic leading-relaxed text-slate-600 dark:text-slate-300">&ldquo;{partner.quote}&rdquo;</p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-[11px] dark:border-white/[0.06]">
                  <span className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-slate-400">
                    <CheckCircle2
                      className={`h-3.5 w-3.5 ${partner.accent === 'cyan' ? 'text-cyan-500' : 'text-indigo-500'}`}
                      aria-hidden="true"
                    />
                    {partner.focus}
                  </span>
                  <span className={`font-mono font-bold ${partner.accent === 'cyan' ? 'text-cyan-600 dark:text-cyan-300' : 'text-indigo-600 dark:text-indigo-300'}`}>
                    MITS GWL
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ═══ ENGINEERING PILLARS ══════════════════════════════════════ */}
        <section aria-label="Engineering pillars" className="space-y-6">
          <div className="border-b border-slate-200 pb-5 dark:border-white/[0.08]">
            {sectionEyebrow(<Terminal className="h-4 w-4" aria-hidden="true" />, 'Core architecture standards', 'text-violet-600 dark:text-violet-400')}
            <h2 className="mt-1.5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">Engineering Pillars</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {engineeringPillars.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.title}
                  {...fadeUp}
                  transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-500/40 hover:shadow-lg dark:border-white/[0.08] dark:bg-white/[0.02]"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-lg font-black text-slate-200 transition-colors group-hover:text-violet-400/60 dark:text-white/10">{pillar.step}</span>
                  </div>
                  <h3 className="mt-4 text-sm font-black text-slate-900 dark:text-white">{pillar.title}</h3>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{pillar.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ═══ SKILL CANVAS ═════════════════════════════════════════════ */}
        <section aria-label="Skills" className="space-y-6">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end dark:border-white/[0.08]">
            <div>
              {sectionEyebrow(<Code2 className="h-4 w-4" aria-hidden="true" />, 'Competencies & technologies', 'text-emerald-600 dark:text-emerald-400')}
              <h2 className="mt-1.5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">Skill Canvas</h2>
            </div>

            <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-1 dark:border-white/[0.08] dark:bg-white/[0.03]" role="tablist" aria-label="Filter skills">
              {(['all', 'frontend', 'backend', 'ai', 'systems'] as const).map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 ${
                    activeTab === tab
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white'
                  }`}
                >
                  {tab} · {skillCounts[tab]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSkills.map((sk) => (
              <div
                key={sk.name}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-500/40 dark:border-white/[0.08] dark:bg-white/[0.02]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[8px] font-black uppercase tracking-widest text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-400">
                      {sk.category}
                    </span>
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{sk.badge}</span>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">{sk.name}</h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{sk.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ MILESTONES ═══════════════════════════════════════════════ */}
        <section aria-label="Milestones" className="space-y-6">
          <div className="border-b border-slate-200 pb-5 dark:border-white/[0.08]">
            {sectionEyebrow(<Layers className="h-4 w-4" aria-hidden="true" />, 'Experience & institutional impact', 'text-sky-600 dark:text-sky-400')}
            <h2 className="mt-1.5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">Milestones &amp; Track Record</h2>
          </div>

          <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2">
            {careerHighlights.map((item, index) => (
              <motion.div
                key={item.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: index * 0.07, ease: 'easeOut' }}
                className="flex items-start gap-3.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-white/[0.08] dark:bg-white/[0.02]"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10">
                  <GitBranch className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold leading-snug text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ═══ CONNECT CTA ══════════════════════════════════════════════ */}
        <section
          aria-label="Get in touch"
          className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 p-8 text-center text-white sm:p-12 dark:border-white/[0.08]"
        >
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
          <p className="relative font-mono text-[10px] font-black uppercase tracking-[0.28em] text-sky-400">Build with us</p>
          <h2 className="relative mt-3 text-2xl font-black leading-tight tracking-tight sm:text-4xl">
            Have a campus hard problem?<br />
            <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">Let&apos;s engineer the fix.</span>
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">
            Open to internships, full-time roles, research collaboration and campus safety deployments.
          </p>
          <div className="relative mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyEmail}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-black text-slate-900 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              {copiedEmail ? <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <Mail className="h-4 w-4" aria-hidden="true" />}
              {copiedEmail ? 'namanlahariya@gmail.com copied!' : 'namanlahariya@gmail.com'}
            </button>
            <a
              href="https://github.com/namanartist"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-xs font-bold text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <GitHubIcon size={16} className="text-white" />
              @namanartist
            </a>
          </div>
        </section>

        {/* ═══ FOOTER STRIP ═════════════════════════════════════════════ */}
        <footer className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 font-mono text-[10px] uppercase tracking-widest text-slate-400 sm:flex-row dark:border-white/[0.08] dark:text-slate-600">
          <span>C3S · Campus Surveillance &amp; Safety Network · MITS Gwalior</span>
          <nav className="flex items-center gap-4" aria-label="Footer navigation">
            <Link to="/" className="transition-colors hover:text-sky-500">Home</Link>
            <span aria-hidden="true">·</span>
            <Link to="/map" className="transition-colors hover:text-sky-500">Campus Grid</Link>
            <span aria-hidden="true">·</span>
            <Link to="/student" className="transition-colors hover:text-sky-500">Student Hub</Link>
          </nav>
        </footer>
      </main>
    </div>
  );
}
