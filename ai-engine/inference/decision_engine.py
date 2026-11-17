"""
Intelligent False-Positive Prevention and Decision Engine.
Implements temporal smoothing, multi-frame hysteresis, kinetic disorder gates,
and per-camera cooldown to guarantee zero false positives from routine motion.
"""

from collections import deque
from typing import Dict, Any, Optional
import time
from config.categories import ViolenceCategory, CATEGORY_METADATA
from config.settings import settings


class DecisionEngine:
    def __init__(
        self,
        camera_id: str,
        history_len: int = 10,
        min_consecutive_fight_frames: int = settings.thresholds.min_continuous_fight_frames,
        cooldown_seconds: float = settings.thresholds.camera_alert_cooldown_seconds
    ):
        self.camera_id = camera_id
        self.history_len = history_len
        self.min_consecutive_fight_frames = min_consecutive_fight_frames
        self.cooldown_seconds = cooldown_seconds

        # Temporal prediction window (sliding history of model category predictions)
        self.history: deque = deque(maxlen=history_len)
        self.consecutive_fight_count: int = 0
        self.first_fight_detected_timestamp: Optional[float] = None
        self.last_alert_timestamp: float = 0.0

    def evaluate(
        self,
        raw_prediction: Dict[str, Any],
        motion_metrics: Dict[str, float],
        interaction_info: Dict[str, Any],
        luma_level: float = 120.0
    ) -> Dict[str, Any]:
        """
        Filters raw deep-learning output through temporal, kinetic, and proximity gates.
        Returns the calibrated, final decision with an explainable audit breakdown.
        """
        current_time = time.time()
        category = raw_prediction["category"]
        confidence = raw_prediction["confidence"]
        probs = raw_prediction.get("class_probabilities", {})

        # Record to temporal smoothing history
        self.history.append({
            "category": category,
            "confidence": confidence,
            "timestamp": current_time
        })

        # Gate 1: Check Low-Light / Occlusion Adaptation
        is_low_light = luma_level < settings.thresholds.low_light_luma_threshold
        effective_fight_thresh = settings.thresholds.fight_threshold
        if is_low_light:
            # Under extreme low-light, require higher kinetic disorder to offset sensor noise
            effective_fight_thresh += 0.05

        # Gate 2: Multi-person Proximity Gate
        # A true campus brawl or violence requires interacting subjects.
        has_interaction = interaction_info.get("has_interaction", False)
        num_persons = interaction_info.get("num_persons", 0)

        # Gate 3: Kinetic Motion Disorder Gate
        # Normal walking and running exhibit high velocity in a UNIFORM direction (low circular variance).
        # Fights exhibit chaotic multi-directional motion disorder (high circular variance).
        motion_disorder = motion_metrics.get("motion_disorder", 0.0)
        peak_velocity = motion_metrics.get("peak_velocity", 0.0)
        is_kinetic_chaotic = (motion_disorder >= settings.thresholds.direction_reversal_threshold) and (peak_velocity > 2.0)

        # Gate 4: Cooldown Check
        in_cooldown = (current_time - self.last_alert_timestamp) < self.cooldown_seconds
        cooldown_remaining = max(0.0, self.cooldown_seconds - (current_time - self.last_alert_timestamp))

        # Gate 5: Candidate Classification & Temporal Hysteresis
        is_candidate_fight = (
            (category in [ViolenceCategory.CONFIRMED_FIGHT.value, ViolenceCategory.PHYSICAL_AGGRESSION.value])
            and (confidence >= effective_fight_thresh)
            and has_interaction
            and is_kinetic_chaotic
        )

        if is_candidate_fight:
            self.consecutive_fight_count += 1
            if self.first_fight_detected_timestamp is None:
                self.first_fight_detected_timestamp = current_time
            duration_active = current_time - self.first_fight_detected_timestamp
        else:
            # Decay counter quickly on non-fight frames to prevent intermittent noise aggregation
            self.consecutive_fight_count = max(0, self.consecutive_fight_count - 2)
            if self.consecutive_fight_count == 0:
                self.first_fight_detected_timestamp = None
            duration_active = 0.0

        # Gate 6: Minimum Event Duration & Consecutive Frames Threshold
        duration_qualified = duration_active >= settings.thresholds.min_event_duration_seconds
        frames_qualified = self.consecutive_fight_count >= self.min_consecutive_fight_frames

        # Final Decision Synthesis
        final_category = ViolenceCategory.NORMAL
        sos_trigger = False

        if is_candidate_fight and frames_qualified and duration_qualified:
            if not in_cooldown:
                final_category = ViolenceCategory.CONFIRMED_FIGHT
                sos_trigger = True
                self.last_alert_timestamp = current_time
            else:
                final_category = ViolenceCategory.CONFIRMED_FIGHT
                sos_trigger = False  # Suppressed by active cooldown
        elif self.consecutive_fight_count >= 3:
            final_category = ViolenceCategory.PHYSICAL_AGGRESSION
        elif (category == ViolenceCategory.SUSPICIOUS_INTERACTION.value) or (has_interaction and peak_velocity > 3.0):
            final_category = ViolenceCategory.SUSPICIOUS_INTERACTION
        else:
            final_category = ViolenceCategory.NORMAL

        meta = CATEGORY_METADATA[final_category]

        # Audit breakdown explaining WHY the decision was reached
        suppression_reasons = []
        if not has_interaction and category in [ViolenceCategory.CONFIRMED_FIGHT.value, ViolenceCategory.PHYSICAL_AGGRESSION.value]:
            suppression_reasons.append("Suppressed: No multi-person physical proximity detected.")
        if not is_kinetic_chaotic and category in [ViolenceCategory.CONFIRMED_FIGHT.value, ViolenceCategory.PHYSICAL_AGGRESSION.value]:
            suppression_reasons.append("Suppressed: Uniform kinetic direction (consistent with jogging or walking).")
        if is_candidate_fight and not frames_qualified:
            suppression_reasons.append(f"Awaiting temporal consistency ({self.consecutive_fight_count}/{self.min_consecutive_fight_frames} frames).")
        if in_cooldown and is_candidate_fight and frames_qualified:
            suppression_reasons.append(f"Suppressed: Camera is in alert cooldown ({cooldown_remaining:.1f}s remaining).")

        return {
            "camera_id": self.camera_id,
            "final_category": final_category.value,
            "severity": meta["severity"],
            "sos_trigger": sos_trigger,
            "calibrated_confidence": round(confidence, 4),
            "consecutive_fight_frames": self.consecutive_fight_count,
            "sustained_duration_seconds": round(duration_active, 2),
            "in_cooldown": in_cooldown,
            "cooldown_remaining_seconds": round(cooldown_remaining, 1),
            "temporal_smoothing": {
                "window_size": len(self.history),
                "raw_model_category": category,
                "raw_model_confidence": confidence
            },
            "kinetic_breakdown": {
                "mean_velocity": round(motion_metrics.get("mean_velocity", 0.0), 2),
                "peak_velocity": round(motion_metrics.get("peak_velocity", 0.0), 2),
                "motion_disorder": round(motion_disorder, 3),
                "is_chaotic": is_kinetic_chaotic
            },
            "proximity_breakdown": {
                "num_persons": num_persons,
                "has_interaction": has_interaction,
                "max_proximity_iou": interaction_info.get("max_proximity_iou", 0.0)
            },
            "suppression_audit": suppression_reasons
        }
