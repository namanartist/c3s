/**
 * src/config/safetyThresholds.ts
 *
 * Single source of truth for the aggression-detection operating point.
 *
 * The threshold used to be duplicated in four places with four different
 * values: the Python service used 0.82, the TypeScript classifier used 65,
 * the alert dispatcher used 65 and the incident banner hard-coded "Kaggle
 * RWF-2000 AI". Nothing checked that they agreed.
 *
 * Every consumer now imports from here, and the Python service reads the same
 * values from `ai_surveillance/config/settings.py` (the environment variables
 * documented below are the bridge between the two runtimes).
 */

export const SAFETY_THRESHOLDS = {
  /** A single frame above this is treated as an *alert* (not a dispatch). */
  ALERT_CONFIDENCE: 0.65,
  /** A sustained detection at or above this raises an emergency SOS. */
  SOS_CONFIDENCE: 0.75,
  /** The alert latches on and only releases below this value. */
  ALERT_RELEASE: 0.50,
  /** Below this the camera is considered clear and may re-arm. */
  SOS_RELEASE: 0.55,
  /** Minimum number of consecutive qualifying frames before a dispatch. */
  CONFIRMATION_FRAMES: 3,
  /** Minimum sustained duration (ms) before a dispatch. */
  CONFIRMATION_MS: 600,
  /** Per-camera cooldown between two dispatches (ms). */
  DEBOUNCE_MS: 30_000,
  /** A camera must have been released before it may open a new incident. */
  REARM_MS: 120_000,
  /** Client-side leaky streak: evidence gained / lost per frame. */
  STREAK_GAIN: 2,
  STREAK_DECAY: 1,
  STREAK_MAX: 10,
  /** Exponential smoothing memory factor (0..1). */
  SCORE_SMOOTHING: 0.75,
} as const;

/** Threat tiers derived from a calibrated confidence score. */
export type ThreatTier = 'NORMAL' | 'SUSPICIOUS' | 'ELEVATED' | 'CRITICAL';

export function resolveThreatTier(confidence: number): ThreatTier {
  if (confidence >= 80) return 'CRITICAL';
  if (confidence >= SAFETY_THRESHOLDS.ALERT_CONFIDENCE * 100) return 'ELEVATED';
  if (confidence >= 35) return 'SUSPICIOUS';
  return 'NORMAL';
}

/**
 * Environment variable names that keep the Python service and this
 * configuration in step. They are listed here so that a deployment can be
 * audited in one place.
 */
export const SAFETY_THRESHOLD_ENV_KEYS = {
  ALERT_CONFIDENCE: 'SURVEILLANCE_ALERT_THRESHOLD',
  SOS_CONFIDENCE: 'SURVEILLANCE_SOS_THRESHOLD',
  ALERT_RELEASE: 'SURVEILLANCE_ALERT_RELEASE_THRESHOLD',
  SOS_RELEASE: 'SURVEILLANCE_SOS_RELEASE_THRESHOLD',
  CONFIRMATION_FRAMES: 'SURVEILLANCE_CONFIRMATION_FRAMES',
  CONFIRMATION_MS: 'SURVEILLANCE_CONFIRMATION_MS',
  DEBOUNCE_MS: 'SURVEILLANCE_DEBOUNCE_SECONDS',
  REARM_MS: 'SURVEILLANCE_REARM_SECONDS',
  STREAK_GAIN: 'SURVEILLANCE_STREAK_GAIN',
  STREAK_DECAY: 'SURVEILLANCE_STREAK_DECAY',
  SCORE_SMOOTHING: 'SURVEILLANCE_SCORE_SMOOTHING',
} as const;
