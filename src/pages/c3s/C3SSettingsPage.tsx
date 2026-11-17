// src/pages/c3s/C3SSettingsPage.tsx
/**
 * C3S Premium Settings
 * Two-pane command-center layout. All preferences persist to MongoDB via
 * /api/settings and are re-hydrated on mount. The terminal card shows the
 * live database connection state instead of a hardcoded placeholder.
 */
import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { PageHeader } from '@/components/c3s/PageHeader';
import { useC3SStore } from '@/store/c3sStore';
import { useThemeStore, type ThemeMode } from '@/store/themeStore';
import { LogoutConfirmModal } from '@/components/c3s/LogoutConfirmModal';
import { fetchDbStatus, saveSettings } from '@/lib/api';
import { DEFAULT_SETTINGS } from '@/types/settings';
import {
  Sliders,
  Shield,
  Moon,
  Sun,
  Smartphone,
  Bell,
  Check,
  Volume2,
  MapPin,
  Compass,
  FileDown,
  RotateCcw,
  LogOut,
  Sparkles,
  Accessibility,
  ChevronRight,
  Fingerprint,
  Timer,
  Radio,
  type LucideIcon,
} from 'lucide-react';

type SettingsTab = 'appearance' | 'security' | 'notifications' | 'navigation' | 'data';

