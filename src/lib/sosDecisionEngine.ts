// src/lib/sosDecisionEngine.ts
/**
 * Dedicated SOS Decision Engine for the C3S Campus Surveillance & Safety System.
 * 
 * Formal 3-State Machine:
 * - State 1: NORMAL
 *   Normal human activity (walking, running, turning, gestures, waving, sports, dancing).
 *   No reliable evidence of violent physical aggression.
 *   Action: Continue monitoring. NO SOS. No emergency dispatch.
 * 
 * - State 2: SUSPICIOUS
 *   Possible aggressive interaction or anomalous kinetic signature.
 *   Incomplete temporal evidence or uncertain action recognition (< 2.0s or < 85% confidence).
 *   Action: Continue sequence analysis. Preserve rolling buffer. NO automatic emergency dispatch.
 * 
 * - State 3: CONFIRMED_AGGRESSION
 *   Validated temporal physical altercation sustained for >= 2.0s with confidence >= 85%,
 *   multi-window temporal consistency >= 70%, and verified interpersonal contact/strikes.
 *   Action: Generate unique incident ID, trigger emergency SOS, capture evidence, notify security.
 */

export type SosClassificationState = 'NORMAL' | 'SUSPICIOUS' | 'CONFIRMED_AGGRESSION';

export interface SosDecisionConfig {
  /** Minimum fight probability threshold to qualify for confirmation (default 0.85 / 85%) */
  sosConfidenceThreshold: number;
  /** Minimum continuous duration in milliseconds of sustained aggression (default 2000ms / 2.0s) */
  minContinuousDurationMs: number;
  /** Minimum consecutive consistent temporal windows (default 4) */
  minConsecutiveWindows: number;
  /** Cooldown in milliseconds before a camera can trigger another SOS incident (default 30,000ms / 30s) */
  perCameraCooldownMs: number;
  /** Exit threshold: confidence below this immediately reverts state to NORMAL (hysteresis) */
  exitConfidenceThreshold: number;
  /** Window duration in milliseconds for temporal smoothing (default 200ms) */
  windowTimeStepMs: number;
}

export const DEFAULT_SOS_CONFIG: SosDecisionConfig = {
  sosConfidenceThreshold: 0.85,
  minContinuousDurationMs: 2000,
  minConsecutiveWindows: 4,
  perCameraCooldownMs: 30000,
  exitConfidenceThreshold: 0.35,
  windowTimeStepMs: 200,
};

export interface WindowEvaluationInput {
  cameraId: string;
  timestamp: number; // Monotonic or epoch ms
  rawConfidence: number; // 0.0 to 1.0 (or 0 to 100)
  predictedAction: string;
  personTrackingIds: number[];
  hasInterpersonalContact: boolean;
  hasStrikeKinematics: boolean;
  isCameraMoving?: boolean;
}

export interface SosDecisionOutput {
  state: SosClassificationState;
  shouldTriggerSos: boolean;
  shouldCaptureEvidence: boolean;
  smoothedConfidence: number;
  sustainedDurationMs: number;
  consecutiveWindows: number;
  temporalConsistency: number;
  incidentId: string | null;
  reason: string;
  logRecord: {
    timestamp: string;
    camera_id: string;
    person_tracking_ids: number[];
    predicted_action: string;
    normal_confidence: number;
    aggression_confidence: number;
    temporal_consistency: number;
    decision_state: SosClassificationState;
    sos_decision: 'HOLD' | 'MONITOR' | 'TRIGGER_SOS' | 'COOLDOWN_SUPPRESSED';
    reason: string;
  };
}

interface CameraStateTracker {
  smoothedConfidence: number;
  state: SosClassificationState;
  aggressionStartTime: number | null;
  consecutiveWindows: number;
  windowHistory: boolean[];
  lastWindowTimestamp: number;
  lastSosTriggerTime: number;
  activeIncidentId: string | null;
}

export class SosDecisionEngine {
  private config: SosDecisionConfig;
  private cameraStates: Map<string, CameraStateTracker> = new Map();

  constructor(config: Partial<SosDecisionConfig> = {}) {
    this.config = { ...DEFAULT_SOS_CONFIG, ...config };
  }

  private getOrCreateTracker(cameraId: string): CameraStateTracker {
    let tracker = this.cameraStates.get(cameraId);
    if (!tracker) {
      tracker = {
        smoothedConfidence: 0.0,
        state: 'NORMAL',
        aggressionStartTime: null,
        consecutiveWindows: 0,
        windowHistory: [],
        lastWindowTimestamp: 0,
        lastSosTriggerTime: -Infinity,
        activeIncidentId: null,
      };
      this.cameraStates.set(cameraId, tracker);
    }
    return tracker;
  }

