"""
Frame Extraction and Normalization Utilities for Video Streams.
"""

from typing import List, Tuple, Optional
import cv2
import numpy as np
import torch


class FrameExtractor:
    def __init__(self, target_size: Tuple[int, int] = (224, 224), sequence_length: int = 16):
        self.target_size = target_size
        self.sequence_length = sequence_length
        # ImageNet normalization parameters
        self.mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        self.std = np.array([0.229, 0.224, 0.225], dtype=np.float32)

    def preprocess_frame(self, frame_bgr: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Preprocesses a single BGR frame.
        Returns:
            resized_rgb: (H, W, 3) float32 normalized [0, 1] for optical flow & visualization
            tensor_norm: (3, H, W) normalized with ImageNet stats for CNN backbone
        """
        resized = cv2.resize(frame_bgr, self.target_size, interpolation=cv2.INTER_LINEAR)
        rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
        
        # Standardize for CNN
        norm = (rgb - self.mean) / self.std
        # Transpose to Channel-First: (3, H, W)
        tensor_norm = np.transpose(norm, (2, 0, 1)).astype(np.float32)
        return rgb, tensor_norm

    def extract_uniform_sequence(self, frames_bgr: List[np.ndarray]) -> Tuple[List[np.ndarray], torch.Tensor]:
        """
        Uniformly samples `sequence_length` frames from a provided sequence of raw BGR frames.
        Returns:
            rgb_frames: List of (H, W, 3) float32 frames
            tensor_seq: torch.Tensor of shape (1, T, 3, H, W)
        """
        n_frames = len(frames_bgr)
        if n_frames < self.sequence_length:
            # Pad by repeating the last frame
            indices = list(range(n_frames)) + [n_frames - 1] * (self.sequence_length - n_frames)
        else:
            # Uniform step sampling
            indices = np.linspace(0, n_frames - 1, self.sequence_length, dtype=int)

        rgb_list = []
        norm_tensors = []
        for idx in indices:
            rgb, norm = self.preprocess_frame(frames_bgr[idx])
            rgb_list.append(rgb)
            norm_tensors.append(norm)

        # Stack into (T, 3, H, W) -> add batch dimension -> (1, T, 3, H, W)
        stacked = np.stack(norm_tensors, axis=0)
        tensor_seq = torch.from_numpy(stacked).unsqueeze(0)
        return rgb_list, tensor_seq
