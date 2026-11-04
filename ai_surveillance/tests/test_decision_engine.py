"""
ai_surveillance/tests/test_decision_engine.py
Unit tests for the SOS decision engine, threat scoring, false positive rejection,
tri-state classification, and temporal consistency verification.
"""

import time
import unittest
from ai_surveillance.config.categories import ActionCategory, ClassificationState, SeverityLevel
from ai_surveillance.engine.decision_engine import SosDecisionEngine


class TestSosDecisionEngine(unittest.TestCase):
    def setUp(self):
        self.engine = SosDecisionEngine(
            alert_threshold=0.70,
            sos_threshold=0.85,
            min_duration_seconds=0.30,  # Scaled for fast unit testing execution
            min_consecutive_windows=3,
            debounce_seconds=5,
            confirmation_frames=3,
            require_contact=True
        )

    def test_normal_walking_rejection(self):
        """1. Normal walking must NEVER trigger SOS and must classify as NORMAL."""
        for _ in range(5):
            eval_res = self.engine.evaluate_threat(
                camera_id="CAM-WALK",
                predicted_category=ActionCategory.WALKING,
                raw_confidence=0.08,
                kinematic_flags={"is_rapid_punch_motion": False},
                pairwise_contacts=[],
                person_tracking_ids=[1]
            )
            self.assertEqual(eval_res.state, ClassificationState.NORMAL)
            self.assertFalse(eval_res.should_trigger_sos)
            self.assertFalse(eval_res.should_alert)
            self.assertIsNone(eval_res.incident_payload)
            self.assertEqual(eval_res.log_record["sos_decision"], "NOT_TRIGGERED")

    def test_normal_running_rejection(self):
        """2. Normal running (high velocity but no physical attack) must NOT trigger SOS."""
        for _ in range(5):
            eval_res = self.engine.evaluate_threat(
                camera_id="CAM-RUN",
                predicted_category=ActionCategory.RUNNING,
                raw_confidence=0.25,
                kinematic_flags={"is_rapid_punch_motion": False},
                pairwise_contacts=[],
                person_tracking_ids=[1]
            )
            self.assertEqual(eval_res.state, ClassificationState.NORMAL)
            self.assertFalse(eval_res.should_trigger_sos)
            self.assertEqual(eval_res.log_record["sos_decision"], "NOT_TRIGGERED")

    def test_ordinary_hand_gestures_rejection(self):
        """3. Ordinary hand movements / waving hands must NOT trigger SOS."""
        for _ in range(5):
            eval_res = self.engine.evaluate_threat(
                camera_id="CAM-GESTURE",
                predicted_category=ActionCategory.HAND_GESTURES,
                raw_confidence=0.20,
                kinematic_flags={"is_rapid_punch_motion": False},
                pairwise_contacts=[],
                person_tracking_ids=[1]
            )
            self.assertEqual(eval_res.state, ClassificationState.NORMAL)
            self.assertFalse(eval_res.should_trigger_sos)

    def test_sports_and_dancing_rejection(self):
        """4. Dancing and sports must NOT trigger SOS."""
        for _ in range(5):
            eval_res = self.engine.evaluate_threat(
                camera_id="CAM-SPORTS",
                predicted_category=ActionCategory.SPORTS_DANCING,
                raw_confidence=0.35,
                kinematic_flags={"is_rapid_punch_motion": False},
                pairwise_contacts=[],
                person_tracking_ids=[1, 2]
            )
            self.assertEqual(eval_res.state, ClassificationState.NORMAL)
            self.assertFalse(eval_res.should_trigger_sos)

    def test_single_frame_glitch_suppression(self):
        """5. A single sudden movement / glitch frame must not trigger SOS."""
        eval_res = self.engine.evaluate_threat(
            camera_id="CAM-GLITCH",
            predicted_category=ActionCategory.PUNCHING,
            raw_confidence=0.92,
            kinematic_flags={"is_rapid_punch_motion": True},
            pairwise_contacts=[{"is_in_contact": True}],
            person_tracking_ids=[1, 2]
        )
        self.assertFalse(eval_res.should_trigger_sos)
        self.assertNotEqual(eval_res.state, ClassificationState.CONFIRMED_AGGRESSION)

    def test_sustained_validated_fighting_sos_trigger(self):
        """6. Sustained and validated fighting with contact must trigger SOS + CONFIRMED_AGGRESSION."""
        self.engine.min_duration_seconds = 0.05  # Short for test
        triggered = False
        final_payload = None

        for _ in range(4):
            eval_res = self.engine.evaluate_threat(
                camera_id="CAM-FIGHT",
                predicted_category=ActionCategory.PHYSICAL_FIGHTING,
                raw_confidence=0.94,
                kinematic_flags={"is_rapid_punch_motion": True},
                pairwise_contacts=[{"is_in_contact": True}],
                person_tracking_ids=[1, 2]
            )
            time.sleep(0.02)
            if eval_res.should_trigger_sos:
                triggered = True
                final_payload = eval_res.incident_payload
                self.assertEqual(eval_res.state, ClassificationState.CONFIRMED_AGGRESSION)
                self.assertEqual(eval_res.log_record["sos_decision"], "TRIGGERED")

        self.assertTrue(triggered)
        self.assertIsNotNone(final_payload)
        self.assertEqual(final_payload["severity"], SeverityLevel.CRITICAL.value)
        self.assertTrue(final_payload["incident_id"].startswith("SOS-"))

    def test_debounce_cooldown(self):
        """7. Subsequent detections within cooldown debounce window must be suppressed."""
        self.engine.min_duration_seconds = 0.01
        # 1. Trigger first SOS
        for _ in range(4):
            self.engine.evaluate_threat(
                camera_id="CAM-COOLDOWN",
                predicted_category=ActionCategory.PHYSICAL_ASSAULT,
                raw_confidence=0.96,
                kinematic_flags={"is_rapid_punch_motion": True},
                pairwise_contacts=[{"is_in_contact": True}],
                person_tracking_ids=[1, 2]
            )

        # 2. Immediate next frame must be suppressed
        eval_next = self.engine.evaluate_threat(
            camera_id="CAM-COOLDOWN",
            predicted_category=ActionCategory.PHYSICAL_ASSAULT,
            raw_confidence=0.96,
            kinematic_flags={"is_rapid_punch_motion": True},
            pairwise_contacts=[{"is_in_contact": True}],
            person_tracking_ids=[1, 2]
        )
        self.assertFalse(eval_next.should_trigger_sos)

    def test_structured_logging_fields(self):
        """8. Every analysis window must produce a complete structured log record."""
        eval_res = self.engine.evaluate_threat(
            camera_id="CAM-LOG",
            predicted_category=ActionCategory.WALKING,
            raw_confidence=0.04,
            kinematic_flags={},
            pairwise_contacts=[],
            person_tracking_ids=[101]
        )
        rec = eval_res.log_record
        required_fields = [
            "timestamp", "camera_id", "person_tracking_ids", "predicted_action",
            "normal_confidence", "aggression_confidence", "temporal_consistency",
            "decision_state", "sos_decision", "reason"
        ]
        for field in required_fields:
            self.assertIn(field, rec)


if __name__ == "__main__":
    unittest.main()