  public resetCamera(cameraId: string): void {
    this.cameraStates.delete(cameraId);
  }

  public resetAll(): void {
    this.cameraStates.clear();
  }

  /**
   * Evaluates an incoming temporal analysis window for a camera.
   * Enforces all multi-stage rules and returns the formal state machine decision.
   */
  public evaluateWindow(input: WindowEvaluationInput): SosDecisionOutput {
    const tracker = this.getOrCreateTracker(input.cameraId);
    const now = input.timestamp || Date.now();

    // Normalize confidence to 0.0 - 1.0 range
    const normConf = input.rawConfidence > 1.0 ? input.rawConfidence / 100.0 : Math.max(0.0, input.rawConfidence);

    // Rule 1: Camera Ego-Motion Rejection
    // If the entire camera scene is panning, tilting, or vibrating, reject as global motion anomaly
    if (input.isCameraMoving) {
      tracker.smoothedConfidence = tracker.smoothedConfidence * 0.70;
      tracker.state = 'NORMAL';
      tracker.consecutiveWindows = 0;
      tracker.aggressionStartTime = null;

      return this.formatOutput(tracker, input, now, false, false, null, 'Global camera movement detected (suppressed)');
    }

    // Rule 2: Single-Person Motion Isolation Gate
    // Physical fighting requires >= 2 interacting people in mutual contact or combat assault.
    // An individual performing arm waving, stretching, walking, running, or standing alone MUST NEVER trigger aggression.
    const isSinglePerson = input.personTrackingIds.length <= 1;
    const isIsolatedMotion = isSinglePerson && !input.hasInterpersonalContact;

    // Rule 3: Exponential Moving Average Temporal Smoothing
    // (alpha = 0.35): smooths out erratic single-frame jumps
    const alpha = 0.35;
    let targetConf = normConf;
    if (isIsolatedMotion) {
      // Strictly clamp isolated human movement to non-violent baseline
      targetConf = Math.min(0.15, normConf * 0.25);
    }

    tracker.smoothedConfidence = tracker.smoothedConfidence * (1.0 - alpha) + targetConf * alpha;
    const smoothed = Math.round(tracker.smoothedConfidence * 1000) / 1000;

    // Temporal Window Gap Check: if dropped frames occurred (> 1000ms gap), reset streak
    if (tracker.lastWindowTimestamp > 0 && now - tracker.lastWindowTimestamp > 1200) {
      tracker.consecutiveWindows = 0;
      tracker.aggressionStartTime = null;
    }
    tracker.lastWindowTimestamp = now;

    // Check if current window exhibits genuine aggressive traits
    const isWindowAggressive =
      smoothed >= this.config.sosConfidenceThreshold &&
      !isIsolatedMotion &&
      (input.hasInterpersonalContact || input.hasStrikeKinematics);

    // Update rolling window history (T=10 windows)
    tracker.windowHistory.push(isWindowAggressive);
    if (tracker.windowHistory.length > 10) {
      tracker.windowHistory.shift();
    }
    const trueCount = tracker.windowHistory.filter(Boolean).length;
    const temporalConsistency = tracker.windowHistory.length > 0 ? trueCount / tracker.windowHistory.length : 0.0;

    // Rule 4: State Machine Transitions
    let shouldTriggerSos = false;
    let shouldCaptureEvidence = false;
    let incidentId: string | null = null;
    let decisionReason = '';

    if (isWindowAggressive) {
      tracker.consecutiveWindows += 1;
      if (tracker.aggressionStartTime === null) {
        tracker.aggressionStartTime = now;
      }

      const sustainedDurationMs = now - tracker.aggressionStartTime;

      // Condition for CONFIRMED_AGGRESSION:
      // 1. Minimum continuous duration >= 2000ms (2.0s)
      // 2. Minimum consecutive windows >= config.minConsecutiveWindows (4)
      // 3. Temporal consistency in sliding window >= 0.70
      // 4. Smoothed confidence >= 0.85
      if (
        sustainedDurationMs >= this.config.minContinuousDurationMs &&
        tracker.consecutiveWindows >= this.config.minConsecutiveWindows &&
        temporalConsistency >= 0.70 &&
        smoothed >= this.config.sosConfidenceThreshold
      ) {
        tracker.state = 'CONFIRMED_AGGRESSION';

        // Check per-camera debounce cooldown (30 seconds)
        const timeSinceLastSos = now - tracker.lastSosTriggerTime;
        if (timeSinceLastSos >= this.config.perCameraCooldownMs) {
          tracker.lastSosTriggerTime = now;
          incidentId = `INC_${input.cameraId}_${now}`;
          tracker.activeIncidentId = incidentId;
          shouldTriggerSos = true;
          shouldCaptureEvidence = true;
          decisionReason = `Confirmed physical aggression sustained for ${(sustainedDurationMs / 1000).toFixed(1)}s (conf: ${(smoothed * 100).toFixed(0)}%, windows: ${tracker.consecutiveWindows})`;
        } else {
          decisionReason = `Confirmed physical aggression active; SOS alert suppressed by 30s cooldown (${Math.round((this.config.perCameraCooldownMs - timeSinceLastSos) / 1000)}s remaining)`;
        }
      } else {
        // Elevated activity observed but duration/consistency requirements not yet met
        tracker.state = 'SUSPICIOUS';
        decisionReason = `Suspicious altercation observed; awaiting temporal verification (${(sustainedDurationMs / 1000).toFixed(1)}s / ${(this.config.minContinuousDurationMs / 1000).toFixed(1)}s, windows: ${tracker.consecutiveWindows})`;
      }
    } else {
      // Hysteresis exit: if confidence drops below exit threshold, smoothly revert
      if (smoothed < this.config.exitConfidenceThreshold) {
        tracker.state = 'NORMAL';
        tracker.consecutiveWindows = 0;
        tracker.aggressionStartTime = null;
        tracker.activeIncidentId = null;
        decisionReason = 'Normal pedestrian activity; no aggression detected';
      } else if (tracker.state === 'CONFIRMED_AGGRESSION') {
        // Decay to SUSPICIOUS if confidence momentarily dips
        tracker.state = 'SUSPICIOUS';
        decisionReason = 'Aggression waning; monitoring altercation cooldown';
      } else {
        tracker.state = 'NORMAL';
        tracker.consecutiveWindows = Math.max(0, tracker.consecutiveWindows - 1);
        if (tracker.consecutiveWindows === 0) {
          tracker.aggressionStartTime = null;
        }
        decisionReason = 'Activity within normal parameters';
      }
    }

    return this.formatOutput(tracker, input, now, shouldTriggerSos, shouldCaptureEvidence, incidentId, decisionReason);
  }

