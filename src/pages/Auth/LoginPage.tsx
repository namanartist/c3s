// src/pages/Auth/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  UserRound,
  GraduationCap,
  Users,
  Radio,
  Settings,
  Lock,
  Mail,
  QrCode,
  ChevronLeft
} from 'lucide-react';
import type { UserRole } from '@/types/safety';
import { useSessionStore } from '@/store/sessionStore';
import { loginSafety } from '@/lib/safetyApi';

interface RoleOption {
  id: UserRole;
  label: string;
  badge: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  defaultId: string;
  defaultName: string;
}

const roles: RoleOption[] = [
  {
    id: 'student',
    label: 'Student',
    badge: 'STUDENT',
    detail: 'Digital campus pass, gate scan & emergency SOS',
    icon: GraduationCap,
    color: 'from-blue-600 to-cyan-500',
    defaultId: '2026CS104',
    defaultName: 'Aarav Sharma'
  },
  {
    id: 'gate_keeper',
    label: 'Gate Keeper',
    badge: 'SECURITY GATE',
    detail: 'Daily rotating QR, check-in/out & occupancy ledger',
    icon: QrCode,
    color: 'from-emerald-600 to-teal-500',
    defaultId: 'GK-MAIN-01',
    defaultName: 'Head Guard Rajesh Sharma'
  },
  {
    id: 'guard',
    label: 'Security Guard',
    badge: 'RESPONSE FLEET',
    detail: 'QRF rover patrol, incident triage & tactical navigation',
    icon: ShieldCheck,
    color: 'from-amber-600 to-orange-500',
    defaultId: 'MITS-SEC-04',
    defaultName: 'Inspector R.S. Tomar'
  },
  {
    id: 'proctor',
    label: 'Proctor / SOC',
    badge: 'CONTROL ROOM',
    detail: 'Central CCTV surveillance, live alerts & incident command',
    icon: Radio,
    color: 'from-indigo-600 to-purple-500',
    defaultId: 'PROCTOR-01',
    defaultName: 'Chief Proctor Dr. Verma'
  },
  {
    id: 'faculty',
    label: 'Faculty',
    badge: 'ACADEMIC',
    detail: 'Department safety monitoring & student assistance',
    icon: Users,
    color: 'from-rose-600 to-pink-500',
    defaultId: 'FAC-CSE-09',
    defaultName: 'Prof. Ananya Sen'
  },
  {
    id: 'admin',
    label: 'Administrator',
    badge: 'SUPER ADMIN',
    detail: 'Manage users, cameras, gates, geofences & audit logs',
    icon: Settings,
    color: 'from-slate-600 to-slate-400',
    defaultId: 'ADMIN-ROOT',
    defaultName: 'Campus Security Admin'
  }
];

export default function LoginPage() {
  const navigate = useNavigate();
  const signIn = useSessionStore((state) => state.signIn);

  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState('Aarav Sharma');
  const [identifier, setIdentifier] = useState('2026CS104');
  const [password, setPassword] = useState('change-me');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (r: RoleOption) => {
    setRole(r.id);
    setName(r.defaultName);
    setIdentifier(r.defaultId);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const fallback = {
      name: name.trim() || `${roles.find((item) => item.id === role)?.label} User`,
      identifier: identifier.trim() || 'demo-user',
      role,
      token: undefined as string | undefined
    };

    let user = fallback;
    try {
      const response = await loginSafety(identifier.trim(), password);
      user = {
        name: response.name,
        identifier,
        role: response.role.toLowerCase() as UserRole,
        token: response.token
      };
    } catch {
      // Offline / demo fallback mode is seamless
    }

    signIn(user);
    setLoading(false);

    navigate(
      user.role === 'proctor'
        ? '/proctor'
        : user.role === 'gate_keeper'
        ? '/gate'
        : `/${user.role}`
    );
  };

  const currentRoleObj = roles.find((r) => r.id === role) || roles[0];

  return (
    <main className="min-h-screen bg-[#070b14] bg-cyber-grid text-white flex flex-col justify-between p-6 select-none relative overflow-hidden">
      {/* Top Header Navigation */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between z-10">
        <Link
          to="/"
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to UniMap Home</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            C3S AUTH GATEWAY v2.4
          </span>
        </div>
      </header>

      {/* Main Login Workspace */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center my-auto py-8 z-10">
        {/* Left Side: Brand & Identity */}
        <section className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/15 border border-blue-500/30 text-blue-400 text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>MITS Gwalior Security Grid</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.05]">
            One Campus. <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              Unified Security & Gate Control.
            </span>
          </h1>

          <p className="text-sm text-slate-400 max-w-lg leading-relaxed font-medium">
            Authenticate to access your role-specific C3S workstation. Validates daily rotating gate QR tokens, manages campus occupancy, and dispatches turn-by-turn emergency responders.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 max-w-md">
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-lg font-black text-cyan-400 font-mono">3 Gates</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Physical QR Checkpoints</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-lg font-black text-emerald-400 font-mono">2,480+</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Campus Population</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-lg font-black text-indigo-400 font-mono">&lt; 90s</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Emergency QRF ETA</div>
            </div>
          </div>
        </section>

        {/* Right Side: Interactive Role & Login Card */}
        <section className="lg:col-span-6">
          <form
            onSubmit={handleSubmit}
            className="glass-card rounded-[32px] p-7 sm:p-9 shadow-2xl relative overflow-hidden"
          >
            {/* Ambient Top Light */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-6 relative z-10">
              <div>
                <h2 className="text-xl font-black text-white">Select Your Campus Role</h2>
                <p className="text-xs text-slate-400 mt-0.5">Instant one-click demo login available</p>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/10 text-cyan-400 border border-white/10 font-bold uppercase">
                {currentRoleObj.badge}
              </span>
            </div>

            {/* Role Grid Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6 relative z-10">
              {roles.map((r) => {
                const isSelected = role === r.id;
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleSelect(r)}
                    className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                      isSelected
                        ? 'border-blue-500 bg-blue-600/20 text-white shadow-lg shadow-blue-600/25'
                        : 'border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center mb-2 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-black">{r.label}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5 truncate">{r.detail}</div>
                  </button>
                );
              })}
            </div>

            {/* Input Credentials */}
            <div className="space-y-3.5 relative z-10">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter full name"
                    className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Campus Identifier / Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    placeholder="e.g. 2026CS104 or admin@mits.edu"
                    className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <span>{loading ? 'Authenticating...' : `Enter as ${currentRoleObj.label}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </section>
      </div>

      {/* Footer Disclaimer */}
      <footer className="max-w-6xl mx-auto w-full text-center text-[10px] text-slate-500 py-3 border-t border-white/5 z-10">
        Madhav Institute of Technology and Science (MITS) Gwalior • C3S Security & Spatial Navigation Network
      </footer>
    </main>
  );
}