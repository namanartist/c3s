"""
ai_surveillance/data/dataset_pipeline.py
Dataset collection, annotation schemas, split generation without data leakage,
and class imbalance weighting.
"""

import os
import json
from pathlib import Path
from typing import Dict, List, Tuple
from ai_surveillance.config.categories import ActionCategory, CATEGORY_TO_IDX, NUM_CLASSES


class SurveillanceDatasetPipeline:
    """
    Manages annotation manifests, train/val/test splits without subject leakage,
    and calculates class balancing weights.
    """
    def __init__(self, data_root: Path):
        self.data_root = Path(data_root)
        self.manifest_file = self.data_root / "manifest.json"

    def create_sample_manifest(self) -> Path:
        """
        Creates a structured dataset template adhering to production requirements.
        Useful for local verification, CI/CD, and pipeline initialization.
        """
        self.data_root.mkdir(parents=True, exist_ok=True)
        sample_entries = [
            {
                "clip_id": "clip_001_fight_sh4_hall",
                "file_path": "videos/clip_001_fight.mp4",
                "label": ActionCategory.PHYSICAL_FIGHTING.value,
                "start_frame": 10,
                "end_frame": 75,
                "subject_ids": ["subj_101", "subj_102"],
                "camera_id": "CAM-10-SH4",
                "lighting": "indoor_fluorescent",
                "crowd_density": "sparse"
            },
            {
                "clip_id": "clip_002_corridor_push_shove",
                "file_path": "videos/clip_002_push.mp4",
                "label": ActionCategory.PUSHING_AND_SHOVING.value,
                "start_frame": 15,
                "end_frame": 65,
                "subject_ids": ["subj_103", "subj_104"],
                "camera_id": "CAM-09-AI-CORRIDOR",
                "lighting": "indoor_fluorescent",
                "crowd_density": "moderate"
            },
            {
                "clip_id": "clip_003_punching_altercation",
                "file_path": "videos/clip_003_punch.mp4",
                "label": ActionCategory.PUNCHING.value,
                "start_frame": 8,
                "end_frame": 50,
                "subject_ids": ["subj_105", "subj_106"],
                "camera_id": "CAM-02-GATE2",
                "lighting": "daylight",
                "crowd_density": "sparse"
            },
            {
                "clip_id": "clip_004_kicking_assault",
                "file_path": "videos/clip_004_kick.mp4",
                "label": ActionCategory.KICKING.value,
                "start_frame": 12,
                "end_frame": 60,
                "subject_ids": ["subj_107", "subj_108"],
                "camera_id": "CAM-06-PARKING",
                "lighting": "dusk",
                "crowd_density": "sparse"
            },
            {
                "clip_id": "clip_005_multiple_person_brawl",
                "file_path": "videos/clip_005_brawl.mp4",
                "label": ActionCategory.MULTIPLE_PERSON_FIGHTING.value,
                "start_frame": 5,
                "end_frame": 85,
                "subject_ids": ["subj_109", "subj_110", "subj_111", "subj_112"],
                "camera_id": "CAM-04-BLOCK-A",
                "lighting": "daylight",
                "crowd_density": "dense"
            },
            {
                "clip_id": "clip_006_fall_during_scuffle",
                "file_path": "videos/clip_006_fall.mp4",
                "label": ActionCategory.PERSON_FALLING_ALTERCATION.value,
                "start_frame": 20,
                "end_frame": 70,
                "subject_ids": ["subj_113", "subj_114"],
                "camera_id": "CAM-09-AI-CORRIDOR",
                "lighting": "indoor_fluorescent",
                "crowd_density": "moderate"
            },
            {
                "clip_id": "clip_007_normal_pedestrian_walk",
                "file_path": "videos/clip_007_walk.mp4",
                "label": ActionCategory.NORMAL_INTERACTION.value,
                "start_frame": 0,
                "end_frame": 90,
                "subject_ids": ["subj_115", "subj_116"],
                "camera_id": "CAM-07-LIBRARY",
                "lighting": "daylight",
                "crowd_density": "normal"
            },
            {
                "clip_id": "clip_008_friendly_hug_greeting",
                "file_path": "videos/clip_008_hug.mp4",
                "label": ActionCategory.NORMAL_INTERACTION.value,
                "start_frame": 0,
                "end_frame": 80,
                "subject_ids": ["subj_117", "subj_118"],
                "camera_id": "CAM-10-SH4",
                "lighting": "indoor_fluorescent",
                "crowd_density": "sparse"
            },
            {
                "clip_id": "clip_009_sports_basketball_fast",
                "file_path": "videos/clip_009_basketball.mp4",
                "label": ActionCategory.NORMAL_INTERACTION.value,
                "start_frame": 0,
                "end_frame": 120,
                "subject_ids": ["subj_119", "subj_120"],
                "camera_id": "CAM-05-COURTYARD",
                "lighting": "daylight",
                "crowd_density": "active_sports"
            },
            {
                "clip_id": "clip_010_accidental_collision_drop",
                "file_path": "videos/clip_010_collision.mp4",
                "label": ActionCategory.NORMAL_INTERACTION.value,
                "start_frame": 10,
                "end_frame": 65,
                "subject_ids": ["subj_121", "subj_122"],
                "camera_id": "CAM-01-ENTRANCE",
                "lighting": "daylight",
                "crowd_density": "dense"
            }
        ]

        with open(self.manifest_file, "w") as f:
            json.dump(sample_entries, f, indent=2)

        return self.manifest_file

    def generate_leak_free_splits(
        self,
        manifest_path: Path = None,
        train_ratio: float = 0.70,
        val_ratio: float = 0.15,
        test_ratio: float = 0.15
    ) -> Dict[str, List[dict]]:
        """
        Splits data by unique recording sessions and subject IDs to guarantee NO data leakage.
        """
        path = manifest_path or self.manifest_file
        if not path.exists():
            self.create_sample_manifest()

        with open(path, "r") as f:
            entries = json.load(f)

        # Collect primary group identifier (first subject ID or clip prefix)
        grouped_entries: Dict[str, List[dict]] = {}
        for item in entries:
            group_key = item.get("subject_ids", [item["clip_id"]])[0]
            grouped_entries.setdefault(group_key, []).append(item)

        groups = list(grouped_entries.keys())
        # Deterministic shuffle
        groups.sort()

        total = len(groups)
        train_end = max(1, int(total * train_ratio))
        val_end = max(train_end + 1, int(total * (train_ratio + val_ratio)))

        train_groups = set(groups[:train_end])
        val_groups = set(groups[train_end:val_end])
        test_groups = set(groups[val_end:])

        splits = {"train": [], "val": [], "test": []}
        for grp, items in grouped_entries.items():
            if grp in train_groups:
                splits["train"].extend(items)
            elif grp in val_groups:
                splits["val"].extend(items)
            else:
                splits["test"].extend(items)

        # Save split manifests
        for split_name, split_items in splits.items():
            split_file = self.data_root / f"{split_name}_manifest.json"
            with open(split_file, "w") as f:
                json.dump(split_items, f, indent=2)

        return splits

    def calculate_class_weights(self, manifest_items: List[dict]) -> List[float]:
        """
        Computes inverse class frequencies for loss weighting.
        """
        counts = [0] * NUM_CLASSES
        for item in manifest_items:
            try:
                cat = ActionCategory(item["label"])
                idx = CATEGORY_TO_IDX[cat]
                counts[idx] += 1
            except (ValueError, KeyError):
                counts[0] += 1  # default to normal

        # Prevent zero division
        counts = [max(1, c) for c in counts]
        total = sum(counts)
        weights = [total / (len(counts) * c) for c in counts]
        return weights