  private formatOutput(
    tracker: CameraStateTracker,
    input: WindowEvaluationInput,
    now: number,
    shouldTriggerSos: boolean,
    shouldCaptureEvidence: boolean,
    incidentId: string | null,
    reason: string
  ): SosDecisionOutput {
    const sustainedDurationMs = tracker.aggressionStartTime ? Math.max(0, now - tracker.aggressionStartTime) : 0;
    const trueCount = tracker.windowHistory.filter(Boolean).length;
    const temporalConsistency = tracker.windowHistory.length > 0 ? Math.round((trueCount / tracker.windowHistory.length) * 100) / 100 : 0.0;

    const normalConf = Math.round(Math.max(0.0, 1.0 - tracker.smoothedConfidence) * 100);
    const aggConf = Math.round(tracker.smoothedConfidence * 100);

    let sosAction: 'HOLD' | 'MONITOR' | 'TRIGGER_SOS' | 'COOLDOWN_SUPPRESSED' = 'MONITOR';
    if (shouldTriggerSos) {
      sosAction = 'TRIGGER_SOS';
    } else if (tracker.state === 'CONFIRMED_AGGRESSION') {
      sosAction = 'COOLDOWN_SUPPRESSED';
    } else if (tracker.state === 'SUSPICIOUS') {
      sosAction = 'HOLD';
    }

    return {
      state: tracker.state,
      shouldTriggerSos,
      shouldCaptureEvidence,
      smoothedConfidence: tracker.smoothedConfidence,
      sustainedDurationMs,
      consecutiveWindows: tracker.consecutiveWindows,
      temporalConsistency,
      incidentId,
      reason,
      logRecord: {
        timestamp: new Date(now).toISOString(),
        camera_id: input.cameraId,
        person_tracking_ids: input.personTrackingIds,
        predicted_action: input.predictedAction,
        normal_confidence: normalConf,
        aggression_confidence: aggConf,
        temporal_consistency: temporalConsistency,
        decision_state: tracker.state,
        sos_decision: sosAction,
        reason,
      },
    };
  }
}

// Global shared singleton instance for the C3S client
export const globalSosDecisionEngine = new SosDecisionEngine();
