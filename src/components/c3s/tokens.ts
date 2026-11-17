/**
 * src/components/c3s/tokens.ts
 *
 * Shared design tokens for the C3S dashboard surfaces.
 *
 * The dashboards previously used four different dark background hexes
 * (`#090D16`, `#070B14`, `#0E1424`, `#0B1020`) and three competing dark-mode
 * conventions, which made the shell feel like several products stitched
 * together. Everything now resolves through the tokens below.
 */

export type Tone = 'neutral' | 'info' | 'primary' | 'success' | 'warning' | 'danger';

export const SURFACE = {
  /** Application shell background (dark). */
  shell: 'bg-slate-50 dark:bg-[#070B14]',
  /** Raised card surface (dark). */
  card: 'bg-white dark:bg-[#0D1322]',
  /** Recessed / secondary surface (dark). */
  inset: 'bg-slate-50 dark:bg-white/[0.03]',
  /** Dropdown & modal surface (dark). */
  overlay: 'bg-white dark:bg-[#111A2E]',
  /** Hairline border. */
  border: 'border-slate-200 dark:border-white/[0.08]',
} as const;

export const TONE_TEXT: Record<Tone, string> = {
  neutral: 'text-slate-700 dark:text-slate-300',
  info: 'text-sky-600 dark:text-sky-300',
  primary: 'text-blue-600 dark:text-blue-400',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-rose-600 dark:text-rose-400',
};

export const TONE_ICON: Record<Tone, string> = {
  neutral: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.06] border-slate-200 dark:border-white/10',
  info: 'text-sky-600 dark:text-sky-300 bg-sky-500/10 border-sky-500/25',
  primary: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/25',
  success: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  warning: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25',
  danger: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/25',
};

export const TONE_BADGE: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-300/80 dark:bg-slate-800/90 dark:text-slate-300 dark:border-slate-700/80',
  info: 'bg-sky-50 text-sky-700 border-sky-300/80 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
  primary: 'bg-blue-50 text-blue-700 border-blue-300/80 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-300/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  warning: 'bg-amber-50 text-amber-700 border-amber-300/80 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  danger: 'bg-rose-50 text-rose-700 border-rose-300/80 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40',
};

export const TONE_DOT: Record<Tone, string> = {
  neutral: 'bg-slate-400',
  info: 'bg-sky-500',
  primary: 'bg-blue-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
};

/** Card surface used by every dashboard panel. */
export const CARD_SURFACE =
  'rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0D1322]/85 backdrop-blur-xl shadow-sm dark:shadow-md transition-colors';

/** Section spacing used across every dashboard page. */
export const PAGE_STACK = 'space-y-5 sm:space-y-6';

const SUCCESS_TOKENS = [
  'ACTIVE',
  'ONLINE',
  'INSIDE',
  'VERIFIED',
  'RESOLVED',
  'ARRIVED',
  'OPERATIONAL',
  'COMPLETED',
  'CONFIRMED',
  'HEALTHY',
];

const DANGER_TOKENS = [
  'CRITICAL',
  'ALERT SENT',
  'FLAGGED',
  'OFFLINE',
  'EMERGENCY',
  'FIGHT DETECTED',
  'FALSE POSITIVE',
  'LOCKED',
];

const WARNING_TOKENS = [
  'EN ROUTE',
  'ACKNOWLEDGED',
  'INVESTIGATING',
  'HIGH',
  'WARNING',
  'RESTRICTED',
  'STANDBY',
  'PENDING',
  'SUSPICIOUS',
];

const INFO_TOKENS = ['ON_DUTY', 'OUTSIDE', 'MEDIUM', 'INFO', 'CHECK-IN', 'CHECK-OUT'];

/**
 * Legacy status-string inference, kept so that existing call sites keep
 * working. New code should pass an explicit `tone`.
 */
export function inferStatusTone(status: string): Tone {
  const norm = (status || '').toUpperCase();
  if (SUCCESS_TOKENS.includes(norm)) return 'success';
  if (DANGER_TOKENS.includes(norm)) return 'danger';
  if (WARNING_TOKENS.includes(norm)) return 'warning';
  if (INFO_TOKENS.includes(norm)) return 'info';
  return 'neutral';
}
