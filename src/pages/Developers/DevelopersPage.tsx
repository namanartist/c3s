// src/pages/Developers/DevelopersPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
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
  ChevronRight,
  Compass,
  Eye,
  Activity
} from 'lucide-react';
import DrDKD from '@/assets/DrDheerajDixit.jpg';
import ThemeToggle from '@/components/ui/ThemeToggle';

// Icons for social channels
const GitHubIcon = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const LinkedInIcon = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function DevelopersPage() {
  const navigate = useNavigate();
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'frontend' | 'backend' | 'ai' | 'systems'>('all');

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('namanlahariya@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const careerHighlights = [
    {
      title: 'C3S Flagship System Architecture',
      desc: 'Conceived and engineered the Campus Surveillance & Safety System featuring 12-camera optical fight AI, non-blocking Dijkstra indoor pathfinding, and instant 1-tap SOS responder dispatch.'
    },
    {
      title: 'Clix Hub Campus Platform',
      desc: 'Built Clix Hub (Club Lifecycle & Experience Hub) for MITS Gwalior, digitalizing club governance, student event passes, and institutional Dean verification pipelines.'
    },
    {
      title: 'Frontend Battle Finalist @ MITS Gwalior',
      desc: 'Showcased high-concurrency UI architecture, vector SVG indoor map rendering, and intuitive administrative command centers.'
    },
    {
      title: 'Full-Stack & Intelligent Systems Engineering',
      desc: 'Deep specialization in React 19, TypeScript, Node.js, distributed MongoDB graph collections, and OpenCV spatio-temporal computer vision.'
    }
  ];

  const socialLinks = [
    {
      name: 'GitHub',
      handle: '@namanartist',
      url: 'https://github.com/namanartist',
      icon: <GitHubIcon size={20} className="text-slate-200" />,
      color: 'from-slate-800 to-slate-900 border-white/10'
    },
    {
      name: 'LinkedIn',
      handle: 'naman-lahariya',
      url: 'https://www.linkedin.com/in/naman-lahariya',
      icon: <LinkedInIcon size={20} className="text-blue-400" />,
      color: 'from-blue-900/40 to-blue-950/60 border-blue-500/20'
    },
    {
      name: 'Portfolio',
      handle: 'namanlahariya.vercel.app',
      url: 'https://namanlahariya.vercel.app',
      icon: <Globe size={20} className="text-emerald-400" />,
      color: 'from-emerald-900/40 to-emerald-950/60 border-emerald-500/20'
    }
  ];

  const skillMatrix = [
    {
      category: 'frontend',
      name: 'React 19 & Next.js',
      badge: 'Advanced',
      desc: 'Server components, hooks, concurrent rendering & fast state pipelines'
    },
    {
      category: 'frontend',
      name: 'TypeScript',
      badge: 'Type-Safe',
      desc: 'Strict type modeling, zero-error graph & API contracts'
    },
    {
      category: 'frontend',
      name: 'Tailwind CSS & Motion',
      badge: 'UI / UX',
      desc: 'Hardware-accelerated animations, responsive glassmorphism & Bento grids'
    },
    {
      category: 'backend',
      name: 'Node.js & Express',
      badge: 'Core Backend',
      desc: 'Scalable REST APIs, asynchronous task workers & real-time sockets'
    },
    {
      category: 'backend',
      name: 'MongoDB Graph Storage',
      badge: 'Database',
      desc: 'Spatial node/edge collections, building indexes & geo-query aggregation'
    },
    {
      category: 'ai',
      name: 'Optical Flow Fight AI',
      badge: 'Vision Model',
      desc: 'Spatio-temporal frame differencing with Kaggle RWF-2000 93.8% confidence benchmark'
    },
    {
      category: 'ai',
      name: 'Real-time Person Detection',
      badge: 'Surveillance',
      desc: 'Crowd density estimation, bounding boxes & auto-dispatch triggers'
    },
    {
      category: 'systems',
      name: 'Async Dijkstra Algorithm',
      badge: 'Routing Engine',
      desc: 'Yielding pathfinder via requestAnimationFrame preventing UI freeze'
    },
    {
      category: 'systems',
      name: 'WGS84 & OSM Georeferencing',
      badge: 'Spatial GIS',
      desc: 'Coordinate affine transformation from GPS satellites to vector campus SVG'
    }
  ];

  const filteredSkills = activeTab === 'all'
    ? skillMatrix
    : skillMatrix.filter((s) => s.category === activeTab);

  const signatureBuilds = [
    {
      title: 'C3S — Campus Surveillance & Safety System',
      tagline: 'Autonomous Institutional Defense & Tactical Safe Path Navigation',
      desc: 'Real-time 12-cam CCTV surveillance grid, Kaggle fight AI detection (93.8% accuracy), 1-tap multimodal emergency SOS, and turn-by-turn indoor routing.',
      badge: 'Current Platform',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      stats: '12 Cameras • <90s QRF ETA',
      link: '/',
      isInternal: true
    },
    {
      title: 'Clix Hub — Club Lifecycle & Experience Hub',
      tagline: 'MITS Gwalior Centralized Experience Platform',
      desc: 'Comprehensive campus portal managing verified digital certificates, event ticketing, club leadership elections, and Dean approval pipelines.',
      badge: 'Live on Vercel',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      stats: '10+ Clubs • Verified Passes',
      link: 'https://clixhub.vercel.app',
      isInternal: false
    },
    {
      title: 'MITS Vector Indoor Navigation Engine',
      tagline: 'Non-Blocking Multi-Floor Shortest Path Pathfinder',
      desc: 'Custom Dijkstra implementation operating on multi-floor SVG campus blueprints with GPS-to-SVG projection and wheelchair accessible routes.',
      badge: 'Graph Engine',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      stats: 'Zero-Freeze UI • 4 Floormap Grids',
      link: '/map',
      isInternal: true
    }
  ];

  const engineeringPillars = [
    {
      icon: Zap,
      title: 'Non-Blocking Pathfinding',
      desc: 'Yields execution to the main thread via requestAnimationFrame so the map canvas never stutters during computation.'
    },
    {
      icon: Eye,
      title: 'Spatio-Temporal Vision',
      desc: 'Real-time optical flow difference analysis detects aggressive movements and flags fights above 90% confidence.'
    },
    {
      icon: ShieldCheck,
      title: 'Cryptographic QR Passes',
      desc: 'Time-rotating digital access passes ensure zero manual gate logs and instant headcount tracking.'
    },
    {
      icon: Activity,
      title: 'Rapid Incident Dispatch',
      desc: 'SOS alerts automatically capture camera snapshots, pinpoint coordinates, and route the nearest rover guard in under 90s.'
    }
  ];

  return (
    <div className="relative min-h-screen w-full bg-slate-50 dark:bg-[#050711] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white antialiased overflow-x-hidden transition-colors">
      {/* Dynamic Ambient Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-12%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[150px] opacity-25 bg-blue-600" />
        <div className="absolute top-1/3 right-[-12%] w-[45vw] h-[45vw] rounded-full blur-[150px] opacity-20 bg-indigo-600" />
        <div className="absolute bottom-[-10%] left-[15%] w-[40vw] h-[40vw] rounded-full blur-[160px] opacity-15 bg-emerald-500" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Modern Top Floating Command Bar */}
      <header className="sticky top-4 z-50 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/75 backdrop-blur-2xl shadow-xl transition-colors">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-xs font-semibold cursor-pointer group"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-6 rounded-lg bg-white overflow-hidden p-0.5 shadow-sm">
              <img src="/c3s_logo.png" alt="C3S Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white tracking-wide">C3S</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-medium hidden sm:inline">Developer &amp; Leadership</span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/10 text-xs font-semibold transition cursor-pointer"
              title="Share Developer Profile"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>

            <Link
              to="/map"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-blue-600/30 transition-all"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Campus Map</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-24 space-y-14 sm:space-y-20">
        
        {/* Section 1: Hero Bento Section (Naman Lahariya Profile) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Biography & Vision (Col 7) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-black uppercase tracking-[0.2em]">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-blue-400" />
              <span>Lead Architect &amp; Campus Creator</span>
            </div>

            <div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.08]">
                Naman Lahariya
              </h1>
              <p className="mt-2 text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
                Full Stack Developer &amp; Intelligent Systems Architect
              </p>
            </div>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Passionate engineer building high-concurrency institutional web architectures, non-blocking graph navigation engines, and optical edge AI systems. Creator of the C3S Campus Surveillance &amp; Safety Network and Clix Hub at Madhav Institute of Technology &amp; Science (MITS) Gwalior.
            </p>

            {/* Quick Bio Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div className="rounded-2xl p-3.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block mb-0.5">Role</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Full Stack Architect</span>
              </div>
              <div className="rounded-2xl p-3.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block mb-0.5">College</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">MITS Gwalior</span>
              </div>
              <div className="rounded-2xl p-3.5 bg-white/[0.03] border border-white/10 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block mb-0.5">Location</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Gwalior, MP, India</span>
              </div>
            </div>

            {/* Direct Connect Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleCopyEmail}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                {copiedEmail ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Email Copied!</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Get in Touch</span>
                  </>
                )}
              </button>

              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/10 text-white text-xs font-bold transition-all group"
                >
                  {item.icon}
                  <span>{item.name}</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-blue-400 transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Right Column: Hero Visual Card (Col 5) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gradient-to-b dark:from-white/[0.04] dark:to-white/[0.01] p-5 sm:p-6 shadow-xl dark:shadow-2xl backdrop-blur-2xl overflow-hidden group transition-colors">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Photo Frame */}
              <div className="relative w-full overflow-hidden rounded-2xl border-2 border-blue-500/30 bg-slate-900 shadow-xl">
                <img
                  src="https://github.com/namanartist.png"
                  alt="Naman Lahariya"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&auto=format&fit=crop&q=80';
                  }}
                  className="w-full h-80 sm:h-96 object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />

                {/* Status Pill */}
                <div className="absolute top-3.5 right-3.5 flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-500/40 shadow-lg">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Available</span>
                </div>

                <div className="absolute bottom-3.5 left-3.5 bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-blue-500/40 shadow-lg">
                  <p className="text-[10px] font-black uppercase tracking-wider text-blue-400">MITS Campus Creator</p>
                </div>
              </div>

              {/* Stat Grid Under Photo */}
              <div className="grid grid-cols-3 gap-2.5 mt-4">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Fight AI</div>
                  <div className="text-lg font-black text-emerald-400 mt-0.5">93.8%</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">QRF ETA</div>
                  <div className="text-lg font-black text-cyan-400 mt-0.5">&lt;90s</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">CCTV Feeds</div>
                  <div className="text-lg font-black text-indigo-400 mt-0.5">12 Cam</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Signature Builds Bento Grid */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-black text-blue-400 uppercase tracking-widest">
                <Cpu className="w-4 h-4" />
                <span>Featured Engineering Work</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">Signature Builds</h2>
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              Real-world software built to handle high throughput, sub-second pathfinding, and autonomous safety alerts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {signatureBuilds.map((build, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-6 flex flex-col justify-between hover:border-blue-500/40 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all group relative overflow-hidden shadow-sm dark:shadow-none"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${build.badgeColor}`}>
                      {build.badge}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{build.stats}</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                      {build.title}
                    </h3>
                    <p className="text-xs text-blue-300 font-semibold mt-0.5">{build.tagline}</p>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {build.desc}
                  </p>
                </div>

                <div className="pt-5 mt-4 border-t border-white/10 flex items-center justify-between">
                  {build.isInternal ? (
                    <Link
                      to={build.link}
                      className="text-xs font-bold text-white group-hover:text-blue-400 flex items-center gap-1.5 transition-colors"
                    >
                      <span>Launch Interface</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ) : (
                    <a
                      href={build.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-white group-hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
                    >
                      <span>Visit Live Platform</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Academic Guidance & Mentorship (Dr. Dheeraj Kumar Dixit) */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-widest">
                <GraduationCap className="w-4 h-4" />
                <span>Academic Guidance &amp; Department Leadership</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">Under the Guidance of</h2>
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              System architecture guided by faculty mentorship, discrete mathematical rigor, and institutional engineering standards.
            </p>
          </div>

          <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-50/70 dark:from-amber-500/10 via-white dark:via-white/[0.02] to-amber-50/30 dark:to-slate-950 p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-xl dark:shadow-2xl transition-colors">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
              {/* Photo Frame */}
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-3xl overflow-hidden border-2 border-amber-500/40 bg-slate-900 shrink-0 shadow-2xl shadow-amber-500/20">
                <img
                  src={DrDKD}
                  alt="Dr. Dheeraj Kumar Dixit"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Mentor Bio & Links */}
              <div className="space-y-3 text-center lg:text-left flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                  <Award className="w-3.5 h-3.5" />
                  <span>Faculty Mentor &amp; Head of Department</span>
                </div>

                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Dr. Dheeraj Kumar Dixit</h3>
                  <p className="text-sm sm:text-base font-bold text-amber-400 mt-0.5">
                    HOD — Department of Mathematics and Computing
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    Madhav Institute of Technology and Science (MITS), Gwalior
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed pt-1">
                  &ldquo;Academic mentorship instilling mathematical precision, robust algorithm optimization, graph traversal reliability, and ethical safety standards across institutional intelligent systems.&rdquo;
                </p>

                <div className="flex flex-wrap gap-3 pt-3 justify-center lg:justify-start">
                  <a
                    href="https://web.mitsgwalior.in/faculty-profiles-emc-2/dr-dheeraj-kumar-dixit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 transition-all"
                  >
                    <span>View Official MITS Faculty Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href="mailto:dheerajdixit@mitsgwalior.in"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/10 text-white font-bold text-xs transition-all"
                  >
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>Contact via Faculty Email</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Project Partners & Collaborators (Abhinav Jaiswal & Abhinav Gupta) */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-black text-cyan-400 uppercase tracking-widest">
                <HeartHandshake className="w-4 h-4" />
                <span>Technical Synergy &amp; Deployment</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">Project Partners &amp; Collaborators</h2>
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              Key team contributors collaborating on architecture testing, multi-floor coordinate validation, and campus validation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Partner 1: Abhinav Jaiswal */}
            <div className="rounded-3xl border border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-gradient-to-b dark:from-cyan-500/10 dark:to-white/[0.02] p-6 sm:p-7 backdrop-blur-xl relative overflow-hidden group hover:border-cyan-500/60 transition-all shadow-md dark:shadow-xl">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-black text-xl flex items-center justify-center border-2 border-cyan-400/40 shadow-lg shadow-cyan-500/30 shrink-0">
                  AJ
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                    Project Partner
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1.5">Abhinav Jaiswal</h3>
                  <p className="text-xs text-cyan-400 font-semibold">Technical Collaborator • MITS Gwalior</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                &ldquo;Active contributor to system integration, real-world protocol verification, and campus emergency dispatch response testing.&rdquo;
              </p>

              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  Integration &amp; Testing
                </span>
                <span className="font-mono text-cyan-300">MITS Gwalior</span>
              </div>
            </div>

            {/* Partner 2: Abhinav Gupta */}
            <div className="rounded-3xl border border-slate-200 dark:border-indigo-500/30 bg-white dark:bg-gradient-to-b dark:from-indigo-500/10 dark:to-white/[0.02] p-6 sm:p-7 backdrop-blur-xl relative overflow-hidden group hover:border-indigo-500/60 transition-all shadow-md dark:shadow-xl">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center border-2 border-indigo-400/40 shadow-lg shadow-indigo-500/30 shrink-0">
                  AG
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                    Project Partner
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1.5">Abhinav Gupta</h3>
                  <p className="text-xs text-indigo-400 font-semibold">Technical Collaborator • MITS Gwalior</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                &ldquo;Collaborative developer dedicated to campus network verification, user flow refinement, and field data calibration.&rdquo;
              </p>

              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  Field Validation &amp; UX
                </span>
                <span className="font-mono text-indigo-300">MITS Gwalior</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Engineering Pillars */}
        <section className="space-y-6">
          <div className="border-b border-white/10 pb-4">
            <div className="flex items-center gap-2 text-xs font-black text-purple-400 uppercase tracking-widest">
              <Terminal className="w-4 h-4" />
              <span>Core Architecture Standards</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">Engineering Pillars</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {engineeringPillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-5 hover:border-purple-500/40 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all shadow-sm dark:shadow-none"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-3.5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mb-1.5">{pillar.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 6: Interactive Skill Canvas Matrix */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-widest">
                <Code2 className="w-4 h-4" />
                <span>Competencies &amp; Technologies</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">Skill Canvas</h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 bg-white/[0.03] p-1 rounded-xl border border-white/10">
              {(['all', 'frontend', 'backend', 'ai', 'systems'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map((sk, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4.5 hover:border-emerald-500/40 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all shadow-sm dark:shadow-none flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300">
                      {sk.category.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400">{sk.badge}</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{sk.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{sk.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 7: Career Milestones */}
        <section className="space-y-6">
          <div className="border-b border-white/10 pb-4">
            <div className="flex items-center gap-2 text-xs font-black text-blue-400 uppercase tracking-widest">
              <Layers className="w-4 h-4" />
              <span>Experience &amp; Institutional Impact</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">Milestones &amp; Track Record</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {careerHighlights.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-5 flex items-start gap-3.5 hover:-translate-y-0.5 transition-transform shadow-sm dark:shadow-none"
              >
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 8: Institutional Footer Banner */}
        <footer className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white overflow-hidden p-0.5 shadow-sm">
              <img src="/c3s_logo.png" alt="C3S Logo" className="w-full h-full object-contain" />
            </div>
            <span>C3S Campus Surveillance &amp; Safety Network • MITS Gwalior</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/" className="text-blue-400 hover:underline">Home</Link>
            <span>•</span>
            <Link to="/map" className="text-blue-400 hover:underline">Campus Map</Link>
            <span>•</span>
            <Link to="/student" className="text-blue-400 hover:underline">Student Hub</Link>
          </div>
        </footer>

      </main>
    </div>
  );
}
