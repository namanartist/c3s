"""
False Positive Suppression Test Suite.
Validates that normal activities and benign movements NEVER trigger an emergency SOS.
"""

import pytest
from inference.decision_engine import DecisionEngine
from config.categories import ViolenceCategory


def test_walking_motion_suppression():
    """
    Scenario: Two people walking together.
    Kinetics: High velocity, but smooth and uniform direction (low motion disorder).
    Expected: NORMAL, zero SOS alarm.
    """
    engine = DecisionEngine(camera_id="cam-gate-test")

    mock_prediction = {
        "category": ViolenceCategory.PHYSICAL_AGGRESSION.value,  # Spurious raw detection
        "confidence": 0.72,
        "class_probabilities": {"NORMAL": 0.1, "SUSPICIOUS_INTERACTION": 0.18, "PHYSICAL_AGGRESSION": 0.72, "CONFIRMED_FIGHT": 0.0}
    }
    # Motion has uniform direction (circular variance = 0.05, well below chaotic threshold of 0.40)
    motion_metrics = {"mean_velocity": 4.5, "peak_velocity": 5.2, "motion_disorder": 0.05}
    interaction_info = {"has_interaction": True, "num_persons": 2, "max_proximity_iou": 0.08}

    decision = engine.evaluate(mock_prediction, motion_metrics, interaction_info)

    assert decision["sos_trigger"] is False, "SOS must not trigger for uniform walking motion"
    assert decision["final_category"] != ViolenceCategory.CONFIRMED_FIGHT.value
    assert any("Suppressed" in reason for reason in decision["suppression_audit"])


def test_solitary_runner_suppression():
    """
    Scenario: Solitary runner sprinting across the screen.
    Kinetics: Very fast motion, but only 1 person detected.
    Expected: Suppressed by multi-person proximity gate.
    """
    engine = DecisionEngine(camera_id="cam-runner-test")

    mock_prediction = {
        "category": ViolenceCategory.CONFIRMED_FIGHT.value,
        "confidence": 0.92,
        "class_probabilities": {"NORMAL": 0.02, "SUSPICIOUS_INTERACTION": 0.06, "PHYSICAL_AGGRESSION": 0.1, "CONFIRMED_FIGHT": 0.92}
    }
    motion_metrics = {"mean_velocity": 8.5, "peak_velocity": 12.0, "motion_disorder": 0.55}
    interaction_info = {"has_interaction": False, "num_persons": 1, "max_proximity_iou": 0.0}

    decision = engine.evaluate(mock_prediction, motion_metrics, interaction_info)

    assert decision["sos_trigger"] is False, "SOS must never trigger when only 1 individual is present"
    assert any("No multi-person" in r for r in decision["suppression_audit"])


def test_brief_bump_temporal_hysteresis():
    """
    Scenario: Accidental momentary push/bump lasting only 1 or 2 frames.
    Kinetics: Fast and interactive, but ends immediately without sustained duration.
    Expected: Suppressed by minimum consecutive frame & duration gate.
    """
    engine = DecisionEngine(camera_id="cam-bump-test", min_consecutive_fight_frames=6)

    mock_prediction = {
        "category": ViolenceCategory.CONFIRMED_FIGHT.value,
        "confidence": 0.91,
        "class_probabilities": {"NORMAL": 0.03, "CONFIRMED_FIGHT": 0.91}
    }
    motion_metrics = {"mean_velocity": 5.0, "peak_velocity": 6.5, "motion_disorder": 0.65}
    interaction_info = {"has_interaction": True, "num_persons": 2, "max_proximity_iou": 0.12}

    # Frame 1: Detected
    d1 = engine.evaluate(mock_prediction, motion_metrics, interaction_info)
    assert d1["sos_trigger"] is False, "Single frame spike must not trigger SOS"

    # Frame 2: Detected
    d2 = engine.evaluate(mock_prediction, motion_metrics, interaction_info)
    assert d2["sos_trigger"] is False, "2 frames must not trigger SOS"

    # Frame 3: Resumes normal activity
    normal_pred = {"category": ViolenceCategory.NORMAL.value, "confidence": 0.95}
    d3 = engine.evaluate(normal_pred, {"mean_velocity": 1.0, "peak_velocity": 1.2, "motion_disorder": 0.02}, interaction_info)
    assert d3["sos_trigger"] is False
    assert d3["final_category"] == ViolenceCategory.NORMAL.value
