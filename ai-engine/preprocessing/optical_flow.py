"""
Dense Farneback Optical Flow Computation.
Calculates motion vectors (dx, dy) across sequential video frames.
"""

from typing import List, Tuple
import cv2
import numpy as np
import torch


class DenseOpticalFlowExtractor:
    def __init__(self, target_size: Tuple[int, int] = (224, 224)):
        self.target_size = target_size
        # Farneback hyper-parameters optimized for surveillance video motion
        self.pyr_scale = 0.5
        self.levels = 3
        self.winsize = 15
        self.iterations = 3
        self.poly_n = 5
        self.poly_sigma = 1.2
        self.flags = 0

    def compute_flow_pair(self, prev_gray: np.ndarray, curr_gray: np.ndarray) -> np.ndarray:
        """
        Computes dense Farneback optical flow between two grayscale frames.
        Returns:
            flow: (H, W, 2) array of (dx, dy) motion vectors in pixels
        """
        flow = cv2.calcOpticalFlowFarneback(
            prev_gray,
            curr_gray,
            None,
            pyr_scale=self.pyr_scale,
            levels=self.levels,
            winsize=self.winsize,
            iterations=self.iterations,
            poly_n=self.poly_n,
            poly_sigma=self.poly_sigma,
            flags=self.flags
        )
        return flow

    def extract_sequence_flow(self, rgb_frames: List[np.ndarray]) -> Tuple[torch.Tensor, dict]:
        """
        Computes optical flow across an entire sequence of RGB frames.
        Args:
            rgb_frames: List of T frames of shape (H, W, 3), range [0, 1]
        Returns:
            flow_tensor: (1, T, 2, H, W) torch tensor of normalized flow fields
            metrics: dict of aggregate motion kinetics (mean_velocity, angular_entropy, max_acceleration)
        """
        T = len(rgb_frames)
        flows = []
        magnitudes = []
        angles = []

        # Convert all to grayscale uint8 [0, 255]
        gray_frames = [cv2.cvtColor((f * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY) for f in rgb_frames]

        prev_gray = gray_frames[0]
        for t in range(T):
            if t == 0:
                # First frame has zero delta
                flow = np.zeros((self.target_size[1], self.target_size[0], 2), dtype=np.float32)
            else:
                flow = self.compute_flow_pair(prev_gray, gray_frames[t])
                prev_gray = gray_frames[t]

            # Calculate magnitude and angle
            mag, ang = cv2.cartToPolar(flow[..., 0], flow[..., 1], angleInDegrees=False)
            magnitudes.append(mag)
            angles.append(ang)

            # Transpose (H, W, 2) -> (2, H, W)
            flow_ch_first = np.transpose(flow, (2, 0, 1))
            flows.append(flow_ch_first)

        # Stack into (T, 2, H, W)
        flow_stack = np.stack(flows, axis=0)

        # Clip extreme outliers & normalize [-1, 1] roughly based on 20px displacement
        flow_norm = np.clip(flow_stack / 20.0, -2.0, 2.0).astype(np.float32)
        flow_tensor = torch.from_numpy(flow_norm).unsqueeze(0)  # (1, T, 2, H, W)

        # Compute summary kinetics across sequence for explainability
        all_mags = np.stack(magnitudes)
        mean_vel = float(np.mean(all_mags))
        max_vel = float(np.max(all_mags))

        # Circular variance (direction disorder) of high-speed pixels: S = 1 - |R|
        fast_mask = all_mags > 1.5
        if np.any(fast_mask):
            fast_angles = np.concatenate([a[m] for a, m in zip(angles, fast_mask) if np.any(m)])
            cos_mean = np.mean(np.cos(fast_angles))
            sin_mean = np.mean(np.sin(fast_angles))
            r_bar = np.sqrt(cos_mean**2 + sin_mean**2)
            circular_variance = float(1.0 - r_bar)
        else:
            circular_variance = 0.0

        metrics = {
            "mean_velocity": mean_vel,
            "peak_velocity": max_vel,
            "motion_disorder": circular_variance
        }

        return flow_tensor, metrics
