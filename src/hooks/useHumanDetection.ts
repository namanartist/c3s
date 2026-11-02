// src/hooks/useHumanDetection.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  globalVisionEngine,
  type DetectionResult
} from '@/lib/humanVisionEngine';
import { useSafetyStore } from '@/store/safetyStore';
import { globalFightDispatcher } from '@/lib/fightAlertDispatcher';

export interface CameraVisionMeta {
  id?: string;
  name?: string;
  youtubeEmbedUrl?: string;
  videoUrl?: string;
  fightDetected?: boolean;
  fightConfidence?: number;
  location?: string;
}

const DEFAULT_DETECTION: DetectionResult = {
  count: 0,
  humans: [],
  density: 'low',
  fps: 30,
  timestamp: Date.now(),
  movement: {
    isMoving: false,
    intensity: 0,
    movementType: 'STATIONARY',
    statusLabel: 'Sensors Online • Scene Calm'
  },
  fight: {
    isFightDetected: false,
    confidence: 0,
    severity: 'none',
    intensityScore: 0,
    statusText: 'INITIALIZING AI VISION',
    combatantsCount: 0,
    isOnlyMovement: true
  }
};

export function useHumanDetection(
  videoRef: React.RefObject<HTMLVideoElement | null> | null,
  cameraId?: string,
  isActive = true,
  cameraMeta?: CameraVisionMeta
) {
  const [result, setResult] = useState<DetectionResult>(DEFAULT_DETECTION);

  const updateCameraCrowdMetrics = useSafetyStore((s) => s.updateCameraCrowdMetrics);
  const setRealCrowdCount = useSafetyStore((s) => s.setRealCrowdCount);
  const lastSyncTimeRef = useRef<number>(0);
  const lastProcessedTimeRef = useRef<number>(0);
  const cameraMetaRef = useRef<CameraVisionMeta | undefined>(cameraMeta);
  const fightStartTimeRef = useRef<number | null>(null);
  const lastSosTriggeredTimeRef = useRef<number>(0);

  useEffect(() => {
    cameraMetaRef.current = cameraMeta;
  }, [cameraMeta]);

  const processFrame = useCallback(() => {
    if (!isActive) return;

    let detection: DetectionResult | null = null;
    const currentMeta = cameraMetaRef.current;

    if (videoRef?.current && videoRef.current.readyState >= 2 && !videoRef.current.paused) {
      // Real optical canvas analysis on video frames
      detection = globalVisionEngine.analyzeVideoFrame(videoRef.current, currentMeta);
    } else if (currentMeta?.youtubeEmbedUrl || (!videoRef?.current && currentMeta?.fightDetected)) {
      // Active telemetry for YouTube streams & incident feeds
      detection = globalVisionEngine.synthesizeStreamTelemetry(currentMeta);
    }

    if (detection) {
      const nowMs = Date.now();
      const isAggressive =
        detection.fight.isFightDetected &&
        detection.fight.confidence >= 68 &&
        !detection.fight.isOnlyMovement;

      // Track continuous duration of aggression (User requirement: strictly > 5 seconds of active aggression)
      if (isAggressive) {
        if (fightStartTimeRef.current === null) {
          fightStartTimeRef.current = nowMs;
        }
      } else {
        fightStartTimeRef.current = null;
      }

      const sustainedMs = fightStartTimeRef.current ? nowMs - fightStartTimeRef.current : 0;
      detection.fight.sustainedDurationMs = sustainedMs;

      // Only auto-dispatch emergency SOS if aggressiveness is sustained continuously for MORE THAN 5 SECONDS (> 5000ms)
      if (sustainedMs > 5000 && nowMs - lastSosTriggeredTimeRef.current > 15000) {
        lastSosTriggeredTimeRef.current = nowMs;
        const targetCamId = cameraId || currentMeta?.id || 'cam_cctv_01';
        const targetCamName = currentMeta?.name || `CCTV Camera #${targetCamId}`;
        const targetLocation = currentMeta?.location || 'Surveillance Zone';

        globalFightDispatcher.handleFightDetection({
          cameraId: targetCamId,
          cameraName: targetCamName,
          location: targetLocation,
          confidence: Math.round(detection.fight.confidence),
          videoElement: videoRef?.current || null,
          videoUrl: currentMeta?.videoUrl,
          nodeId: targetCamId.includes('gate_1')
            ? 'Main_Gate'
            : targetCamId.includes('gate_2')
            ? 'Gate2_Parking'
            : targetCamId.includes('conclave')
            ? 'Conclave'
            : undefined
        });
      }

      setResult(detection);

      // Periodically sync detection metrics into global store (throttled to 1s)
      const now = performance.now();
      if (now - lastSyncTimeRef.current >= 1000) {
        lastSyncTimeRef.current = now;

        if (cameraId) {
          updateCameraCrowdMetrics([
            {
              id: cameraId,
              crowdCount: detection.count,
              crowdDensity: detection.density,
              confidence: detection.humans[0]?.confidence || 0.94,
              status: 'online'
            }
          ]);
        }
        if (detection.count > 0) {
          setRealCrowdCount(detection.count);
        }
      }
    }
  }, [isActive, videoRef, cameraId, updateCameraCrowdMetrics, setRealCrowdCount]);

  useEffect(() => {
    if (!isActive) return;

    let animId: number;
    let isRunning = true;

    // Ultra-low latency real-time optical loop (~30 FPS / 33ms interval)
    // Eliminates frame-processing latency while remaining efficient
    const loop = (timestamp: number) => {
      if (!isRunning) return;

      if (timestamp - lastProcessedTimeRef.current >= 33) {
        lastProcessedTimeRef.current = timestamp;
        processFrame();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
    };
  }, [isActive, processFrame]);

  return result;
}
