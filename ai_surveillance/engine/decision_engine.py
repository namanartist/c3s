"""
ai_surveillance/engine/decision_engine.py
Stage 6: Dedicated SOS Decision & Threat Evaluation Engine.

Enforces strict separation between ordinary human movements and genuine physical aggression:
- Three Classification States: NORMAL, SUSPICIOUS, CONFIRMED_AGGRESSION.
- Multi-Window Temporal Consistency across sliding analysis windows.
- Minimum Fight Confidence Threshold (0.85).
- Minimum Continuous Duration Threshold (2.0 seconds).
- Multi-Person Interaction & Contact Verification (single-person movement is never flagged as fighting).
- Exponential Moving Average Temporal Smoothing.
- Cooldown & Duplicate Alert Suppression (30s).
- Structured Confidence and Temporal Logging for every analysis window.
"""

import time
import uuid
from typing import Dict, List, Optional, Tuple, NamedTuple
from ai_surveillance.config.settings import settings
from ai_surveillance.config.categories import (
    ActionCategory,
    ClassificationState,
    SeverityLevel,
    AGGRESSIVE_CATEGORIES,
    BENIGN_ACTIVITIES
)


class DecisionEvaluation(NamedTuple):
    should_alert: bool
    should_trigger_sos: bool
    incident_payload: Optional[dict]
    state: ClassificationState
    log_record: dict

    # Support backwards compatibility unpacking: (should_alert, should_trigger_sos, payload)
    def __iter__(self):
        return iter((self.should_alert, self.should_trigger_sos, self.incident_payload))


