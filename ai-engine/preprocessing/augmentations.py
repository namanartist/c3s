"""
Data Augmentation for Surveillance Video Sequences.
Applies spatial transformations (flip, crop, color jitter) consistently across temporal frames.
"""

import random
from typing import List
import numpy as np
import cv2


class VideoAugmentor:
    def __init__(self, p_flip: float = 0.5, p_brightness: float = 0.5, p_time_reverse: float = 0.0):
        self.p_flip = p_flip
        self.p_brightness = p_brightness
        self.p_time_reverse = p_time_reverse

    def augment_sequence(self, frames_bgr: List[np.ndarray], is_fight: bool = False) -> List[np.ndarray]:
        """
        Applies coordinated spatial and photometric augmentations across all frames in a clip.
        """
        augmented = [f.copy() for f in frames_bgr]

        # 1. Random Horizontal Flip (invariant to fight/non-fight)
        if random.random() < self.p_flip:
            augmented = [cv2.flip(f, 1) for f in augmented]

        # 2. Random Brightness & Contrast Adjustment (simulates night/glare)
        if random.random() < self.p_brightness:
            alpha = random.uniform(0.7, 1.3)  # Contrast
            beta = random.uniform(-25, 25)    # Brightness
            augmented = [np.clip(alpha * f + beta, 0, 255).astype(np.uint8) for f in augmented]

        # 3. Random Gaussian Noise
        if random.random() < 0.2:
            noise_sigma = random.uniform(2.0, 8.0)
            augmented = [
                np.clip(f + np.random.normal(0, noise_sigma, f.shape), 0, 255).astype(np.uint8)
                for f in augmented
            ]

        # 4. Temporal reverse (only safe for non-fight, or reversible fights)
        if is_fight and random.random() < self.p_time_reverse:
            augmented = augmented[::-1]

        return augmented
