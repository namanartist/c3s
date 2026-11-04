// src/lib/__tests__/sosDecisionEngine.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { SosDecisionEngine } from '../sosDecisionEngine';

describe('SosDecisionEngine - Critical SOS Decision Logic', () => {
  let engine: SosDecisionEngine;

  beforeEach(() => {
    engine = new SosDecisionEngine({
      sosConfidenceThreshold: 0.85,
      minContinuousDurationMs: 2000,
      minConsecutiveWindows: 4,
      perCameraCooldownMs: 30000,
      exitConfidenceThreshold: 0.35,
    });
  });

  it('Requirement 1: Normal walking never triggers SOS', () => {
    const cameraId = 'cam_hallway';
    for (let step = 0; step < 20; step++) {
      const result = engine.evaluateWindow({
        cameraId,
        timestamp: 1000 + step * 200,
        rawConfidence: 0.12,
        predictedAction: 'walking',
        personTrackingIds: [1, 2],
        hasInterpersonalContact: false,
        hasStrikeKinematics: false,
      });

      expect(result.state).toBe('NORMAL');
      expect(result.shouldTriggerSos).toBe(false);
      expect(result.shouldCaptureEvidence).toBe(false);
    }
  });

  it('Requirement 2: Fast running never triggers SOS', () => {
    const cameraId = 'cam_track';
    for (let step = 0; step < 20; step++) {
      const result = engine.evaluateWindow({
        cameraId,
        timestamp: 1000 + step * 200,
        rawConfidence: 0.28, // High velocity motion
        predictedAction: 'running',
        personTrackingIds: [1],
        hasInterpersonalContact: false,
        hasStrikeKinematics: false,
      });

      expect(result.state).toBe('NORMAL');
      expect(result.shouldTriggerSos).toBe(false);
    }
  });

  it('Requirement 3: Hand gestures, waving, turning around by a single person never trigger SOS', () => {
    const cameraId = 'cam_webcam';
    for (let step = 0; step < 25; step++) {
      const result = engine.evaluateWindow({
        cameraId,
        timestamp: 1000 + step * 200,
        rawConfidence: 0.45, // Gestures
        predictedAction: 'hand_gestures',
        personTrackingIds: [1], // Single isolated person
        hasInterpersonalContact: false,
        hasStrikeKinematics: false,
      });

      expect(result.state).toBe('NORMAL');
      expect(result.shouldTriggerSos).toBe(false);
    }
  });

  it('Requirement 4: Single-frame glitch spike (even at 99%) does NOT trigger SOS', () => {
    const cameraId = 'cam_glitch';
    const result = engine.evaluateWindow({
      cameraId,
      timestamp: 1000,
      rawConfidence: 0.99, // Momentary sensor glitch
      predictedAction: 'glitch',
      personTrackingIds: [1, 2],
      hasInterpersonalContact: true,
      hasStrikeKinematics: true,
    });

    // EMA smoothing and window persistence prevent single-frame trigger
    expect(result.shouldTriggerSos).toBe(false);
    expect(result.state).not.toBe('CONFIRMED_AGGRESSION');
  });

  it('Requirement 5: Global camera motion suppresses false alerts', () => {
    const cameraId = 'cam_pan_tilt';
    for (let step = 0; step < 10; step++) {
      const result = engine.evaluateWindow({
        cameraId,
        timestamp: 1000 + step * 200,
        rawConfidence: 0.95,
        predictedAction: 'pan_tilt_motion',
        personTrackingIds: [1, 2],
        hasInterpersonalContact: true,
        hasStrikeKinematics: true,
        isCameraMoving: true, // Camera is panning/tilting
      });

      expect(result.state).toBe('NORMAL');
      expect(result.shouldTriggerSos).toBe(false);
    }
  });

  it('Requirement 6: Valid sustained physical fight (>= 85%, >= 2.0s, >= 4 windows) triggers exactly one SOS', () => {
    const cameraId = 'cam_quad';
    let sosTriggerCount = 0;
    let confirmedIncidentId: string | null = null;

    // Simulate 20 consecutive windows (4.0 seconds at 200ms intervals)
    for (let step = 0; step < 20; step++) {
      const result = engine.evaluateWindow({
        cameraId,
        timestamp: 1000 + step * 200,
        rawConfidence: 0.95,
        predictedAction: 'physical_fighting',
        personTrackingIds: [101, 102],
        hasInterpersonalContact: true,
        hasStrikeKinematics: true,
      });

      if (result.shouldTriggerSos) {
        sosTriggerCount++;
        confirmedIncidentId = result.incidentId;
      }
    }

    // Must trigger exactly once (debounce cooldown prevents duplicate alarms)
    expect(sosTriggerCount).toBe(1);
    expect(confirmedIncidentId).not.toBeNull();
  });

  it('Requirement 7: Independent cameras maintain separate incident states', () => {
    const camA = 'cam_east';
    const camB = 'cam_west';

    // Cam A has normal activity
    const resA = engine.evaluateWindow({
      cameraId: camA,
      timestamp: 1000,
      rawConfidence: 0.10,
      predictedAction: 'walking',
      personTrackingIds: [1],
      hasInterpersonalContact: false,
      hasStrikeKinematics: false,
    });

    expect(resA.state).toBe('NORMAL');

    // Cam B has fight sustained for >= 2.0s after EMA smoothing (20 windows = 4.0s)
    let triggeredB = false;
    for (let step = 0; step < 20; step++) {
      const resB = engine.evaluateWindow({
        cameraId: camB,
        timestamp: 1000 + step * 200,
        rawConfidence: 0.96,
        predictedAction: 'physical_fighting',
        personTrackingIds: [201, 202],
        hasInterpersonalContact: true,
        hasStrikeKinematics: true,
      });
      if (resB.shouldTriggerSos) triggeredB = true;
    }

    expect(triggeredB).toBe(true);
  });
});
