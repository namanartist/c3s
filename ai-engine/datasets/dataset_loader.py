"""
Dataset Ingestion and Standardization Pipeline for CCTV Violence Detection.
Supports RWF-2000, UCF-Crime, RLVS, and synthetic hard negatives.
"""

from pathlib import Path
from typing import List, Tuple, Dict, Any, Optional
import os
import random
import cv2
import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader

from preprocessing.frame_extractor import FrameExtractor
from preprocessing.optical_flow import DenseOpticalFlowExtractor
from preprocessing.augmentations import VideoAugmentor
from config.categories import ViolenceCategory, CATEGORY_TO_INDEX


class CCTVViolenceDataset(Dataset):
    """
    Video clip dataset loading 16-frame sequences, computing Farneback flow on the fly
    or loading pre-computed spatial and temporal features.
    """
    def __init__(
        self,
        samples: List[Dict[str, Any]],
        sequence_length: int = 16,
        augment: bool = False
    ):
        self.samples = samples
        self.sequence_length = sequence_length
        self.augment = augment

        self.extractor = FrameExtractor(sequence_length=sequence_length)
        self.flow_extractor = DenseOpticalFlowExtractor()
        self.augmentor = VideoAugmentor()

    def __len__(self) -> int:
        return len(self.samples)

    def _read_video_frames(self, video_path: str) -> List[np.ndarray]:
        cap = cv2.VideoCapture(str(video_path))
        frames = []
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            frames.append(frame)
        cap.release()
        return frames

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor, int]:
        sample = self.samples[idx]
        video_path = sample["path"]
        label_category = sample["category"]
        label_idx = CATEGORY_TO_INDEX[label_category]

        frames = self._read_video_frames(video_path)
        if len(frames) == 0:
            # Fallback zero frames if video is corrupted
            dummy = np.zeros((224, 224, 3), dtype=np.uint8)
            frames = [dummy] * self.sequence_length

        if self.augment:
            is_fight = label_category in [ViolenceCategory.CONFIRMED_FIGHT, ViolenceCategory.PHYSICAL_AGGRESSION]
            frames = self.augmentor.augment_sequence(frames, is_fight=is_fight)

        rgb_list, rgb_tensor = self.extractor.extract_uniform_sequence(frames)
        flow_tensor, _ = self.flow_extractor.extract_sequence_flow(rgb_list)

        # Squeeze batch dimension added by extract_uniform_sequence
        return rgb_tensor.squeeze(0), flow_tensor.squeeze(0), label_idx


def discover_video_dataset(
    dataset_root: Path,
    splits: Tuple[str, ...] = ("train", "val", "test")
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Scans a standardized dataset directory structure:
    root/
      train/
        fight/
        non_fight/
      val/
        fight/
        non_fight/
      test/
        fight/
        non_fight/
    """
    datasets = {s: [] for s in splits}
    valid_exts = {".mp4", ".avi", ".mov", ".mkv"}

    for split in splits:
        split_dir = dataset_root / split
        if not split_dir.exists():
            continue

        for cat_dir in split_dir.iterdir():
            if not cat_dir.is_dir():
                continue
            name_lower = cat_dir.name.lower()
            if "fight" in name_lower and "non" not in name_lower:
                category = ViolenceCategory.CONFIRMED_FIGHT
            else:
                category = ViolenceCategory.NORMAL

            for f in cat_dir.iterdir():
                if f.suffix.lower() in valid_exts:
                    datasets[split].append({
                        "path": str(f),
                        "category": category,
                        "source": dataset_root.name
                    })

    return datasets
