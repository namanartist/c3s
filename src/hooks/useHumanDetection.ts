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
  fps: 24,
  timestamp: Date.now(),
  fight: {
    isFightDetected: false,
    confidence: 0,
    severity: 'none',
    intensityScore: 0,
    statusText: 'INITIALIZING AI VISION',
    combatantsCount: 0
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

  const processFrame = useCallback(() => {
    if (!isActive) return;

    let detection: DetectionResult | null = null;

    if (videoRef?.current && videoRef.current.readyState >= 2 && !videoRef.current.paused) {
      // Real optical canvas analysis on video frames
      detection = globalVisionEngine.analyzeVideoFrame(videoRef.current, cameraMeta);
    } else if (cameraMeta?.youtubeEmbedUrl || (!videoRef?.current && cameraMeta?.fightDetected)) {
      // Active telemetry for YouTube streams & incident feeds
      detection = globalVisionEngine.synthesizeStreamTelemetry(cameraMeta);
    }

    if (detection) {
      setResult(detection);

      // Auto-dispatch emergency response if fight confidence is >= 90%
      if (detection.fight.isFightDetected && detection.fight.confidence >= 90) {
        const targetCamId = cameraId || cameraMeta?.id || 'cam_cctv_01';
        const targetCamName = cameraMeta?.name || `CCTV Camera #${targetCamId}`;
        const targetLocation = cameraMeta?.location || 'Surveillance Zone';

        globalFightDispatcher.handleFightDetection({
          cameraId: targetCamId,
          cameraName: targetCamName,
          location: targetLocation,
          confidence: Math.round(detection.fight.confidence),
          videoElement: videoRef?.current || null,
          videoUrl: cameraMeta?.videoUrl,
          nodeId: targetCamId.includes('gate_1')
            ? 'Main_Gate'
            : targetCamId.includes('gate_2')
            ? 'Gate2_Parking'
            : targetCamId.includes('conclave')
            ? 'Conclave'
            : undefined
        });
      }

      // Periodically sync detection metrics into global store
      const now = performance.now();
      if (now - lastSyncTimeRef.current >= 800) {
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
  }, [isActive, videoRef, cameraId, cameraMeta, updateCameraCrowdMetrics, setRealCrowdCount]);

  useEffect(() => {
    if (!isActive) return;

    let animId: number;
    const loop = () => {
      processFrame();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isActive, processFrame]);

  return result;
}