class SosDecisionEngine:
    """
    Dedicated SOS Decision Engine separate from the AI inference model.
    Evaluates temporal sequence consistency and triggers SOS ONLY on reliable physical aggression.
    """
    def __init__(
        self,
        alert_threshold: float = settings.ALERT_CONFIDENCE_THRESHOLD,
        sos_threshold: float = settings.SOS_DISPATCH_THRESHOLD,
        min_duration_seconds: float = settings.MIN_CONTINUOUS_DURATION_SECONDS,
        min_consecutive_windows: int = settings.MIN_CONSECUTIVE_WINDOWS,
        debounce_seconds: int = settings.INCIDENT_DEBOUNCE_SECONDS,
        confirmation_frames: int = settings.AGGRESSION_CONFIRMATION_FRAMES,
        require_contact: bool = settings.REQUIRE_PHYSICAL_CONTACT
    ):
        self.alert_threshold = alert_threshold
        self.sos_threshold = sos_threshold
        self.min_duration_seconds = min_duration_seconds
        self.min_consecutive_windows = min_consecutive_windows
        self.debounce_seconds = debounce_seconds
        self.confirmation_frames = confirmation_frames
        self.require_contact = require_contact

        # Per-camera state tracking
        self.last_sos_time_by_camera: Dict[str, float] = {}
        self.consecutive_aggressive_frames: Dict[str, int] = {}
        self.smoothed_confidence_by_camera: Dict[str, float] = {}
        self.aggression_start_time: Dict[str, Optional[float]] = {}
        self.window_history_by_camera: Dict[str, List[bool]] = {}

    def reset_camera(self, camera_id: str):
        """Resets temporal tracking state for a camera."""
        self.consecutive_aggressive_frames[camera_id] = 0
        self.smoothed_confidence_by_camera[camera_id] = 0.0
        self.aggression_start_time[camera_id] = None
        self.window_history_by_camera[camera_id] = []

    def evaluate_threat(
        self,
        camera_id: str,
        predicted_category: ActionCategory,
        raw_confidence: float,
        kinematic_flags: dict,
        pairwise_contacts: list,
        person_tracking_ids: Optional[List[int]] = None
    ) -> DecisionEvaluation:
        """
        Evaluates whether the current temporal analysis window qualifies as:
        - NORMAL: Ordinary movement, continue monitoring, NO SOS.
        - SUSPICIOUS: Uncertain or potentially elevated movement, analyze next window, NO SOS.
        - CONFIRMED_AGGRESSION: Persistent violent altercation meeting all strict criteria, TRIGGER SOS.
        """
        now = time.time()
        tracking_ids = person_tracking_ids or [1]
        num_people = len(tracking_ids)
        is_aggressive_category = predicted_category in AGGRESSIVE_CATEGORIES

        # 1. Exponential moving average temporal smoothing
        prev_smooth = self.smoothed_confidence_by_camera.get(camera_id, raw_confidence)
        alpha = settings.AGGRESSION_SCORE_SMOOTHING
        smoothed_conf = prev_smooth * (1.0 - alpha) + raw_confidence * alpha
        self.smoothed_confidence_by_camera[camera_id] = smoothed_conf

        normal_conf = round(max(0.0, 1.0 - smoothed_conf), 3)
        aggression_conf = round(float(smoothed_conf), 3)

        # 2. Multi-Person Interaction & Kinematic Strike Verification
        # Single individuals performing hand gestures, walking, running, stretching, waving,
        # or standing up must NEVER trigger confirmed aggression.
        has_physical_contact = any(p.get("is_in_contact", False) for p in pairwise_contacts) if pairwise_contacts else False
        has_strike_kinematics = bool(
            kinematic_flags.get("is_rapid_punch_motion", False) or
            kinematic_flags.get("is_rapid_kick_motion", False) or
            kinematic_flags.get("is_posture_collapse", False)
        )

        # Contact check requirement: if multiple people are tracked, require pairwise contact or close assault
        interaction_verified = (num_people >= 2 and has_physical_contact) or not self.require_contact

        # Negative class protection: if predicted category is explicitly normal or only 1 person
        is_normal_activity = (
            predicted_category in {
                ActionCategory.WALKING,
                ActionCategory.RUNNING,
                ActionCategory.STANDING_SITTING,
                ActionCategory.HAND_GESTURES,
                ActionCategory.TURNING_AROUND,
                ActionCategory.SPORTS_DANCING,
                ActionCategory.FRIENDLY_INTERACTION,
                ActionCategory.NORMAL_INTERACTION
            } or
            (num_people <= 1 and not kinematic_flags.get("is_weapon_detected", False))
        )

        # 3. Determine Candidate Threat Qualification
        if is_normal_activity:
            qualifies_as_candidate = False
            rejection_reason = "Normal activity or single-person movement (no multi-person combat contact)"
        elif not is_aggressive_category:
            qualifies_as_candidate = False
            rejection_reason = f"Non-aggressive category ({predicted_category.value})"
        elif smoothed_conf < self.alert_threshold:
            qualifies_as_candidate = False
            rejection_reason = f"Confidence {smoothed_conf:.2f} below alert threshold {self.alert_threshold:.2f}"
        elif not (has_strike_kinematics or has_physical_contact):
            qualifies_as_candidate = False
            rejection_reason = "No combat strike kinematics or physical contact detected"
        else:
            qualifies_as_candidate = True
            rejection_reason = None

        # 4. Temporal Multi-Window Persistence Tracking
        history = self.window_history_by_camera.setdefault(camera_id, [])
        history.append(qualifies_as_candidate)
        if len(history) > 10:
            history.pop(0)

        # Temporal consistency score across recent analysis windows
        temporal_consistency = round(sum(history) / len(history), 2) if history else 0.0

        if qualifies_as_candidate:
            self.consecutive_aggressive_frames[camera_id] = self.consecutive_aggressive_frames.get(camera_id, 0) + 1
            if self.aggression_start_time.get(camera_id) is None:
                self.aggression_start_time[camera_id] = now
        else:
            # Decay streak instead of abrupt drop to tolerate single recoil frame
            current_streak = self.consecutive_aggressive_frames.get(camera_id, 0)
            self.consecutive_aggressive_frames[camera_id] = max(0, current_streak - 1)
            if self.consecutive_aggressive_frames[camera_id] == 0:
                self.aggression_start_time[camera_id] = None

        streak = self.consecutive_aggressive_frames.get(camera_id, 0)
        duration_sec = (now - self.aggression_start_time[camera_id]) if self.aggression_start_time.get(camera_id) else 0.0

        # 5. Debounce & Cooldown Check
        last_sos_t = self.last_sos_time_by_camera.get(camera_id, 0.0)
        in_cooldown = (now - last_sos_t) < self.debounce_seconds

        # 6. Tri-State Classification & SOS Determination
        # Strict Acceptance Criteria:
        # State: CONFIRMED_AGGRESSION only when:
        #   - Confidence >= 0.85 (sos_threshold)
        #   - Continuous duration >= 2.0 seconds
        #   - Streak >= confirmation_frames (6 frames)
        #   - Temporal consistency >= 0.70 across consecutive windows
        #   - Validated interaction/contact
        is_confirmed = (
            qualifies_as_candidate and
            smoothed_conf >= self.sos_threshold and
            duration_sec >= self.min_duration_seconds and
            streak >= self.confirmation_frames and
            temporal_consistency >= 0.70 and
            interaction_verified
        )

        is_suspicious = (
            qualifies_as_candidate or
            (smoothed_conf >= self.alert_threshold and streak >= 2) or
            (is_aggressive_category and smoothed_conf >= 0.50)
        ) and not is_confirmed

        if is_confirmed:
            decision_state = ClassificationState.CONFIRMED_AGGRESSION
            should_alert = True
            should_trigger_sos = not in_cooldown
            sos_reason = "Persistent confirmed physical fighting exceeding duration and confidence gates"
        elif is_suspicious:
            decision_state = ClassificationState.SUSPICIOUS
            should_alert = True
            should_trigger_sos = False
            sos_reason = f"Potentially elevated kinetic interaction (duration={duration_sec:.1f}s, analyzing next sequence)"
        else:
            decision_state = ClassificationState.NORMAL
            should_alert = False
            should_trigger_sos = False
            sos_reason = rejection_reason or "Normal benign activity"

        incident_payload = None
        if should_trigger_sos:
            self.last_sos_time_by_camera[camera_id] = now
            incident_id = f"SOS-{camera_id[-4:] if len(camera_id) >= 4 else camera_id}-{int(now)}-{uuid.uuid4().hex[:6].upper()}"

            if smoothed_conf >= 0.90 or predicted_category in {ActionCategory.PHYSICAL_ASSAULT, ActionCategory.MULTIPLE_PERSON_FIGHTING}:
                severity = SeverityLevel.CRITICAL
            elif smoothed_conf >= 0.82:
                severity = SeverityLevel.HIGH
            else:
                severity = SeverityLevel.MEDIUM

            incident_payload = {
                "incident_id": incident_id,
                "camera_id": camera_id,
                "category": predicted_category.value,
                "confidence": aggression_conf,
                "severity": severity.value,
                "timestamp": now,
                "duration_seconds": round(duration_sec, 2),
                "tracking_ids": tracking_ids,
                "temporal_consistency": temporal_consistency,
                "requires_immediate_dispatch": True
            }

        # 7. Confidence & Temporal Logging Record (Section 7)
        log_record = {
            "timestamp": now,
            "camera_id": camera_id,
            "person_tracking_ids": tracking_ids,
            "predicted_action": predicted_category.value,
            "normal_confidence": normal_conf,
            "aggression_confidence": aggression_conf,
            "temporal_consistency": temporal_consistency,
            "decision_state": decision_state.value,
            "duration_seconds": round(duration_sec, 2),
            "sos_decision": "TRIGGERED" if should_trigger_sos else "NOT_TRIGGERED",
            "reason": sos_reason
        }

        return DecisionEvaluation(
            should_alert=should_alert,
            should_trigger_sos=should_trigger_sos,
            incident_payload=incident_payload,
            state=decision_state,
            log_record=log_record
        )
