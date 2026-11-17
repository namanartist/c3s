"""
Classification Categories for C3S Violence and Fight Detection Engine.
Defines category IDs, labels, alert levels, and description.
"""

from enum import Enum
from typing import Dict, Any


class ViolenceCategory(str, Enum):
    NORMAL = "NORMAL"
    SUSPICIOUS_INTERACTION = "SUSPICIOUS_INTERACTION"
    PHYSICAL_AGGRESSION = "PHYSICAL_AGGRESSION"
    CONFIRMED_FIGHT = "CONFIRMED_FIGHT"


CATEGORY_METADATA: Dict[ViolenceCategory, Dict[str, Any]] = {
    ViolenceCategory.NORMAL: {
        "index": 0,
        "label": "Normal Human Activity",
        "severity": "LOW",
        "sos_trigger": False,
        "color": "#10B981",  # Green
        "description": "Routine campus motion: walking, jogging, friendly conversation, seated, transit."
    },
    ViolenceCategory.SUSPICIOUS_INTERACTION: {
        "index": 1,
        "label": "Suspicious Interaction",
        "severity": "MEDIUM",
        "sos_trigger": False,
        "color": "#F59E0B",  # Amber
        "description": "Close confrontational posturing, agitated gestures, crowding, or sudden aggressive convergence."
    },
    ViolenceCategory.PHYSICAL_AGGRESSION: {
        "index": 2,
        "label": "Physical Aggression",
        "severity": "HIGH",
        "sos_trigger": False,
        "color": "#EF4444",  # Red
        "description": "Active physical contact detected (shoving, pushing, grabbing) requiring visual confirmation."
    },
    ViolenceCategory.CONFIRMED_FIGHT: {
        "index": 3,
        "label": "Confirmed Violence / Fight",
        "severity": "CRITICAL",
        "sos_trigger": True,
        "color": "#7F1D1D",  # Dark Crimson
        "description": "Multi-frame verified violent altercation: punches, kicks, grapple, violent ground struggle."
    }
}

INDEX_TO_CATEGORY = {meta["index"]: cat for cat, meta in CATEGORY_METADATA.items()}
CATEGORY_TO_INDEX = {cat: meta["index"] for cat, meta in CATEGORY_METADATA.items()}
NUM_CLASSES = len(ViolenceCategory)
