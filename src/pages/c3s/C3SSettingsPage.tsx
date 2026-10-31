// src/pages/c3s/C3SSettingsPage.tsx
import React, { useState } from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { useC3SStore } from '@/store/c3sStore';
import { LogoutConfirmModal } from '@/components/c3s/LogoutConfirmModal';
import {
  RotateCcw,
  Shield,
  Moon,
  Sun,
  Smartphone,
  Bell,
  Check,
  Volume2,
  Lock,
  Radio,
  Sliders,
  MapPin,
  Compass,
  FileDown,
  Trash2,
  LogOut,
  Sparkles,
  Accessibility
} from 'lucide-react';

type SettingsTab = 'appearance' | 'security' | 'notifications' | 'navigation' | 'data';

export default function C3SSettingsPage() {
  const { settings, updateSettings, resetAllDemoData, movementLogs, incidents } = useC3SStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const triggerToast = () => {
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  const handleExportAuditLogs = () => {
    const data = {
      exportTimestamp: new Date().toISOString(),
      movementLogs,
      incidents,
      terminalVersion: 'C3S-V2.4'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `c3s-audit-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast();
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="h-6 w-6 text-blue-500" />
              <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                C3S SETTINGS &amp; PREFERENCES
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure telemetry thresholds, UI preferences, access permissions, and session controls.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {showSavedToast && (
              <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-400 border border-emerald-500/30 animate-in fade-in">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 transition-all cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.03] p-1.5 scrollbar-none">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'appearance'
                ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Appearance &amp; UX</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Security &amp; Terminal</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bell className="h-3.5 w-3.5" />
            <span>Emergency &amp; Alerts</span>
          </button>

          <button
            onClick={() => setActiveTab('navigation')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'navigation'
                ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Navigation &amp; Maps</span>
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'data'
                ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Data &amp; Prototype</span>
          </button>
        </div>

        {/* Tab 1: Appearance & UX */}
        {activeTab === 'appearance' && (
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1020] p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Appearance &amp; Display</h2>
              <p className="text-xs text-slate-400">Control visual theme, color palette and sound effects.</p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {/* Theme Mode */}
              <div className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Theme Mode</p>
                  <p className="text-[11px] text-slate-400">Command Center Dark (High contrast for SOC and field operations)</p>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.04] p-1">
                  <button
                    onClick={() => {
                      document.documentElement.classList.add('dark');
                      updateSettings({ theme: 'dark' });
                      triggerToast();
                    }}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                      settings.theme === 'dark' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Moon className="h-3.5 w-3.5" /> Dark
                  </button>
                  <button
                    onClick={() => {
                      document.documentElement.classList.remove('dark');
                      updateSettings({ theme: 'light' });
                      triggerToast();
                    }}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                      settings.theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Sun className="h-3.5 w-3.5" /> Light
                  </button>
                </div>
              </div>

              {/* Accent Palette */}
              <div className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Tactical Accent Color</p>
                  <p className="text-[11px] text-slate-400">Highlight accents for radar markers and UI highlights</p>
                </div>
                <div className="flex items-center gap-2">
                  {[
                    { key: 'blue', color: 'bg-blue-500' },
                    { key: 'emerald', color: 'bg-emerald-500' },
                    { key: 'amber', color: 'bg-amber-500' },
                    { key: 'rose', color: 'bg-rose-500' },
                    { key: 'indigo', color: 'bg-indigo-500' }
                  ].map((p) => (
                    <button
                      key={p.key}
                      onClick={() => {
                        updateSettings({ accentColor: p.key as any });
                        triggerToast();
                      }}
                      className={`h-6 w-6 rounded-full ${p.color} ring-offset-2 ring-offset-slate-950 transition-all ${
                        settings.accentColor === p.key ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Sound Effects */}
              <div className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Audio Chimes &amp; Haptics</p>
                  <p className="text-[11px] text-slate-400">Play confirmation tone on gate scan and incident updates</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    updateSettings({ soundEffects: !settings.soundEffects });
                    triggerToast();
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    settings.soundEffects ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.soundEffects ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Reduced Motion */}
              <div className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Reduced Motion Mode</p>
                  <p className="text-[11px] text-slate-400">Disable smooth map camera panning and animated radar rings</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    updateSettings({ reducedMotion: !settings.reducedMotion });
                    triggerToast();
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    settings.reducedMotion ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Security & Terminal */}
        {activeTab === 'security' && (
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1020] p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Security &amp; Hardware Access</h2>
              <p className="text-xs text-slate-400">Manage NFC pass emulation, biometric unlock, and terminal auto-lock.</p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {/* Biometric Quick-Pass */}
              <div className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Biometric Quick-Pass (WebAuthn)</p>
                  <p className="text-[11px] text-slate-400">Allow instant fingerprint/FaceID gate clearance without passcode</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    updateSettings({ biometricPass: !settings.biometricPass });
                    triggerToast();
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    settings.biometricPass ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.biometricPass ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Session Auto-Lock */}
              <div className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Session Inactivity Auto-Lock</p>
                  <p className="text-[11px] text-slate-400">Automatically require re-login after period of inactivity</p>
                </div>
                <select
                  value={settings.autoLockMinutes}
                  onChange={(e) => {
                    updateSettings({ autoLockMinutes: parseInt(e.target.value, 10) });
                    triggerToast();
                  }}
                  className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value={5}>5 Minutes</option>
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={0}>Never (Demo Mode)</option>
                </select>
              </div>

              {/* High-Precision GPS Simulation */}
              <div className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">High-Precision GPS Boundary Simulation</p>
                  <p className="text-[11px] text-slate-400">Simulate ±8m satellite geofence inside MITS Gwalior boundaries</p>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
                  ACTIVE (±8m)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Emergency & Alerts */}
        {activeTab === 'notifications' && (
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1020] p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Emergency SOS &amp; Broadcast Dispatch</h2>
              <p className="text-xs text-slate-400">Configure channels notified during distress events or intrusions.</p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {/* Push Notifications */}
              <div className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Instant Push Notifications</p>
                  <p className="text-[11px] text-slate-400">Receive immediate desktop / mobile alerts for high-priority incidents</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    updateSettings({ pushNotifications: !settings.pushNotifications });
                    triggerToast();
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    settings.pushNotifications ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* SMS Emergency Broadcast */}
              <div className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Emergency SMS Guardian Alert</p>
                  <p className="text-[11px] text-slate-400">Auto-dispatch SMS to {settings.emergencyContactPhone} on SOS trigger</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    updateSettings({ smsEmergencyBroadcast: !settings.smsEmergencyBroadcast });
                    triggerToast();
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    settings.smsEmergencyBroadcast ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.smsEmergencyBroadcast ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Alarm Siren Volume */}
              <div className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Command Center Siren Alert Volume</p>
                  <span className="font-mono text-xs font-bold text-blue-500">{settings.audioAlarmVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.audioAlarmVolume}
                  onChange={(e) => updateSettings({ audioAlarmVolume: parseInt(e.target.value, 10) })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Navigation & Maps */}
        {activeTab === 'navigation' && (
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1020] p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Navigation Engine &amp; Dijkstra Settings</h2>
              <p className="text-xs text-slate-400">Routing preferences, accessible pathways, and floor transitions.</p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {/* Accessible / Step-Free Routing */}
              <div className="py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Accessibility className="h-4 w-4 text-blue-500" />
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Accessible / Step-Free Routing</p>
                  </div>
                  <p className="text-[11px] text-slate-400">Strictly filter out staircases; prioritize elevators and ground ramps</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    updateSettings({ accessibleRouting: !settings.accessibleRouting });
                    triggerToast();
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    settings.accessibleRouting ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.accessibleRouting ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Automatic Floor Switching */}
              <div className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Auto Floor Map Switch</p>
                  <p className="text-[11px] text-slate-400">Automatically swap SVG canvas floor view as you advance route steps</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    updateSettings({ autoFloorSwitch: !settings.autoFloorSwitch });
                    triggerToast();
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    settings.autoFloorSwitch ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.autoFloorSwitch ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Data & Prototype Controls */}
        {activeTab === 'data' && (
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1020] p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Prototype Controls &amp; Data Auditing</h2>
              <p className="text-xs text-slate-400">Reset prototype state, purge browser cache, and export security ledgers.</p>
            </div>

            <div className="space-y-4">
              {/* Export Audit Log */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Export Audit Trail (JSON)</p>
                  <p className="text-[11px] text-slate-400">Download cryptographically verifiable incident logs &amp; gate records</p>
                </div>
                <button
                  onClick={handleExportAuditLogs}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2 text-xs font-bold text-blue-500 transition-all cursor-pointer"
                >
                  <FileDown className="h-4 w-4" />
                  <span>Download Ledger</span>
                </button>
              </div>

              {/* Reset All Demo Data */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
                <div>
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400">Reset Demo Environment</p>
                  <p className="text-[11px] text-slate-400">Clears localStorage state and resets all simulated incidents, gates &amp; radar</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to reset all simulated demo data to default?')) {
                      resetAllDemoData();
                      triggerToast();
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/30 hover:bg-rose-500 transition-all cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset All Data</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Logout Confirmation Modal */}
        <LogoutConfirmModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} />
      </div>
    </AppShell>
  );
}
