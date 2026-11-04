"""
ai_surveillance/tests/test_decision_engine.py
Unit tests for the SOS decision engine, threat scoring, and glitch suppression.
"""

import time
import unittest
from ai_surveillance.config.categories import ActionCategory, SeverityLevel
from ai_surveillance.engine.decision_engine import SosDecisionEngine


class TestSosDecisionEngine(unittest.TestCase):
    def setUp(self):
        self.engine = SosDecisionEngine(
            alert_threshold=0.70,
            sos_threshold=0.82,
            debounce_seconds=5,
            confirmation_frames=3
        )

    def test_benign_movement_suppression(self):
        # Normal interaction with low confidence should not alert or trigger SOS
        should_alert, should_sos, payload = self.engine.evaluate_threat(
            camera_id="CAM-01",
            predicted_category=ActionCategory.NORMAL_INTERACTION,
            raw_confidence=0.15,
            kinematic_flags={},
            pairwise_contacts=[]
        )
        self.assertFalse(should_alert)
        self.assertFalse(should_sos)
        self.assertIsNone(payload)

    def test_single_frame_glitch_suppression(self):
        # A single frame of high aggression must NOT immediately trigger SOS without confirmation streak
        should_alert, should_sos, payload = self.engine.evaluate_threat(
            camera_id="CAM-01",
            predicted_category=ActionCategory.PUNCHING,
            raw_confidence=0.92,
            kinematic_flags={"is_rapid_punch_motion": True},
            pairwise_contacts=[{"is_in_contact": True}]
        )
        # 1st frame should not trigger full SOS yet
        self.assertFalse(should_sos)

    def test_sustained_fight_sos_trigger(self):
        # 3 consecutive aggressive frames should satisfy the confirmation streak
        triggered = False
        final_payload = None

        for _ in range(3):
            _, should_sos, payload = self.engine.evaluate_threat(
                camera_id="CAM-02",
                predicted_category=ActionCategory.PHYSICAL_FIGHTING,
                raw_confidence=0.94,
                kinematic_flags={"is_rapid_punch_motion": True},
                pairwise_contacts=[{"is_in_contact": True}]
            )
            if should_sos:
                triggered = True
                final_payload = payload

        self.assertTrue(triggered)
        self.assertIsNotNone(final_payload)
        self.assertEqual(final_payload["severity"], SeverityLevel.CRITICAL.value)
        self.assertTrue(final_payload["incident_id"].startswith("SOS-"))

    def test_debounce_cooldown(self):
        # Immediately re-evaluating after SOS must respect debounce window
        # 1. Trigger first SOS
        for _ in range(3):
            self.engine.evaluate_threat(
                camera_id="CAM-03",
                predicted_category=ActionCategory.PHYSICAL_ASSAULT,
                raw_confidence=0.95,
                kinematic_flags={"is_rapid_punch_motion": True},
                pairwise_contacts=[{"is_in_contact": True}]
            )

        # 2. Next frame must be blocked by debounce
        _, should_sos_next, _ = self.engine.evaluate_threat(
            camera_id="CAM-03",
            predicted_category=ActionCategory.PHYSICAL_ASSAULT,
            raw_confidence=0.95,
            kinematic_flags={"is_rapid_punch_motion": True},
            pairwise_contacts=[{"is_in_contact": True}]
        )
        self.assertFalse(should_sos_next)


if __name__ == "__main__":
    unittest.main()

