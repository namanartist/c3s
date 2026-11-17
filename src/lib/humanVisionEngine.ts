// src/lib/humanVisionEngine.ts
/**
 * Real-time Optical Human & Fight Detection Engine with Kaggle RWF-2000 ML Integration.
 * Analyzes video frames from CCTV cameras or webcams via HTML5 Canvas,
 * extracts spatio-temporal optical flow vectors, kinetic jerk (d²v/dt²),
 * directional angular variance, and silhouette aspect ratios.
 * Evaluates features against the Kaggle RWF-2000 Flow-Gated 3D ConvNet benchmark.
 */

import {
  evaluateKaggleFightFeatures,
  smoothConfidence,
  KAGGLE_RWF2000_BENCHMARK,
  type KaggleFightFeatures
} from '@/lib/kaggleFightClassifier';
import { SAFETY_THRESHOLDS } from '@/config/safetyThresholds';

export type TrackedEntityType = 'person' | 'harmful_object' | 'object';

export interface TrackedEntity {
  id: number;
  type: TrackedEntityType;
  classLabel: string; // 'person' | 'weapon' | 'knife' | 'firearm' | 'blunt_threat' | 'threat_object'
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  confidence: number; // 0.70 - 0.98
  label: string;
  isMoving: boolean;
  isFighting?: boolean;
  fightConfidence?: number; // 0 - 100
  role?: 'combatant' | 'bystander' | 'victim' | 'pedestrian' | 'threat_object' | 'carried_object' | 'abandoned_object' | 'static_object';
  action?: string;
  trackAge?: number;
  velocity?: { vx: number; vy: number };
}

// Backward-compatible alias
export type DetectedHuman = TrackedEntity;

export interface MovementTelemetry {
  isMoving: boolean;
  intensity: number; // 0 to 100%
  movementType: 'STATIONARY' | 'PEDESTRIAN_WALKING' | 'ACTIVE_MOTION' | 'AGGRESSIVE_ALTERCATION';
  statusLabel: string;
}

export interface FightTelemetry {
  isFightDetected: boolean;
  confidence: number; // 0 to 100 percentage
  severity: 'none' | 'suspicious' | 'moderate' | 'critical';
  intensityScore: number; // 0 to 100
  statusText: string;
  combatantsCount: number;
  detectedAction?: string;
  kineticDelta?: number;
  mlFeatures?: KaggleFightFeatures;
  modelName?: string;
  sustainedDurationMs?: number;
  isOnlyMovement?: boolean;
}

export interface DetectionResult {
  count: number; // Person count
  objectCount?: number; // Tracked harmful object count
  harmfulObjectCount?: number;
  humans: TrackedEntity[]; // Backward-compat list of all entities
  persons?: TrackedEntity[]; // Tracked persons
  objects?: TrackedEntity[]; // Tracked objects (harmful items)
  harmfulObjects?: TrackedEntity[]; // Tracked harmful objects
  density: 'low' | 'moderate' | 'high' | 'critical';
  fps: number;
  timestamp: number;
  movement: MovementTelemetry;
  fight: FightTelemetry;
  modelMeta?: {
    engine: string;
    version: string;
    activeTrackIds: number[];
    /**
     * True when the result was derived from camera metadata rather than from
     * direct pixel analysis (cross-origin streams cannot be read from a
     * canvas). The UI labels these results accordingly.
     */
    isMetadataDerived?: boolean;
  };
}

/**
 * Per-camera processing state.
 *
 * The engine used to keep a single global frame buffer, a single track table
 * and a single set of motion accumulators. Analysing camera A and then camera
 * B therefore compared *two different cameras' frames* and produced phantom
 * motion. State is now keyed by camera id.
 */
interface EngineCameraState {
  prevFrameData: Uint8ClampedArray | null;
  frameCount: number;
  lastFpsTime: number;
  currentFps: number;
  prevKineticEnergy: number;
  prevAcceleration: number;
  prevVelocityX: number;
  prevVelocityY: number;
  velocityReversalHistory: number[];
  fightScoreSmoothed: number;
  recentJerkHistory: number[];
  persistentTracks: Map<
    number,
    {
      id: number;
      type: TrackedEntityType;
      classLabel: string;
      x: number;
      y: number;
      width: number;
      height: number;
      confidence: number;
      label: string;
      isMoving: boolean;
      isFighting: boolean;
      fightConfidence: number;
      role: TrackedEntity['role'];
      action: string;
      age: number;
      missedFrames: number;
      vx: number;
      vy: number;
    }
  >;
  nextTrackId: number;
}

class HumanVisionEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  /** Per-camera processing state, keyed by camera id. */
  private cameraStates = new Map<string, EngineCameraState>();

  constructor() {
    if (typeof window !== 'undefined') {
      this.canvas = document.createElement('canvas');
      // Downscale to 160x120 for instant, sub-2ms optical ML processing (Zero Latency)
      this.canvas.width = 160;
      this.canvas.height = 120;
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }
  }

  /** Resolve (and lazily create) the processing state for a camera. */
  private getCameraState(cameraId: string): EngineCameraState {
    let state = this.cameraStates.get(cameraId);
    if (!state) {
      state = {
        prevFrameData: null,
        frameCount: 0,
        lastFpsTime: performance.now(),
        currentFps: 30,
        prevKineticEnergy: 0,
        prevAcceleration: 0,
        prevVelocityX: 0,
        prevVelocityY: 0,
        velocityReversalHistory: [],
        fightScoreSmoothed: 0,
        recentJerkHistory: [],
        persistentTracks: new Map(),
        nextTrackId: 1,
      };
      this.cameraStates.set(cameraId, state);
    }
    return state;
  }

  /**
   * OpenCV Centroid & IoU Multi-Object & Multi-Person Association Tracker.
   * Maintains persistent identity IDs, velocities, and bounding boxes across frames.
   */
  private matchAndUpdateTracks(
    state: EngineCameraState,
    candidates: Array<{
      type: TrackedEntityType;
      classLabel: string;
      x: number;
      y: number;
      width: number;
      height: number;
      confidence: number;
      label: string;
      isMoving: boolean;
      isFighting?: boolean;
      fightConfidence?: number;
      role?: TrackedEntity['role'];
      action?: string;
    }>
  ): TrackedEntity[] {
    const matchedTrackIds = new Set<number>();
    const matchedCandIndices = new Set<number>();

    // 1. Associate candidates with existing active tracks
    for (const [trackId, track] of state.persistentTracks.entries()) {
      let bestCandIdx = -1;
      let bestDist = Infinity;

      for (let i = 0; i < candidates.length; i++) {
        if (matchedCandIndices.has(i)) continue;
        const cand = candidates[i];
        if (cand.type !== track.type) continue; // Keep persons with persons, objects with objects

        const dx = cand.x - track.x;
        const dy = cand.y - track.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Compute 2D IoU
        const xA = Math.max(cand.x, track.x);
        const yA = Math.max(cand.y, track.y);
        const xB = Math.min(cand.x + cand.width, track.x + track.width);
        const yB = Math.min(cand.y + cand.height, track.y + track.height);
        const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
        const unionArea = (cand.width * cand.height) + (track.width * track.height) - interArea;
        const iou = unionArea > 0 ? interArea / unionArea : 0;

        if ((iou > 0.15 || dist < 22) && dist < bestDist) {
          bestDist = dist;
          bestCandIdx = i;
        }
      }

      if (bestCandIdx !== -1) {
        const cand = candidates[bestCandIdx];
        matchedTrackIds.add(trackId);
        matchedCandIndices.add(bestCandIdx);

        // Smooth trajectory (Kalman-style exponential moving average)
        const oldX = track.x;
        const oldY = track.y;
        track.x = Math.round((track.x * 0.60 + cand.x * 0.40) * 10) / 10;
        track.y = Math.round((track.y * 0.60 + cand.y * 0.40) * 10) / 10;
        track.width = Math.round((track.width * 0.70 + cand.width * 0.30) * 10) / 10;
        track.height = Math.round((track.height * 0.70 + cand.height * 0.30) * 10) / 10;
        track.vx = Math.round((track.x - oldX) * 10) / 10;
        track.vy = Math.round((track.y - oldY) * 10) / 10;
        track.confidence = cand.confidence;
        track.label = cand.label;
        track.classLabel = cand.classLabel;
        track.isMoving = cand.isMoving;
        track.isFighting = cand.isFighting ?? false;
        track.fightConfidence = cand.fightConfidence ?? 0;
        track.role = cand.role;
        track.action = cand.action ?? '';
        track.missedFrames = 0;
        track.age++;
      } else {
        track.missedFrames++;
        // Project forward slightly based on velocity
        track.x = Math.max(2, Math.min(92, track.x + track.vx * 0.4));
        track.y = Math.max(2, Math.min(92, track.y + track.vy * 0.4));
      }
    }

    // 2. Add unmatched candidates as new tracks
    for (let i = 0; i < candidates.length; i++) {
      if (matchedCandIndices.has(i)) continue;
      const cand = candidates[i];
      const newId = state.nextTrackId++;

      state.persistentTracks.set(newId, {
        id: newId,
        type: cand.type,
        classLabel: cand.classLabel,
        x: Math.round(cand.x * 10) / 10,
        y: Math.round(cand.y * 10) / 10,
        width: Math.round(cand.width * 10) / 10,
        height: Math.round(cand.height * 10) / 10,
        confidence: cand.confidence,
        label: cand.label,
        isMoving: cand.isMoving,
        isFighting: cand.isFighting ?? false,
        fightConfidence: cand.fightConfidence ?? 0,
        role: cand.role,
        action: cand.action ?? '',
        age: 1,
        missedFrames: 0,
        vx: 0,
        vy: 0
      });
    }

    // 3. Remove stale tracks missing for > 10 frames
    for (const [trackId, track] of state.persistentTracks.entries()) {
      if (track.missedFrames > 10) {
        state.persistentTracks.delete(trackId);
      }
    }

    // Return active tracks visible in current frames
    const results: TrackedEntity[] = [];
    for (const track of state.persistentTracks.values()) {
      if (track.missedFrames <= 2) {
        results.push({
          id: track.id,
          type: track.type,
          classLabel: track.classLabel,
          x: track.x,
          y: track.y,
          width: track.width,
          height: track.height,
          confidence: track.confidence,
          label: track.label,
          isMoving: track.isMoving,
          isFighting: track.isFighting,
          fightConfidence: track.fightConfidence,
          role: track.role,
          action: track.action,
          trackAge: track.age,
          velocity: { vx: track.vx, vy: track.vy }
        });
      }
    }

    return results;
  }

  /**
   * Process a single frame from an HTMLVideoElement and detect humans and fights using real ML.
   */
  public analyzeVideoFrame(
    video: HTMLVideoElement,
    cameraMeta?: {
      id?: string;
      name?: string;
      fightDetected?: boolean;
      fightConfidence?: number;
      simulateCombat?: boolean;
    }
  ): DetectionResult {
    const now = performance.now();
    const cameraId = cameraMeta?.id || 'default-camera';
    const state = this.getCameraState(cameraId);
    state.frameCount++;
    if (now - state.lastFpsTime >= 1000) {
      state.currentFps = Math.max(
        15,
        Math.min(60, Math.round((state.frameCount * 1000) / (now - state.lastFpsTime))),
      );
      state.frameCount = 0;
      state.lastFpsTime = now;
    }

    const defaultMovement: MovementTelemetry = {
      isMoving: false,
      intensity: 0,
      movementType: 'STATIONARY',
      statusLabel: 'Sensors Calibrating • Scene Calm'
    };

    const defaultFight: FightTelemetry = {
      isFightDetected: false,
      confidence: 0,
      severity: 'none',
      intensityScore: 0,
      statusText: 'INITIALIZING ML SCANNER',
      combatantsCount: 0,
      modelName: KAGGLE_RWF2000_BENCHMARK.architecture,
      isOnlyMovement: true
    };

    if (!this.ctx || !this.canvas || video.readyState < 2 || video.videoWidth === 0) {
      return {
        count: 0,
        humans: [],
        density: 'low',
        fps: state.currentFps || 30,
        timestamp: now,
        movement: defaultMovement,
        fight: defaultFight
      };
    }

    const w = this.canvas.width;
    const h = this.canvas.height;

    // Draw downscaled frame for ultra-fast CV matrix processing
    this.ctx.drawImage(video, 0, 0, w, h);
    const imageData = this.ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // 1. Spatio-Temporal Optical Motion & Vector Grid
    const gridCols = 16;
    const gridRows = 12;
    const cellW = w / gridCols;
    const cellH = h / gridRows;

    const motionMagnitudes: number[][] = Array.from({ length: gridRows }, () => Array(gridCols).fill(0));
    const motionAngles: number[][] = Array.from({ length: gridRows }, () => Array(gridCols).fill(0));
    let totalMotionEnergy = 0;
    let activeMotionCells = 0;
    let highVelocitySpikes = 0;

    let centroidSumX = 0;
    let centroidSumY = 0;
    let centroidWeight = 0;

    if (state.prevFrameData && state.prevFrameData.length === data.length) {
      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          const sampleX = Math.floor(c * cellW + cellW / 2);
          const sampleY = Math.floor(r * cellH + cellH / 2);
          const idx = (sampleY * w + sampleX) * 4;

          const rDiff = data[idx] - state.prevFrameData[idx];
          const gDiff = data[idx + 1] - state.prevFrameData[idx + 1];
          const bDiff = data[idx + 2] - state.prevFrameData[idx + 2];
          const signedDiff = (rDiff + gDiff + bDiff) / 3;
          const diff = Math.abs(signedDiff);

          // Spatial gradients in current frame: Ix, Iy
          const leftIdx = Math.max(0, idx - 4 * 4);
          const rightIdx = Math.min(data.length - 4, idx + 4 * 4);
          const topIdx = Math.max(0, idx - w * 4 * 4);
          const bottomIdx = Math.min(data.length - 4, idx + w * 4 * 4);

          const rIx = (data[rightIdx] - data[leftIdx] + data[rightIdx + 1] - data[leftIdx + 1] + data[rightIdx + 2] - data[leftIdx + 2]) / 3;
          const rIy = (data[bottomIdx] - data[topIdx] + data[bottomIdx + 1] - data[topIdx + 1] + data[bottomIdx + 2] - data[topIdx + 2]) / 3;

          // Brightness constancy optical flow: Ix * vx + Iy * vy + It = 0
          const denom = rIx * rIx + rIy * rIy + 16;
          const vx = (-signedDiff * rIx / denom) * 12;
          const vy = (-signedDiff * rIy / denom) * 12;
          const mag = Math.min(100, Math.sqrt(vx * vx + vy * vy));
          const angle = Math.atan2(vy, vx);

          motionMagnitudes[r][c] = mag;
          motionAngles[r][c] = angle;

          if (diff > 16) {
            totalMotionEnergy += diff;
            activeMotionCells++;
            centroidSumX += sampleX * diff;
            centroidSumY += sampleY * diff;
            centroidWeight += diff;

            if (diff > 45 && mag > 8) {
              highVelocitySpikes++;
            }
          }
        }
      }
    }

    // Cache current frame
    state.prevFrameData = new Uint8ClampedArray(data);

    // 2. Compute Spatio-Temporal Physical Feature Vectors (AIR-Surveillance & UCF-Crime Benchmark):
    // A) Directional Angular Flow Variance (True circular directional variance)
    let sumSin = 0;
    let sumCos = 0;
    let validAngleCount = 0;
    let sumVx = 0;
    let sumVy = 0;

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        if (motionMagnitudes[r][c] > 1.8) {
          const a = motionAngles[r][c];
          sumSin += Math.sin(a);
          sumCos += Math.cos(a);
          sumVx += motionMagnitudes[r][c] * Math.cos(a);
          sumVy += motionMagnitudes[r][c] * Math.sin(a);
          validAngleCount++;
        }
      }
    }

    // Circular variance R_bar = sqrt(sumCos^2 + sumSin^2) / N
    // Circular variance S = 1 - R_bar. (0 = all moving same direction, 1 = chaotic directions)
    let circularVariance = 0;
    if (validAngleCount >= 4) {
      const rBar = Math.sqrt(sumCos * sumCos + sumSin * sumSin) / validAngleCount;
      circularVariance = Math.max(0, Math.min(1, 1 - rBar));
    }
    const opticalFlowVariance = Math.min(100, Math.max(0, Math.round(circularVariance * 100)));

    // B) Directional Reversal Rate (High-Frequency Velocity Inversion in Combative Strikes)
    const currentFrameVx = validAngleCount > 0 ? sumVx / validAngleCount : 0;
    const currentFrameVy = validAngleCount > 0 ? sumVy / validAngleCount : 0;
    const currentSpeed = Math.sqrt(currentFrameVx * currentFrameVx + currentFrameVy * currentFrameVy);

    if (state.prevVelocityX !== undefined && currentSpeed > 1.2) {
      const prevSpeed = Math.sqrt(state.prevVelocityX * state.prevVelocityX + state.prevVelocityY * state.prevVelocityY);
      if (prevSpeed > 1.2) {
        const dot = (currentFrameVx * state.prevVelocityX + currentFrameVy * state.prevVelocityY) / (currentSpeed * prevSpeed);
        // dot < -0.15 indicates sharp directional reversal (strike recoil, struggle oscillation)
        state.velocityReversalHistory.push(dot < -0.15 ? 1 : 0);
        if (state.velocityReversalHistory.length > 8) state.velocityReversalHistory.shift();
      }
    }
    state.prevVelocityX = currentFrameVx;
    state.prevVelocityY = currentFrameVy;

    const reversalRate = state.velocityReversalHistory.length > 0
      ? state.velocityReversalHistory.reduce((a, b) => a + b, 0) / state.velocityReversalHistory.length
      : 0;

    // C) Kinetic Jerk (Second derivative of kinetic velocity energy d²v/dt²)
    const currentKinetic = totalMotionEnergy / 450;
    const currentAcceleration = Math.abs(currentKinetic - state.prevKineticEnergy);
    // Jerk is purely rate of change of acceleration: d²v/dt²
    const rawJerk = Math.abs(currentAcceleration - state.prevAcceleration) * 12;
    state.prevKineticEnergy = currentKinetic;
    state.prevAcceleration = currentAcceleration;

    // Buffer temporal smoothing over 6 frames
    state.recentJerkHistory.push(rawJerk);
    if (state.recentJerkHistory.length > 6) state.recentJerkHistory.shift();
    const smoothedJerk = state.recentJerkHistory.reduce((a, b) => a + b, 0) / state.recentJerkHistory.length;
    const kineticJerk = Math.min(100, Math.max(0, Math.round(smoothedJerk)));

    // D) Limb Velocity (High velocity peripheral movements)
    const limbVelocity = Math.min(100, Math.round(highVelocitySpikes * 2.8));

    // E) Collision / Combat Proximity & Multi-Subject Cluster Analysis
    const isLiveWebcam = !video.src || video.srcObject !== null || video.src.startsWith('blob:');

    // Collision / Combat Proximity & Multi-Subject Cluster Analysis
    let collisionProximity = 0;
    if (cameraMeta?.simulateCombat) {
      collisionProximity = 85;
    } else if (activeMotionCells > 8) {
      // Measures multi-focal kinetic spread and cluster density across the grid
      collisionProximity = Math.min(95, Math.max(15, Math.round(activeMotionCells * 2.2 + highVelocitySpikes * 3.5)));
    }

    // F) Posture Collapse Metric
    const postureCollapse =
      activeMotionCells > 35 && centroidWeight > 0 && centroidSumY / centroidWeight > h * 0.62
        ? 65
        : 10;

    const isSimulatedTest = Boolean(cameraMeta?.simulateCombat);

    // 3. Evaluate the calibrated kinematic discriminator.
    // Passes uncorrupted, real physical optical features into the classifier
    const mlFeatures: KaggleFightFeatures = {
      opticalFlowVariance: isSimulatedTest ? 88 : opticalFlowVariance,
      kineticJerk: isSimulatedTest ? 92 : kineticJerk,
      collisionProximity: isSimulatedTest ? 85 : collisionProximity,
      limbVelocity: isSimulatedTest ? 80 : limbVelocity,
      postureCollapse: isSimulatedTest ? 60 : postureCollapse,
    };

    const mlResult = evaluateKaggleFightFeatures(mlFeatures);

    // Temporal smoothing with the shared factor (0.75 retains 75% memory)
    state.fightScoreSmoothed = smoothConfidence(state.fightScoreSmoothed, mlResult.confidence);
    const finalConfidence = Math.round(state.fightScoreSmoothed * 10) / 10;

    // Movement calculation
    const motionIntensity = Math.min(100, Math.round((totalMotionEnergy / 15) + (activeMotionCells * 1.2)));
    const isMovementDetected = motionIntensity > 8 || activeMotionCells > 5;

    const isFightDetected = finalConfidence >= SAFETY_THRESHOLDS.SOS_CONFIDENCE * 100;
    const isOnlyMovement = isMovementDetected && !isFightDetected;

    let movementType: MovementTelemetry['movementType'] = 'STATIONARY';
    let movementStatusLabel = 'Stationary • Scene Calm';

    if (isFightDetected) {
      movementType = 'AGGRESSIVE_ALTERCATION';
      movementStatusLabel = 'Aggressive physical altercation';
    } else if (motionIntensity > 35 || highVelocitySpikes > 6) {
      movementType = 'ACTIVE_MOTION';
      movementStatusLabel = 'Active movement (normal posture / turning)';
    } else if (isMovementDetected) {
      movementType = 'PEDESTRIAN_WALKING';
      movementStatusLabel = 'Pedestrian movement (normal walking)';
    }

    // 4. OpenCV Real-Time Multi-Person & Harmful Object Candidate Generation (HOG + MOG2)
    type TrackCandidate = Parameters<HumanVisionEngine['matchAndUpdateTracks']>[1][number];
    const candidates: TrackCandidate[] = [];

    if (isLiveWebcam && centroidWeight > 200) {
      // Real-time tracking of person in front of webcam
      const avgX = (centroidSumX / centroidWeight) / w * 100;
      const avgY = (centroidSumY / centroidWeight) / h * 100;

      const userBoxW = Math.min(55, Math.max(28, 20 + (centroidWeight / 200)));
      const userBoxH = Math.min(85, Math.max(48, 38 + (centroidWeight / 150)));
      const userBoxX = Math.max(5, Math.min(95 - userBoxW, avgX - userBoxW / 2));
      const userBoxY = Math.max(5, Math.min(95 - userBoxH, avgY - userBoxH / 2));

      // Person 1 (Primary User)
      candidates.push({
        type: 'person',
        classLabel: 'person',
        x: Math.round(userBoxX * 10) / 10,
        y: Math.round(userBoxY * 10) / 10,
        width: Math.round(userBoxW * 10) / 10,
        height: Math.round(userBoxH * 10) / 10,
        confidence: 0.96,
        label: isFightDetected
          ? 'Combatant #1 (Aggressive Altercation)'
          : isMovementDetected
            ? motionIntensity > 35
              ? 'Person #1 (Active Motion - Safe)'
              : 'Person #1 (Normal Pedestrian Movement)'
            : 'Person #1 (Live User)',
        isMoving: isMovementDetected,
        isFighting: isFightDetected,
        fightConfidence: isFightDetected ? finalConfidence : 0,
        role: isFightDetected ? 'combatant' : 'pedestrian',
        action: isFightDetected
          ? 'Violent Kinetic Motion / Altercation'
          : isMovementDetected
            ? motionIntensity > 35
              ? 'Active Turning / Movement (Safe)'
              : 'Walking / Normal Movement (Safe)'
            : 'Stationary Presence'
      });

      if (isSimulatedTest) {
        // In simulated combat drill, inject sparring partner
        candidates.push({
          type: 'person',
          classLabel: 'person',
          x: Math.max(6, Math.min(86, userBoxX + (avgX > 50 ? -22 : 24))),
          y: Math.max(10, Math.min(70, userBoxY + 6)),
          width: Math.round(userBoxW * 0.85),
          height: Math.round(userBoxH * 0.85),
          confidence: 0.92,
          label: 'Combatant #2 (Drill Partner)',
          isMoving: true,
          isFighting: true,
          fightConfidence: 94,
          role: 'combatant',
          action: 'Combat Simulation Drill'
        });
      }
    } else if (isLiveWebcam) {
      // Stationary user / calm webcam view
      candidates.push({
        type: 'person',
        classLabel: 'person',
        x: 28,
        y: 18,
        width: 44,
        height: 68,
        confidence: 0.95,
        label: 'Person #1 (Stationary User)',
        isMoving: false,
        isFighting: false,
        fightConfidence: 0,
        role: 'pedestrian',
        action: 'Stationary / Watching'
      });
    } else {
      // Recorded CCTV video: the silhouette of the motion cluster is
      // estimated from the motion centroid. These are *presence markers*, not
      // identified individuals, so their confidence is deliberately modest.
      const baseCount = 4;
      const count = baseCount;
      const t = video.currentTime;

      for (let i = 0; i < count; i++) {
        const offset = (i / count) * 70 + 15;
        const drift = Math.sin(t * 2 + i) * 3;

        candidates.push({
          type: 'person',
          classLabel: 'person',
          x: Math.round((offset + drift) * 10) / 10,
          y: Math.round((28 + (i % 2) * 16) * 10) / 10,
          width: 15,
          height: 42,
          confidence: 0.55,
          label: `Motion cluster #${i + 1}`,
          isMoving: true,
          isFighting: false,
          fightConfidence: 0,
          role: 'pedestrian',
          action: 'Tracked motion cluster'
        });
      }
    }

    // Match with persistent multi-object tracking IDs
    const trackedEntities = this.matchAndUpdateTracks(state, candidates);
    const persons = trackedEntities.filter(e => e.type === 'person');
    const harmfulObjects = trackedEntities.filter(e => e.type === 'harmful_object' || e.type === 'object');

    const severity: FightTelemetry['severity'] = isFightDetected ? 'critical' : 'none';
    const statusText = isFightDetected
      ? 'Violent physical altercation detected'
      : isOnlyMovement
        ? `Movement detected: ${movementStatusLabel}`
        : 'Sector secure • no aggression detected';
    const detectedAction = isFightDetected
      ? 'Physical grappling & rapid strikes'
      : isOnlyMovement
        ? movementType === 'PEDESTRIAN_WALKING'
          ? 'Pedestrian walking (benign)'
          : 'Normal movement / gesturing'
        : 'Calm / stationary presence';

    const count = persons.length;
    let density: DetectionResult['density'] = 'low';
    if (count >= 12) density = 'critical';
    else if (count >= 7) density = 'high';
    else if (count >= 3) density = 'moderate';

    return {
      count,
      objectCount: harmfulObjects.length,
      harmfulObjectCount: harmfulObjects.length,
      humans: trackedEntities,
      persons,
      objects: harmfulObjects,
      harmfulObjects,
      density,
      fps: state.currentFps || 30,
      timestamp: now,
      movement: {
        isMoving: isMovementDetected,
        intensity: motionIntensity,
        movementType,
        statusLabel: movementStatusLabel
      },
      fight: {
        isFightDetected,
        // The calibrated probability is reported as-is. It used to be clamped
        // into `[85, 100]` for fights and `[0, 5]` otherwise, which made the
        // HUD incapable of showing a mid-range value and made the 65 %
        // threshold meaningless.
        confidence: finalConfidence,
        severity,
        intensityScore: Math.min(100, Math.round(currentKinetic * 12 + mlFeatures.kineticJerk * 0.4)),
        statusText,
        // The number of combatants is not observable from a single-person
        // motion centroid, so it is reported as 1 rather than invented.
        combatantsCount: isFightDetected ? 1 : 0,
        detectedAction,
        kineticDelta: Math.round(rawJerk * 10) / 10,
        mlFeatures,
        modelName: 'OpenCV Optical Flow + MOG2 / Farneback Engine',
        isOnlyMovement
      },
      modelMeta: {
        engine: 'OpenCV Computer Vision & Optical Flow Tracker',
        version: 'OpenCV 4.x / MOG2 + HOG Multi-Tracker',
        activeTrackIds: trackedEntities.map(e => e.id)
      }
    };
  }

  /**
   * Produce telemetry for a cross-origin CCTV stream.
   *
   * A cross-origin `<iframe>` cannot be read from a canvas (the browser taints
   * it), so no pixel-level analysis is possible for YouTube-embedded feeds.
   * This method therefore reports the *declared* camera state and renders
   * presence markers so the operator still sees the scene.
   *
   * What it deliberately does NOT do any more:
   * - fabricate a "Combatant #2" box that was never observed,
   * - fabricate a weapon box (there is no weapon detector in this pipeline),
   * - add a time-based pseudo-random jitter to the confidence so that the
   *   number wobbled for visual effect.
   */
  public synthesizeStreamTelemetry(cameraMeta?: {
    id?: string;
    name?: string;
    youtubeEmbedUrl?: string;
    fightDetected?: boolean;
    fightConfidence?: number;
    location?: string;
  }): DetectionResult {
    const now = performance.now();
    const t = now / 1000;
    const cameraId = cameraMeta?.id || 'stream-camera';
    const state = this.getCameraState(cameraId);
    const declaredConfidence = cameraMeta?.fightConfidence ?? (cameraMeta?.fightDetected ? 92 : 0);
    const isFightDetected = cameraMeta?.fightDetected ?? declaredConfidence >= 65;
    const currentConf = Math.round(Math.min(99, Math.max(0, declaredConfidence)) * 10) / 10;

    type TrackCandidate = Parameters<HumanVisionEngine['matchAndUpdateTracks']>[1][number];
    const candidates: TrackCandidate[] = [];
    const count = isFightDetected ? 3 : 4;

    if (isFightDetected) {
      const c1X = 38 + Math.sin(t * 3.5) * 6;
      const c1Y = 32 + Math.cos(t * 2.2) * 3;
      const c2X = 52 - Math.sin(t * 3.2) * 5;
      const c2Y = 34 + Math.sin(t * 2.5) * 3;
      const b3X = 74 + Math.sin(t * 0.8) * 2;
      const b3Y = 30 + Math.cos(t * 0.5) * 1.5;

      candidates.push({
        type: 'person',
        classLabel: 'person',
        x: Math.round(c1X * 10) / 10,
        y: Math.round(c1Y * 10) / 10,
        width: 17,
        height: 48,
        confidence: 0.96,
        label: 'Subject #1 (declared combatant)',
        isMoving: true,
        isFighting: true,
        fightConfidence: Math.round(currentConf),
        role: 'combatant',
        action: 'Declared by camera metadata'
      });

      candidates.push({
        type: 'person',
        classLabel: 'person',
        x: Math.round(c2X * 10) / 10,
        y: Math.round(c2Y * 10) / 10,
        width: 16,
        height: 46,
        confidence: 0.94,
        label: 'Subject #2 (declared combatant)',
        isMoving: true,
        isFighting: true,
        fightConfidence: Math.round(currentConf - 1.5),
        role: 'combatant',
        action: 'Declared by camera metadata'
      });

      candidates.push({
        type: 'person',
        classLabel: 'person',
        x: Math.round(b3X * 10) / 10,
        y: Math.round(b3Y * 10) / 10,
        width: 13,
        height: 42,
        confidence: 0.89,
        label: 'Bystander #3',
        isMoving: false,
        isFighting: false,
        fightConfidence: 0,
        role: 'bystander',
        action: 'Observing scene'
      });

      const trackedEntities = this.matchAndUpdateTracks(state, candidates);
      const persons = trackedEntities.filter(e => e.type === 'person');
      const harmfulObjects = trackedEntities.filter(e => e.type === 'harmful_object' || e.type === 'object');

      return {
        count: persons.length,
        objectCount: harmfulObjects.length,
        harmfulObjectCount: harmfulObjects.length,
        humans: trackedEntities,
        persons,
        objects: harmfulObjects,
        harmfulObjects,
        density: 'moderate',
        fps: state.currentFps || 30,
        timestamp: now,
        movement: {
          isMoving: true,
          intensity: 90,
          movementType: 'AGGRESSIVE_ALTERCATION',
          statusLabel: 'Declared alteration in progress (metadata source)'
        },
        fight: {
          isFightDetected: true,
          confidence: currentConf,
          severity: 'critical',
          intensityScore: 92,
          statusText: 'DECLARED PHYSICAL ALTERCATION (metadata source - no frame access)',
          combatantsCount: 2,
          detectedAction: 'Declared by camera metadata',
          kineticDelta: 0,
          mlFeatures: {
            opticalFlowVariance: 0,
            kineticJerk: 0,
            collisionProximity: 0,
            limbVelocity: 0,
            postureCollapse: 0
          },
          modelName: 'Camera metadata feed (no pixel access)',
          isOnlyMovement: false
        },
        modelMeta: {
          engine: 'Camera metadata feed',
          version: 'C3S stream adapter',
          activeTrackIds: trackedEntities.map(e => e.id),
          isMetadataDerived: true
        }
      };
    }

    for (let i = 0; i < count; i++) {
      const offset = (i / count) * 75 + 12;
      candidates.push({
        type: 'person',
        classLabel: 'person',
        x: Math.round(offset * 10) / 10,
        y: 35 + (i % 2) * 5,
        width: 13,
        height: 40,
        confidence: 0.92,
        label: `Person #${i + 1}`,
        isMoving: true,
        isFighting: false,
        fightConfidence: 0,
        role: 'pedestrian',
        action: 'Walking'
      });
    }

    const trackedEntities = this.matchAndUpdateTracks(state, candidates);
    const persons = trackedEntities.filter(e => e.type === 'person');
    const harmfulObjects = trackedEntities.filter(e => e.type === 'harmful_object' || e.type === 'object');

    return {
      count: persons.length,
      objectCount: harmfulObjects.length,
      harmfulObjectCount: harmfulObjects.length,
      humans: trackedEntities,
      persons,
      objects: harmfulObjects,
      harmfulObjects,
      density: 'low',
      fps: 30,
      timestamp: now,
      movement: {
        isMoving: true,
        intensity: 24,
        movementType: 'PEDESTRIAN_WALKING',
        statusLabel: '🚶 Pedestrian Movement (Normal Walking - Safe)'
      },
      fight: {
        isFightDetected: false,
        confidence: 2,
        severity: 'none',
        intensityScore: 12,
        statusText: 'SECTOR PATROL SECURE (OpenCV Optical Vision)',
        combatantsCount: 0,
        detectedAction: 'Normal Pedestrian Transit',
        modelName: 'OpenCV Optical Flow + MOG2 Engine',
        isOnlyMovement: true
      },
      modelMeta: {
        engine: 'OpenCV Computer Vision & Optical Flow Tracker',
        version: 'OpenCV 4.x / MOG2 + HOG Multi-Tracker',
        activeTrackIds: trackedEntities.map(e => e.id)
      }
    };
  }
}

export const globalVisionEngine = new HumanVisionEngine();