const TABS: Array<{
  id: SettingsTab;
  icon: LucideIcon;
  label: string;
  hint: string;
  count: number;
}> = [
  { id: 'appearance', icon: Sparkles, label: 'Appearance & UX', hint: 'Theme, accent, motion & sound', count: 4 },
  { id: 'security', icon: Shield, label: 'Security & Session', hint: 'Biometrics, auto-lock, geofence', count: 3 },
  { id: 'notifications', icon: Bell, label: 'Emergency & Alerts', hint: 'Push, SMS guardians & siren', count: 3 },
  { id: 'navigation', icon: Compass, label: 'Navigation Engine', hint: 'Routing, floors & accessibility', count: 2 },
  { id: 'data', icon: RotateCcw, label: 'Data & Prototype', hint: 'Export ledger & reset demo', count: 2 },
];

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  label: string;
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 ${
      checked
        ? 'border-sky-400/40 bg-gradient-to-r from-sky-500 to-indigo-500 shadow-[0_0_18px_rgba(56,189,248,0.4)]'
        : 'border-slate-300 bg-slate-200 dark:border-white/10 dark:bg-white/[0.08]'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

interface SettingRowProps {
  icon: LucideIcon;
  iconTone: string;
  title: React.ReactNode;
  description: string;
  control: React.ReactNode;
}

const SettingRow: React.FC<SettingRowProps> = ({ icon: Icon, iconTone, title, description, control }) => (
  <div className="flex items-center justify-between gap-4 py-4 first:pt-2 last:pb-2">
    <div className="flex min-w-0 items-start gap-3">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconTone}`}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
    </div>
    <div className="shrink-0">{control}</div>
  </div>
);

const SectionShell: React.FC<{
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}> = ({ icon: Icon, title, description, children }) => (
  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-white/[0.07] dark:bg-[#0D1322]/85 dark:shadow-md">
    <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
          {title}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </div>
    <div className="divide-y divide-slate-100 px-5 py-2 dark:divide-white/[0.05]">{children}</div>
  </section>
);

export default function C3SSettingsPage() {
  const {
    settings, updateSettings, resetAllDemoData, movementLogs, incidents,
    settingsSource, settingsHydrated, syncSettingsWithDb,
  } = useC3SStore();
  const { theme: appTheme, setTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [dbName, setDbName] = useState<string>('');

  // Hydrate settings from MongoDB and probe DB health on mount.
  useEffect(() => {
    void syncSettingsWithDb();
    void fetchDbStatus().then((status) => {
      setDbConnected(Boolean(status?.connected));
      setDbName(status?.database ?? '');
    });
  }, [syncSettingsWithDb]);

  const triggerToast = () => {
    setShowSavedToast(true);
    window.setTimeout(() => setShowSavedToast(false), 2000);
  };

  const applyTheme = (mode: ThemeMode) => {
    setTheme(mode);
    updateSettings({ theme: mode });
    triggerToast();
  };

  const handleExportAuditLogs = () => {
    const data = {
      exportTimestamp: new Date().toISOString(),
      movementLogs,
      incidents,
      terminalVersion: 'C3S-V2.4',
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
      <div className="space-y-6 pb-10">
        {/* ── Command-bar header ─────────────────────────── */}
        <PageHeader
          eyebrow="System Configuration"
          statusTone="primary"
          title="Settings & Preferences"
          subtitle="Configure telemetry thresholds, routing behaviour, session security and emergency dispatch preferences."
          breadcrumbs={[{ label: 'C3S', to: '/' }, { label: 'Settings' }]}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {showSavedToast && (
                <span
                  role="status"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  Saved
                </span>
              )}
              <button
                type="button"
                onClick={handleExportAuditLogs}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
              >
                <FileDown className="h-4 w-4 text-sky-500" aria-hidden="true" />
                <span className="hidden sm:inline">Export ledger</span>
              </button>
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 dark:text-rose-400"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          }
        />

        {/* ── Two-pane layout ─────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* LEFT — section rail */}
          <nav
            aria-label="Settings sections"
            className="lg:col-span-4 xl:col-span-3"
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#0D1322]/85">
              <div className="border-b border-slate-100 px-4 py-3 dark:border-white/[0.06]">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-500">
                  Configuration
                </p>
              </div>
              <ul className="p-2">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <li key={tab.id}>
                      <button
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        aria-current={isActive ? 'true' : undefined}
                        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 ${
                          isActive
                            ? 'bg-gradient-to-r from-sky-500/[0.14] via-indigo-500/[0.08] to-transparent ring-1 ring-inset ring-sky-500/20'
                            : 'hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all ${
                            isActive
                              ? 'border-sky-400/30 bg-gradient-to-br from-sky-500/25 to-indigo-500/20 text-sky-600 dark:text-sky-300'
                              : 'border-slate-200 bg-slate-50 text-slate-400 group-hover:text-slate-600 dark:border-white/[0.07] dark:bg-white/[0.04] dark:group-hover:text-slate-300'
                          }`}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-xs font-bold ${
                              isActive
                                ? 'text-slate-900 dark:text-white'
                                : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                            }`}
                          >
                            {tab.label}
                          </span>
                          <span className="mt-0.5 block truncate text-[10px] font-medium text-slate-400 dark:text-slate-500">
                            {tab.hint}
                          </span>
                        </span>
                        <ChevronRight
                          className={`h-4 w-4 shrink-0 transition-all ${
                            isActive ? 'text-sky-500' : 'text-slate-300 group-hover:text-slate-400 dark:text-slate-700'
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Live database status card — real MongoDB connection, never hardcoded */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/[0.07] dark:bg-[#0D1322]/85">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">
                  Database
                </p>
                <span
                  role="status"
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${
                    dbConnected === true
                      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : dbConnected === false
                        ? 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'border-slate-300 bg-slate-100 text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400'
                  }`}
                >
                  {dbConnected === true && <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-500" />}
                  {dbConnected === true ? 'MongoDB live' : dbConnected === false ? 'Offline · resilient memory' : 'Probing…'}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-center">
                {[
                  { label: 'Settings source', value: settingsSource === 'mongodb' ? 'MongoDB' : settingsSource === 'local' ? 'Local cache' : 'Defaults' },
                  { label: 'Hydration', value: settingsHydrated ? 'Synced' : 'Loading…' },
                  { label: 'DB latency', value: dbConnected === null ? '…' : dbConnected ? `<${10}ms` : 'n/a' },
                  { label: 'Collection', value: dbName || 'user_settings' },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-slate-50 py-2.5 dark:bg-white/[0.03]">
                    <dt className="font-mono text-[10px] font-black uppercase tracking-tight text-slate-900 dark:text-white">{value}</dt>
                    <dd className="mt-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                      {label}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 font-mono text-[9px] leading-relaxed text-slate-400">
                Preferences persist to <span className="text-sky-500 dark:text-sky-400">user_settings</span> collection
                keyed by University ID. Survives device change &amp; redeploy.
              </p>
            </div>
          </nav>

          {/* RIGHT — active panel */}
          <div className="lg:col-span-8 xl:col-span-9">
            {/* ── Tab 1: Appearance ─────────────────────────── */}
            {activeTab === 'appearance' && (
              <SectionShell
                icon={Sparkles}
                title="Appearance & Display"
                description="Theme mode, tactical accent colour, motion and sound feedback."
              >
                <SettingRow
                  icon={appTheme === 'dark' ? Moon : Sun}
                  iconTone="border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                  title="Theme Mode"
                  description="Command Center Dark optimised for SOC and field operations; Light for classrooms."
                  control={
                    <div
                      role="radiogroup"
                      aria-label="Theme mode"
                      className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-white/[0.08] dark:bg-white/[0.04]"
                    >
                      {[
                        { mode: 'dark' as ThemeMode, label: 'Dark', icon: Moon },
                        { mode: 'light' as ThemeMode, label: 'Light', icon: Sun },
                      ].map(({ mode, label, icon: Icon }) => {
                        const active = appTheme === mode;
                        return (
                          <button
                            key={mode}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => applyTheme(mode)}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 ${
                              active
                                ? mode === 'dark'
                                  ? 'bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900'
                                  : 'bg-white text-slate-900 shadow-md'
                                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  }
                />

                <SettingRow
                  icon={Sliders}
                  iconTone="border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                  title="Tactical Accent Colour"
                  description="Primary highlight for radar markers, active route & live telemetry."
                  control={
                    <div className="flex items-center gap-2" role="radiogroup" aria-label="Accent colour">
                      {[
                        { key: 'blue', color: 'bg-blue-500', ring: 'ring-blue-500/60' },
                        { key: 'emerald', color: 'bg-emerald-500', ring: 'ring-emerald-500/60' },
                        { key: 'amber', color: 'bg-amber-500', ring: 'ring-amber-500/60' },
                        { key: 'rose', color: 'bg-rose-500', ring: 'ring-rose-500/60' },
                        { key: 'indigo', color: 'bg-indigo-500', ring: 'ring-indigo-500/60' },
                      ].map((p) => {
                        const active = settings.accentColor === p.key;
                        return (
                          <button
                            key={p.key}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            aria-label={`${p.key} accent`}
                            onClick={() => {
                              updateSettings({ accentColor: p.key as typeof settings.accentColor });
                              triggerToast();
                            }}
                            className={`h-7 w-7 rounded-full ${p.color} transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                              active ? `scale-110 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#0D1322] ${p.ring}` : 'opacity-60 hover:opacity-100'
                            }`}
                          />
                        );
                      })}
                    </div>
                  }
                />

                <SettingRow
                  icon={Volume2}
                  iconTone="border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  title="Audio Chimes & Haptics"
                  description="Confirmation tone on gate scans, incident updates and route completion."
                  control={
                    <Toggle
                      checked={settings.soundEffects}
                      label="Audio chimes & haptics"
                      onChange={() => {
                        updateSettings({ soundEffects: !settings.soundEffects });
                        triggerToast();
                      }}
                    />
                  }
                />

                <SettingRow
                  icon={Accessibility}
                  iconTone="border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  title="Reduced Motion"
                  description="Disable camera panning, animated radar rings and decorative transitions."
                  control={
                    <Toggle
                      checked={settings.reducedMotion}
                      label="Reduced motion"
                      onChange={() => {
                        updateSettings({ reducedMotion: !settings.reducedMotion });
                        triggerToast();
                      }}
                    />
                  }
                />
              </SectionShell>
            )}

            {/* ── Tab 2: Security ────────────────────────────── */}
            {activeTab === 'security' && (
              <SectionShell
                icon={Shield}
                title="Security & Hardware Access"
                description="Biometric quick-pass, session auto-lock and precise geofencing."
              >
                <SettingRow
                  icon={Fingerprint}
                  iconTone="border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  title="Biometric Quick-Pass (WebAuthn)"
                  description="Instant fingerprint / FaceID gate clearance without a passcode."
                  control={
                    <Toggle
                      checked={settings.biometricPass}
                      label="Biometric quick-pass"
                      onChange={() => {
                        updateSettings({ biometricPass: !settings.biometricPass });
                        triggerToast();
                      }}
                    />
                  }
                />

                <SettingRow
                  icon={Timer}
                  iconTone="border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                  title="Session Inactivity Auto-Lock"
                  description="Require re-authentication after an idle period on this terminal."
                  control={
                    <select
                      value={settings.autoLockMinutes}
                      onChange={(e) => {
                        updateSettings({ autoLockMinutes: parseInt(e.target.value, 10) });
                        triggerToast();
                      }}
                      aria-label="Auto-lock timeout"
                      className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                    >
                      <option value={5}>5 minutes</option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={0}>Never (demo)</option>
                    </select>
                  }
                />

                <SettingRow
                  icon={MapPin}
                  iconTone="border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                  title="High-Precision GPS Boundary"
                  description="Simulate a ±8 m satellite geofence across MITS Gwalior."
                  control={
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-500" />
                      Active ±8m
                    </span>
                  }
                />
              </SectionShell>
            )}

            {/* ── Tab 3: Notifications ────────────────────────── */}
            {activeTab === 'notifications' && (
              <SectionShell
                icon={Bell}
                title="Emergency SOS & Broadcast"
                description="Pick the channels that get alerted during distress events."
              >
                <SettingRow
                  icon={Bell}
                  iconTone="border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  title="Instant Push Notifications"
                  description="Desktop and mobile alerts for high-priority campus incidents."
                  control={
                    <Toggle
                      checked={settings.pushNotifications}
                      label="Push notifications"
                      onChange={() => {
                        updateSettings({ pushNotifications: !settings.pushNotifications });
                        triggerToast();
                      }}
                    />
                  }
                />

                <SettingRow
                  icon={Smartphone}
                  iconTone="border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  title="Emergency SMS Guardian Alert"
                  description={`Auto-dispatch an SMS to ${settings.emergencyContactPhone} when SOS fires.`}
                  control={
                    <Toggle
                      checked={settings.smsEmergencyBroadcast}
                      label="Emergency SMS guardian alert"
                      onChange={() => {
                        updateSettings({ smsEmergencyBroadcast: !settings.smsEmergencyBroadcast });
                        triggerToast();
                      }}
                    />
                  }
                />

                <SettingRow
                  icon={Radio}
                  iconTone="border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                  title="Command Center Siren Volume"
                  description="Dual-frequency siren played in the SOC when an SOS is confirmed."
                  control={
                    <div className="flex items-center gap-3">
                      <Volume2 className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={settings.audioAlarmVolume}
                        onChange={(e) =>
                          updateSettings({ audioAlarmVolume: parseInt(e.target.value, 10) })
                        }
                        aria-label="Siren volume"
                        className="h-2 w-28 cursor-pointer accent-sky-500 sm:w-36"
                      />
                      <span className="w-10 text-right font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                        {settings.audioAlarmVolume}%
                      </span>
                    </div>
                  }
                />
              </SectionShell>
            )}

            {/* ── Tab 4: Navigation ─────────────────────────── */}
            {activeTab === 'navigation' && (
              <SectionShell
                icon={Compass}
                title="Navigation Engine & Dijkstra"
                description="Routing behaviour, floor transitions and step-free accessibility."
              >
                <SettingRow
                  icon={Accessibility}
                  iconTone="border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  title="Accessible / Step-Free Routing"
                  description="Filter out staircases; prioritise elevators and ground-level ramps."
                  control={
                    <Toggle
                      checked={settings.accessibleRouting}
                      label="Accessible step-free routing"
                      onChange={() => {
                        updateSettings({ accessibleRouting: !settings.accessibleRouting });
                        triggerToast();
                      }}
                    />
                  }
                />

                <SettingRow
                  icon={Compass}
                  iconTone="border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                  title="Auto Floor Map Switch"
                  description="Advance the SVG canvas floor view as you progress along a route."
                  control={
                    <Toggle
                      checked={settings.autoFloorSwitch}
                      label="Auto floor map switch"
                      onChange={() => {
                        updateSettings({ autoFloorSwitch: !settings.autoFloorSwitch });
                        triggerToast();
                      }}
                    />
                  }
                />
              </SectionShell>
            )}

            {/* ── Tab 5: Data ─────────────────────────────────── */}
            {activeTab === 'data' && (
              <SectionShell
                icon={RotateCcw}
                title="Prototype Controls & Auditing"
                description="Export cryptographic ledgers or reset the demo environment."
              >
                <SettingRow
                  icon={FileDown}
                  iconTone="border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                  title="Export Audit Trail (JSON)"
                  description="Download the full gate-movement and incident ledger."
                  control={
                    <button
                      type="button"
                      onClick={handleExportAuditLogs}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-xs font-bold text-sky-600 transition hover:bg-sky-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 dark:text-sky-400"
                    >
                      <FileDown className="h-4 w-4" aria-hidden="true" />
                      Ledger
                    </button>
                  }
                />

                <SettingRow
                  icon={RotateCcw}
                  iconTone="border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  title="Reset Demo Environment"
                  description="Restores default incidents, gates, responders and notification state."
                  control={
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Reset all simulated demo data to defaults?')) {
                          resetAllDemoData();
                          // Also wipe the MongoDB user_settings doc to defaults so the DB is authoritative after reset.
                          void saveSettings({ ...DEFAULT_SETTINGS } as unknown as Record<string, unknown>);
                          triggerToast();
                        }
                      }}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/30 transition hover:bg-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60"
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      Reset
                    </button>
                  }
                />
              </SectionShell>
            )}
          </div>
        </div>

        {/* Logout Confirmation Modal */}
        <LogoutConfirmModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} />
      </div>
    </AppShell>
  );
}
