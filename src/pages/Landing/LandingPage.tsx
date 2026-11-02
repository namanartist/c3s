// src/pages/Landing/LandingPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Sparkles,
  MapPin,
  ShieldAlert,
  Navigation,
  Route,
  Camera,
  Bell,
  CheckCircle2,
  Building,
  Layers,
  Activity,
  Lock,
  ArrowUpRight,
  PhoneCall
} from 'lucide-react';
import { useC3SStore } from '@/store/c3sStore';
import { ROLE_DEFINITIONS, getRoleDefaultPath } from '@/lib/rbac';
import { type C3SRole } from '@/lib/mock-data/users';
import { SosModal } from '@/components/safety/SosModal';
import { Navbar } from '@/components/ui';
import Footer from '@/components/ui/footer/Footer';
import Hero from './Hero';
import About from './About';
import Features from './Features';
import './landing.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const { currentRole, setRole } = useC3SStore();
  const [selectedDirectoryTab, setSelectedDirectoryTab] = useState<'academic' | 'facilities' | 'services'>('academic');

  const primaryRoleCards: {
    role: C3SRole;
    icon: React.ElementType;
    tag: string;
    description: string;
    highlights: string[];
    accentColor: string;
    borderColor: string;
  }[] = [
    {
      role: 'STUDENT',
      icon: GraduationCap,
      tag: 'Navigation & Student Safety',
      description: 'Turn-by-turn indoor routing to any room (101, 102, labs), dynamic QR gate passes, and 1-tap SOS.',
      highlights: ['Classroom & Lab Finder', 'QR Entry/Exit Pass', 'Instant Emergency Beacon'],
      accentColor: 'from-blue-600 to-indigo-600',
      borderColor: 'border-blue-500/30 hover:border-blue-500'
    },
    {
      role: 'GUARD',
      icon: Shield,
      tag: 'Tactical Rapid Response',
      description: 'Active incident queue, automated shortest safe route to incident coordinates, and team coordination.',
      highlights: ['Live Incident Queue', 'Direct GPS Route to Alert', 'Intercom & Dispatch'],
      accentColor: 'from-amber-600 to-orange-600',
      borderColor: 'border-amber-500/30 hover:border-amber-500'
    },
    {
      role: 'PROCTOR',
      icon: Radio,
      tag: 'SOC Central Command',
      description: 'Unified CCTV camera matrix, automated fight & intrusion detection alerts, and incident orchestration.',
      highlights: ['Live 24/7 CCTV Grid', 'AI Violence Detection', 'Campus Map Threat Overlay'],
      accentColor: 'from-rose-600 to-red-600',
      borderColor: 'border-rose-500/30 hover:border-rose-500'
    },
    {
      role: 'GATEKEEPER',
      icon: QrCode,
      tag: 'Access Control',
      description: 'Ultra-fast QR pass verification, real-time campus occupancy tracking, and instant audit trails.',
      highlights: ['Sub-second QR Scanner', 'Occupancy Meter', 'Offline Pass Validation'],
      accentColor: 'from-emerald-600 to-teal-600',
      borderColor: 'border-emerald-500/30 hover:border-emerald-500'
    },
    {
      role: 'ADMIN',
      icon: Sliders,
      tag: 'Institutional Governance',
      description: 'Complete role-based access control (RBAC), camera health monitoring, gate logs, and audit reports.',
      highlights: ['Granular Permissions', 'Gate & Device Management', 'Comprehensive Audit Logs'],
      accentColor: 'from-purple-600 to-indigo-600',
      borderColor: 'border-purple-500/30 hover:border-purple-500'
    }
  ];

  const campusDirectory = {
    academic: [
      { name: 'Room 101 (J125)', desc: 'First Floor Central Promenade', map: 'Main_FF', query: '101' },
      { name: 'Room 102 (J126)', desc: 'First Floor Lecture Block', map: 'Main_FF', query: '102' },
      { name: 'Colloquium Hall', desc: 'Seminar & Conference Hall', map: 'Main_FF', query: 'colloquium' },
      { name: 'Drawing Hall (J124)', desc: 'Architecture & Design Studios', map: 'Main_FF', query: 'drawing' },
      { name: 'BE Computer Lab', desc: 'Software Engineering Labs', map: 'Main_FF', query: 'lab' },
      { name: 'Mechanical Workshops', desc: 'Fabrication & Machine Labs', map: 'Campus_Map', query: 'workshops' },
    ],
    facilities: [
      { name: 'Central Library', desc: 'Main Campus Reading Complex', map: 'Campus_Map', query: 'library' },
      { name: 'Campus Canteen', desc: 'Dining & Cafeteria Court', map: 'Campus_Map', query: 'canteen' },
      { name: 'Main Gate (Gate 1)', desc: 'Primary Campus Entrance', map: 'Campus_Map', query: 'main gate' },
      { name: 'Jubilee Gate (Gate 2)', desc: 'Secondary Transit Access', map: 'Campus_Map', query: 'jubilee' },
      { name: 'Central Promenade', desc: 'Main Academic Walkway', map: 'Campus_Map', query: 'main' },
      { name: 'AI Building Entry', desc: 'Advanced Tech & Computing Block', map: 'Campus_Map', query: 'ai' },
    ],
    services: [
      { name: "Director's Office", desc: 'Administrative Headquarters', map: 'Main_GF', query: 'director' },
      { name: 'Chief Proctor Office', desc: 'Discipline & Campus Security', map: 'Main_GF', query: 'proctor' },
      { name: 'First Aid & Health Center', desc: 'Emergency Medical Services', map: 'Campus_Map', query: 'health' },
      { name: 'Security Control Room', desc: '24/7 Surveillance SOC', map: 'Campus_Map', query: 'control' },
    ]
  };

  const handleLaunchRole = (role: C3SRole) => {
    navigate('/login', { state: { role } });
  };

  return (
    <div className="relative min-h-screen w-full bg-[#fcfaf6] dark:bg-[#050505] text-neutral-900 dark:text-white antialiased transition-colors selection:bg-[#ff602e] selection:text-white">
      {/* Modals */}
      <SosModal />

      {/* Floating Modern Header */}
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Live Campus Telemetry Strip */}
      <section className="relative w-full border-y border-neutral-200/80 dark:border-white/10 bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
              <span>40</span>
              <span className="text-blue-600 dark:text-blue-400">+</span>
            </div>
            <p className="mt-1 text-xs sm:text-sm font-semibold text-neutral-500 dark:text-neutral-400">
              Mapped Blocks & Wings
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
              <span className="text-emerald-500">&lt;</span>
              <span>3</span>
              <span className="text-xs font-bold text-neutral-400">SEC</span>
            </div>
            <p className="mt-1 text-xs sm:text-sm font-semibold text-neutral-500 dark:text-neutral-400">
              Emergency SOS Response
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
              <span>100</span>
              <span className="text-[#ff602e]">%</span>
            </div>
            <p className="mt-1 text-xs sm:text-sm font-semibold text-neutral-500 dark:text-neutral-400">
              Corridor Safety Coverage
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
              <span>±0.8</span>
              <span className="text-xs font-bold text-neutral-400">METERS</span>
            </div>
            <p className="mt-1 text-xs sm:text-sm font-semibold text-neutral-500 dark:text-neutral-400">
              Multi-Floor Vector Accuracy
            </p>
          </div>
        </div>
      </section>

      {/* Core Capabilities Bento Grid */}
      <Features />

      {/* Interactive Role-Based Workspaces */}
      <section id="portals" className="relative w-full px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3.5 py-1 rounded-full mb-4">
                <Users size={14} className="text-blue-600 dark:text-blue-400" />
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-blue-600 dark:text-blue-400">
                  Role-Based Workspaces
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.06]">
                Purpose-built portals for every stakeholder
              </h2>
              <p className="mt-4 text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Whether you are a student finding a classroom, a security officer responding to an alert,
                or a gate keeper verifying credentials, your workspace is optimized for speed and clarity.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 hover:border-neutral-400 text-sm font-semibold text-neutral-800 dark:text-neutral-200 transition-all shadow-sm cursor-pointer"
            >
              <span>Institutional Sign In</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {primaryRoleCards.map(({ role, icon: IconComponent, tag, description, highlights, borderColor }) => {
              const def = ROLE_DEFINITIONS[role];
              const isCurrent = currentRole === role;

              return (
                <div
                  key={role}
                  className={`group relative rounded-[28px] border p-6 bg-white/80 dark:bg-[#0c0d0e]/80 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between ${
                    isCurrent
                      ? 'border-blue-500 shadow-xl shadow-blue-500/10'
                      : `${borderColor} shadow-sm hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/40`
                  }`}
                >
                  <div>
                    {/* Header: Icon & Badge */}
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-900 dark:text-white group-hover:scale-105 transition-transform">
                        <IconComponent size={22} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          Current Role
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                          Ready
                        </span>
                      )}
                    </div>

                    {/* Role Title & Description */}
                    <div className="mt-5">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-neutral-400 dark:text-neutral-500">
                        {tag}
                      </span>
                      <h3 className="mt-1 text-xl font-bold text-neutral-900 dark:text-white">
                        {def.shortLabel}
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {description}
                      </p>
                    </div>

                    {/* Feature Highlights */}
                    <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-white/5 space-y-2">
                      {highlights.map((item) => (
                        <div key={item} className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                          <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Launch Button */}
                  <button
                    type="button"
                    onClick={() => handleLaunchRole(role)}
                    className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-blue-600 dark:hover:bg-blue-600 dark:hover:text-white py-2.5 text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <span>Launch {def.shortLabel}</span>
                    <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              );
            })}

            {/* Custom Administration / Proctor Card */}
            <div className="group relative rounded-[28px] border border-dashed border-neutral-300 dark:border-white/15 p-6 bg-white/40 dark:bg-white/[0.02] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
                  <ShieldAlert size={22} className="text-[#ff602e]" />
                </div>
                <div className="mt-5">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-neutral-400 dark:text-neutral-500">
                    Proctorial Board & HOD
                  </span>
                  <h3 className="mt-1 text-xl font-bold text-neutral-900 dark:text-white">
                    Dean & Proctorial Console
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Exclusive command views for Academic Deans, Department Heads, and the Chief Proctorial Board for disciplinary oversight and emergency broadcasts.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl border border-neutral-300 dark:border-white/15 text-neutral-900 dark:text-white hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-900 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer"
              >
                <span>Institutional Portal Access</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Campus Quick Directory & Landmark Finder */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 py-16 bg-neutral-100/60 dark:bg-[#08090a]/60 border-y border-neutral-200/80 dark:border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
                Campus Directory & Landmark Finder
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                Instantly jump to verified nodes with live indoor coordinates.
              </p>
            </div>

            {/* Directory Tabs */}
            <div className="flex items-center gap-2 bg-white dark:bg-white/5 p-1 rounded-xl border border-neutral-200 dark:border-white/10 shadow-xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setSelectedDirectoryTab('academic')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedDirectoryTab === 'academic'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Academic Wings
              </button>
              <button
                type="button"
                onClick={() => setSelectedDirectoryTab('facilities')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedDirectoryTab === 'facilities'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Key Facilities
              </button>
              <button
                type="button"
                onClick={() => setSelectedDirectoryTab('services')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedDirectoryTab === 'services'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Admin & Emergency
              </button>
            </div>
          </div>

          {/* Directory Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {campusDirectory[selectedDirectoryTab].map((item) => (
              <Link
                key={item.name}
                to={`/map?dest=${encodeURIComponent(item.query)}&map=${item.map}`}
                className="group flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#0e0f10] border border-neutral-200/80 dark:border-white/10 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.desc}</p>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Institutional Mission & About Section */}
      <About />

      {/* Emergency Action Banner */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-950 to-blue-950 text-white p-8 sm:p-12 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff602e]/10 blur-[100px] pointer-events-none" />
          <div className="max-w-xl z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold mb-4">
              <Radio size={14} className="animate-pulse" />
              <span>Campus Security Hotline: +91 751 240 9300</span>
            </div>
            <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Instant Help, Anytime, Anywhere on Campus
            </h3>
            <p className="mt-3 text-sm text-neutral-400 leading-relaxed">
              In any emergency, tap the SOS button on your student portal. Your exact room and floor coordinates are instantly transmitted to active security patrols.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto z-10">
            <Link to="/student" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm transition-all shadow-lg shadow-red-600/30 cursor-pointer">
                <Radio size={16} />
                <span>Open Emergency SOS</span>
              </button>
            </Link>
            <Link to="/map" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-sm transition-all cursor-pointer">
                <Compass size={16} />
                <span>View Campus Grid</span>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
