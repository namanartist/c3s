"""
ai_surveillance/config/categories.py
Defines the detection categories, severity levels, and safe benchmark interactions.
"""

from enum import Enum
from typing import Dict, List, Set


class ClassificationState(str, Enum):
    NORMAL = "NORMAL"
    SUSPICIOUS = "SUSPICIOUS"
    CONFIRMED_AGGRESSION = "CONFIRMED_AGGRESSION"


class ActionCategory(str, Enum):
    # Negative Classes (Normal Human Activities)
    WALKING = "walking"
    RUNNING = "running"
    STANDING_SITTING = "standing_sitting"
    HAND_GESTURES = "hand_gestures"
    TURNING_AROUND = "turning_around"
    SPORTS_DANCING = "sports_dancing"
    FRIENDLY_INTERACTION = "friendly_interaction"
    NORMAL_INTERACTION = "normal_interaction"

    # Positive Classes (Aggressive Activities)
    VERBAL_AGGRESSION = "verbal_aggression"
    AGGRESSIVE_GESTURES = "aggressive_gestures"
    PUSHING_AND_SHOVING = "pushing_and_shoving"
    PUNCHING = "punching"
    KICKING = "kicking"
    SLAPPING = "slapping"
    GRABBING_AND_ATTACKING = "grabbing_and_attacking"
    PHYSICAL_FIGHTING = "physical_fighting"
    MULTIPLE_PERSON_FIGHTING = "multiple_person_fighting"
    CHASING_AND_ATTACKING = "chasing_and_attacking"
    PHYSICAL_ASSAULT = "physical_assault"
    CROWD_AGGRESSION = "crowd_aggression"
    PERSON_FALLING_ALTERCATION = "person_falling_during_altercation"
    POTENTIAL_WEAPON_THREAT = "potential_weapon_threat"


class SeverityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# Categories that represent aggressive behavior qualifying for threat evaluation
AGGRESSIVE_CATEGORIES: Set[ActionCategory] = {
    ActionCategory.AGGRESSIVE_GESTURES,
    ActionCategory.PUSHING_AND_SHOVING,
    ActionCategory.PUNCHING,
    ActionCategory.KICKING,
    ActionCategory.SLAPPING,
    ActionCategory.GRABBING_AND_ATTACKING,
    ActionCategory.PHYSICAL_FIGHTING,
    ActionCategory.MULTIPLE_PERSON_FIGHTING,
    ActionCategory.CHASING_AND_ATTACKING,
    ActionCategory.PHYSICAL_ASSAULT,
    ActionCategory.CROWD_AGGRESSION,
    ActionCategory.PERSON_FALLING_ALTERCATION,
    ActionCategory.POTENTIAL_WEAPON_THREAT,
}

# Explicit mapping of severity to action categories
CATEGORY_SEVERITY_MAP: Dict[ActionCategory, SeverityLevel] = {
    ActionCategory.WALKING: SeverityLevel.LOW,
    ActionCategory.RUNNING: SeverityLevel.LOW,
    ActionCategory.STANDING_SITTING: SeverityLevel.LOW,
    ActionCategory.HAND_GESTURES: SeverityLevel.LOW,
    ActionCategory.TURNING_AROUND: SeverityLevel.LOW,
    ActionCategory.SPORTS_DANCING: SeverityLevel.LOW,
    ActionCategory.FRIENDLY_INTERACTION: SeverityLevel.LOW,
    ActionCategory.NORMAL_INTERACTION: SeverityLevel.LOW,
    ActionCategory.VERBAL_AGGRESSION: SeverityLevel.LOW,
    ActionCategory.AGGRESSIVE_GESTURES: SeverityLevel.MEDIUM,
    ActionCategory.PUSHING_AND_SHOVING: SeverityLevel.MEDIUM,
    ActionCategory.SLAPPING: SeverityLevel.HIGH,
    ActionCategory.PUNCHING: SeverityLevel.HIGH,
    ActionCategory.KICKING: SeverityLevel.HIGH,
    ActionCategory.GRABBING_AND_ATTACKING: SeverityLevel.HIGH,
    ActionCategory.CHASING_AND_ATTACKING: SeverityLevel.HIGH,
    ActionCategory.PERSON_FALLING_ALTERCATION: SeverityLevel.HIGH,
    ActionCategory.PHYSICAL_FIGHTING: SeverityLevel.CRITICAL,
    ActionCategory.MULTIPLE_PERSON_FIGHTING: SeverityLevel.CRITICAL,
    ActionCategory.PHYSICAL_ASSAULT: SeverityLevel.CRITICAL,
    ActionCategory.CROWD_AGGRESSION: SeverityLevel.CRITICAL,
    ActionCategory.POTENTIAL_WEAPON_THREAT: SeverityLevel.CRITICAL,
}

# Benign physical activities that must strictly be discriminated from violence
BENIGN_ACTIVITIES: List[str] = [
    "handshake",
    "friendly_hug",
    "sports_activity",
    "dancing",
    "jogging_running",
    "playful_interaction",
    "accidental_collision"
]

NEGATIVE_CLASSES: List[ActionCategory] = [
    ActionCategory.WALKING,
    ActionCategory.RUNNING,
    ActionCategory.STANDING_SITTING,
    ActionCategory.HAND_GESTURES,
    ActionCategory.TURNING_AROUND,
    ActionCategory.SPORTS_DANCING,
    ActionCategory.FRIENDLY_INTERACTION,
    ActionCategory.NORMAL_INTERACTION,
]

POSITIVE_CLASSES: List[ActionCategory] = [
    ActionCategory.PUSHING_AND_SHOVING,
    ActionCategory.PUNCHING,
    ActionCategory.KICKING,
    ActionCategory.SLAPPING,
    ActionCategory.GRABBING_AND_ATTACKING,
    ActionCategory.PHYSICAL_FIGHTING,
    ActionCategory.MULTIPLE_PERSON_FIGHTING,
    ActionCategory.CHASING_AND_ATTACKING,
    ActionCategory.PHYSICAL_ASSAULT,
    ActionCategory.CROWD_AGGRESSION,
    ActionCategory.PERSON_FALLING_ALTERCATION,
]


def is_aggressive_action(action: ActionCategory) -> bool:
    return action in AGGRESSIVE_CATEGORIES

# Numerical index mapping for PyTorch tensor classification
CATEGORY_TO_IDX: Dict[ActionCategory, int] = {
    cat: i for i, cat in enumerate(ActionCategory)
}
IDX_TO_CATEGORY: Dict[int, ActionCategory] = {
    i: cat for cat, i in CATEGORY_TO_IDX.items()
}
NUM_CLASSES: int = len(ActionCategory)

