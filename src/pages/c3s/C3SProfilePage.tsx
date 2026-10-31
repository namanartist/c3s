// src/pages/c3s/C3SProfilePage.tsx
import React, { useState } from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { useC3SStore } from '@/store/c3sStore';
import { ROLE_LABELS } from '@/lib/mock-data/users';
import { LogoutConfirmModal } from '@/components/c3s/LogoutConfirmModal';
import {
  ShieldCheck,
  Building,
  Mail,
  Phone,
  QrCode,
  CheckCircle2,
  Edit3,
  LogOut,
  Radio,
  Clock,
  Heart,
  MapPin,
  Laptop,
  KeyRound,
  Download,
  Share2,
  X,
  Save,
  Check
} from 'lucide-react';

export default function C3SProfilePage() {
  const { currentUser, currentRole, movementLogs, isInsideCampus, checkedInGate, checkedInAt, updateProfile, settings, updateSettings } = useC3SStore();
  const roleMeta = ROLE_LABELS[currentRole];

  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isNfcActive, setIsNfcActive] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form edit states
  const [formData, setFormData] = useState({
    name: currentUser.name,
    phone: currentUser.phone,
    email: currentUser.email,
    department: currentUser.department,
    bloodGroup: settings.bloodGroup,
    emergencyContactName: settings.emergencyContactName,
    emergencyContactPhone: settings.emergencyContactPhone,
    emergencyContactRelation: settings.emergencyContactRelation,
    dormitoryAddress: settings.dormitoryAddress
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      department: formData.department
    });

    updateSettings({
      bloodGroup: formData.bloodGroup,
      emergencyContactName: formData.emergencyContactName,
      emergencyContactPhone: formData.emergencyContactPhone,
      emergencyContactRelation: formData.emergencyContactRelation,
      dormitoryAddress: formData.dormitoryAddress
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditing(false);
    }, 800);
  };

  const handleSimulateNfc = () => {
    setIsNfcActive(true);
    setTimeout(() => setIsNfcActive(false), 2500);
  };

  // User's recent movement history
  const userLogs = movementLogs
    .filter((log) => log.personName === currentUser.name || log.universityId === currentUser.universityId)
    .slice(0, 4);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
              <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                DIGITAL CAMPUS IDENTITY
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Smart NFC credential, institutional access card &amp; security clearance telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-sm"
            >
              <Edit3 className="h-3.5 w-3.5 text-blue-500" />
              <span>Edit Details</span>
            </button>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 transition-all cursor-pointer shadow-sm"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Smart Card Display (Holographic Card) */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-blue-500/40 bg-gradient-to-br from-slate-950 via-[#0B1226] to-[#060A17] p-6 sm:p-8 text-white shadow-2xl">
          {/* Card Holographic Ambient Refraction */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

          {/* Card Top Brand */}
          <div className="relative z-10 flex items-start justify-between border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white p-1 shadow-md">
                <img src="/c3s_logo.png" alt="MITS Logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-xs font-black tracking-widest text-blue-400 uppercase">
                  MADHAV INSTITUTE OF TECHNOLOGY &amp; SCIENCE
                </p>
                <p className="text-[10px] tracking-wider text-slate-400 uppercase font-mono">
                  CAMPUS SURVEILLANCE &amp; DEFENSE SYSTEM (C3S)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-3 w-3" /> VERIFIED
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="relative z-10 mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* User Photo & Main Identifiers */}
            <div className="md:col-span-2 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              <div className="relative shrink-0">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="h-28 w-28 rounded-2xl object-cover ring-4 ring-blue-500/50 shadow-xl"
                />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-slate-900">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                </span>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1 rounded-md bg-blue-600/30 px-2 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-500/30">
                  {roleMeta.title}
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">{currentUser.name}</h2>
                <p className="font-mono text-sm font-bold text-blue-400">{currentUser.universityId}</p>
                <p className="text-xs text-slate-300 font-medium">{currentUser.department}</p>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5 text-rose-400" /> Blood: {settings.bloodGroup}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-amber-400" /> {settings.dormitoryAddress}
                  </span>
                </div>
              </div>
            </div>

            {/* Smart QR & NFC Trigger */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
              <div className="relative p-2 rounded-xl bg-white text-slate-900 shadow-inner">
                <QrCode className="h-24 w-24" />
                {isNfcActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-600/90 rounded-xl text-white font-mono text-[10px] font-black animate-pulse">
                    NFC BROADCASTING
                  </div>
                )}
              </div>
              <p className="mt-2 font-mono text-[9px] tracking-wider text-slate-400">C3S-SECURE-TOKEN-2026</p>

              <button
                type="button"
                onClick={handleSimulateNfc}
                className="mt-3 flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-[11px] font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 active:scale-95 transition-all cursor-pointer"
              >
                <Radio className={`h-3.5 w-3.5 ${isNfcActive ? 'animate-spin' : ''}`} />
                <span>{isNfcActive ? 'Transmitting Beacon...' : 'Simulate NFC Tap'}</span>
              </button>
            </div>
          </div>

          {/* Card Footer Metadata */}
          <div className="relative z-10 mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/10 pt-4 text-xs text-slate-300">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Contact</p>
              <p className="font-medium text-white truncate">{currentUser.phone}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Email</p>
              <p className="font-medium text-white truncate">{currentUser.email}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Current Presence</p>
              <p className={`font-bold ${isInsideCampus ? 'text-emerald-400' : 'text-slate-400'}`}>
                {isInsideCampus ? `Inside (${checkedInGate})` : 'Outside Campus'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Validity Period</p>
              <p className="font-medium text-blue-300">2026 – 2028 Academic</p>
            </div>
          </div>
        </div>

        {/* Two-Column Information Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Emergency Contact & Security Clearance */}
          <div className="space-y-6 lg:col-span-1">
            {/* Guardian & SOS Contact */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1020] p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-rose-500" /> Emergency Contact
                </span>
                <span className="text-[10px] font-bold text-blue-500 cursor-pointer hover:underline" onClick={() => setIsEditing(true)}>
                  Edit
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400">Guardian Name</p>
                  <p className="font-bold text-slate-900 dark:text-white">{settings.emergencyContactName}</p>
                  <p className="text-[11px] text-slate-500">({settings.emergencyContactRelation})</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Guardian Phone</p>
                  <p className="font-mono font-bold text-slate-900 dark:text-white">{settings.emergencyContactPhone}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Campus Residence</p>
                  <p className="font-medium text-slate-900 dark:text-white">{settings.dormitoryAddress}</p>
                </div>
              </div>
            </div>

            {/* Clearance & Zone Permissions */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1020] p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" /> Zone Clearance
                </span>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">ACTIVE</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-white/[0.04]">
                  <span className="text-slate-600 dark:text-slate-300">All Campus Gates</span>
                  <span className="font-bold text-emerald-500">GRANTED</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-white/[0.04]">
                  <span className="text-slate-600 dark:text-slate-300">CSE Department Labs</span>
                  <span className="font-bold text-emerald-500">GRANTED</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-white/[0.04]">
                  <span className="text-slate-600 dark:text-slate-300">Central Library Hub</span>
                  <span className="font-bold text-emerald-500">GRANTED</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-300">SOC Control Center</span>
                  <span className={`font-bold ${currentRole === 'SUPER_ADMIN' || currentRole === 'CONTROL_ROOM_OPERATOR' ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {currentRole === 'SUPER_ADMIN' || currentRole === 'CONTROL_ROOM_OPERATOR' ? 'GRANTED' : 'RESTRICTED'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Movement History & Session Info */}
          <div className="space-y-6 lg:col-span-2">
            {/* Recent Gate History */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1020] p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-blue-500" /> Recent Gate Movement
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Live Ledger</span>
              </div>

              {userLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No recorded check-in events in current session.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                  {userLogs.map((log) => (
                    <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                            log.movement === 'CHECK-IN'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}
                        >
                          {log.movement}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{log.gate}</p>
                          <p className="text-[10px] text-slate-400">{log.verificationMethod} • {log.date}</p>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">{log.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Terminal Security & Active Session */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1020] p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                  <Laptop className="h-4 w-4 text-purple-500" /> Active Terminal Session
                </span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  ENCRYPTED TLS 1.3
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl border border-slate-100 dark:border-white/[0.05] bg-slate-50 dark:bg-white/[0.02] p-3">
                  <p className="text-[10px] text-slate-400">Assigned Client IP / Host</p>
                  <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">172.16.20.104 (MITS-WIFI-SEC)</p>
                  <p className="text-[10px] text-slate-500 mt-1">Terminal Node #04 (Web Client)</p>
                </div>
                <div className="rounded-xl border border-slate-100 dark:border-white/[0.05] bg-slate-50 dark:bg-white/[0.02] p-3">
                  <p className="text-[10px] text-slate-400">Session Token Validity</p>
                  <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">JWT-HS256 (Expires 8 hrs)</p>
                  <p className="text-[10px] text-emerald-500 mt-1">Status: Active &amp; Synchronized</p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <p className="text-[11px] text-slate-500">Need to switch operator or log off this device?</p>
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(true)}
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-500 transition-colors cursor-pointer"
                >
                  End Active Session
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1020] p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-blue-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Profile &amp; Contact Details</h3>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] p-2.5 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] p-2.5 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] p-2.5 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] p-2.5 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-white/10 pt-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400 mb-2">Emergency Information</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Guardian Name</label>
                      <input
                        type="text"
                        value={formData.emergencyContactName}
                        onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] p-2.5 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Guardian Phone</label>
                      <input
                        type="text"
                        value={formData.emergencyContactPhone}
                        onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] p-2.5 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Blood Group</label>
                      <select
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] p-2.5 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                      >
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Campus Residence / Room</label>
                      <input
                        type="text"
                        value={formData.dormitoryAddress}
                        onChange={(e) => setFormData({ ...formData, dormitoryAddress: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] p-2.5 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all"
                  >
                    {saveSuccess ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    <span>{saveSuccess ? 'Changes Saved!' : 'Save Profile'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Logout Confirmation Modal */}
        <LogoutConfirmModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} />
      </div>
    </AppShell>
  );
}
