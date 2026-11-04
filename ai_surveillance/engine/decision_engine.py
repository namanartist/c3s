"""
ai_surveillance/engine/decision_engine.py
Stage 6: SOS Decision & Threat Evaluation Engine.
Evaluates aggression probability, persistence duration, incident severity,
and triggers automatic emergency SOS with cooldown suppression.
"""

import time
import uuid
from typing import Dict, Optional, Tuple
from ai_surveillance.config.settings import settings
from ai_surveillance.config.categories import ActionCategory, SeverityLevel, AGGRESSIVE_CATEGORIES


class SosDecisionEngine:
    """
    Evaluates temporal aggression confidence and triggers verified SOS dispatches.
    Suppresses single-frame optical glitches, accidental bumps, and benign sports.
    """
    def __init__(
        self,
        alert_threshold: float = settings.ALERT_CONFIDENCE_THRESHOLD,
        sos_threshold: float = settings.SOS_DISPATCH_THRESHOLD,
        debounce_seconds: int = settings.INCIDENT_DEBOUNCE_SECONDS,
        confirmation_frames: int = settings.AGGRESSION_CONFIRMATION_FRAMES
    ):
        self.alert_threshold = alert_threshold
        self.sos_threshold = sos_threshold
        self.debounce_seconds = debounce_seconds
        self.confirmation_frames = confirmation_frames

        # State tracking per camera
        self.last_sos_time_by_camera: Dict[str, float] = {}
        self.consecutive_aggressive_frames: Dict[str, int] = {}
        self.smoothed_confidence_by_camera: Dict[str, float] = {}
        self.aggression_start_time: Dict[str, Optional[float]] = {}

    def evaluate_threat(
        self,
        camera_id: str,
        predicted_category: ActionCategory,
        raw_confidence: float,
        kinematic_flags: dict,
        pairwise_contacts: list
    ) -> Tuple[bool, bool, Optional[dict]]:
        """
        Evaluates whether current frame qualifies for Warning Alert or Full Emergency SOS.
        Returns: (should_alert, should_trigger_sos, incident_payload)
        """
        now = time.time()
        is_aggressive_category = predicted_category in AGGRESSIVE_CATEGORIES

        # 1. Exponential moving average temporal smoothing
        prev_smooth = self.smoothed_confidence_by_camera.get(camera_id, raw_confidence)
        smoothed_conf = prev_smooth * (1.0 - settings.AGGRESSION_SCORE_SMOOTHING) + raw_confidence * settings.AGGRESSION_SCORE_SMOOTHING
        self.smoothed_confidence_by_camera[camera_id] = smoothed_conf

        # 2. Discriminate benign physical interactions (sports/jogging vs violence)
        # Violent fights require close physical interaction + explosive kinetic strike velocities
        has_physical_contact = any(p.get("is_in_contact", False) for p in pairwise_contacts) if pairwise_contacts else True
        has_strike_kinematics = (
            kinematic_flags.get("is_rapid_punch_motion", False) or
            kinematic_flags.get("is_rapid_kick_motion", False) or
            kinematic_flags.get("is_posture_collapse", False)
        )

        qualifies_as_real_aggression = is_aggressive_category and (
            smoothed_conf >= self.sos_threshold or (smoothed_conf >= 0.70 and has_strike_kinematics and has_physical_contact)
        )

        # 3. Track continuous persistence
        if qualifies_as_real_aggression:
            self.consecutive_aggressive_frames[camera_id] = self.consecutive_aggressive_frames.get(camera_id, 0) + 1
            if self.aggression_start_time.get(camera_id) is None:
                self.aggression_start_time[camera_id] = now
        else:
            self.consecutive_aggressive_frames[camera_id] = 0
            self.aggression_start_time[camera_id] = None

        streak = self.consecutive_aggressive_frames.get(camera_id, 0)
        duration_sec = (now - self.aggression_start_time[camera_id]) if self.aggression_start_time.get(camera_id) else 0.0

        # 4. Debounce check
        last_sos_t = self.last_sos_time_by_camera.get(camera_id, 0.0)
        in_cooldown = (now - last_sos_t) < self.debounce_seconds

        should_alert = smoothed_conf >= self.alert_threshold and streak >= 2
        should_trigger_sos = (
            qualifies_as_real_aggression and
            streak >= self.confirmation_frames and
            not in_cooldown
        )

        incident_payload = None
        if should_trigger_sos:
            self.last_sos_time_by_camera[camera_id] = now
            incident_id = f"SOS-{camera_id[-4:] if len(camera_id) >= 4 else camera_id}-{int(now)}-{uuid.uuid4().hex[:6].upper()}"

            # Calculate threat severity
            if smoothed_conf >= 0.90 or predicted_category in {ActionCategory.PHYSICAL_ASSAULT, ActionCategory.MULTIPLE_PERSON_FIGHTING}:
                severity = SeverityLevel.CRITICAL
            elif smoothed_conf >= 0.80:
                severity = SeverityLevel.HIGH
            else:
                severity = SeverityLevel.MEDIUM

            incident_payload = {
                "incident_id": incident_id,
                "camera_id": camera_id,
                "category": predicted_category.value,
                "confidence": round(float(smoothed_conf), 3),
                "severity": severity.value,
                "timestamp": now,
                "duration_seconds": round(duration_sec, 2),
                "requires_immediate_dispatch": True
            }

        return should_alert, should_trigger_sos, incident_payload

