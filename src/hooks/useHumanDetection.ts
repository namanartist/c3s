// src/hooks/useHumanDetection.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { globalVisionEngine, type DetectionResult, type DetectedHuman } from '@/lib/humanVisionEngine';
import { useSafetyStore } from '@/store/safetyStore';

export function useHumanDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  cameraId?: string,
  isActive = true
) {
  const [result, setResult] = useState<DetectionResult>({
    count: 0,
    humans: [],
    density: 'low',
    fps: 24,
    timestamp: Date.now()
  });

  const updateCameraCrowdMetrics = useSafetyStore((s) => s.updateCameraCrowdMetrics);
  const setRealCrowdCount = useSafetyStore((s) => s.setRealCrowdCount);
  const animFrameRef = useRef<number | null>(null);
  const lastSyncTimeRef = useRef<number>(0);

  const processFrame = useCallback(() => {
    if (!isActive || !videoRef.current) return;

    const video = videoRef.current;
    if (video.readyState >= 2 && !video.paused) {
      const detection = globalVisionEngine.analyzeVideoFrame(video);
      setResult(detection);

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
              confidence: detection.humans[0]?.confidence || 0.92,
              status: 'online'
            }
          ]);
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(processFrame);
  }, [isActive, videoRef, cameraId, updateCameraCrowdMetrics]);

  useEffect(() => {
    if (!isActive) return;

    animFrameRef.current = requestAnimationFrame(processFrame);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isActive, processFrame]);

  return result;
}
