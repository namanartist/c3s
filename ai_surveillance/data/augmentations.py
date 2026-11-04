"""
ai_surveillance/data/augmentations.py
Spatio-Temporal Data Augmentation for Video Action Recognition.
Applies consistent spatial transforms across all frames of a clip and temporal perturbations.
"""

import random
import torch
import numpy as np


class VideoClipAugmentor:
    """
    Applies consistent transformations across temporal video clips [T, C, H, W].
    Ensures spatial coherence across frames.
    """
    def __init__(
        self,
        horizontal_flip_prob: float = 0.5,
        temporal_subsample: bool = True,
        color_jitter: bool = True
    ):
        self.horizontal_flip_prob = horizontal_flip_prob
        self.temporal_subsample = temporal_subsample
        self.color_jitter = color_jitter

    def __call__(self, clip: torch.Tensor, pose_data: np.ndarray = None) -> tuple:
        """
        clip: [Time, Channels, Height, Width] as float tensor [0, 1]
        pose_data: [Time, NumKeypoints, 2] (optional)
        """
        T, C, H, W = clip.shape

        # 1. Consistent Spatial Horizontal Flip
        if random.random() < self.horizontal_flip_prob:
            clip = torch.flip(clip, dims=[-1])
            if pose_data is not None:
                # Flip x coordinates: 1.0 - x or W - x
                pose_data = pose_data.copy()
                pose_data[..., 0] = W - pose_data[..., 0]

        # 2. Random Brightness and Contrast Scaling
        if self.color_jitter:
            brightness_factor = random.uniform(0.85, 1.15)
            contrast_factor = random.uniform(0.9, 1.1)
            clip = torch.clamp((clip * brightness_factor - 0.5) * contrast_factor + 0.5, 0.0, 1.0)

        # 3. Temporal Subsampling / Jitter
        if self.temporal_subsample and T > 16:
            # Random starting index with stride 1 or 2
            start = random.randint(0, max(0, T - 16))
            clip = clip[start : start + 16]
            if pose_data is not None:
                pose_data = pose_data[start : start + 16]

        return clip, pose_data

