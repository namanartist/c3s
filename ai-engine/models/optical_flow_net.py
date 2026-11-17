"""
Motion Feature Extractor for Dense Optical Flow.
Processes 2-channel Farneback flow fields (dx, dy) into temporal motion embeddings.
"""

import torch
import torch.nn as nn


class MotionFeatureExtractor(nn.Module):
    def __init__(self, in_channels: int = 2, feature_dim: int = 128):
        super().__init__()
        self.conv = nn.Sequential(
            # Stage 1: Initial receptive field on velocity gradients
            nn.Conv2d(in_channels, 32, kernel_size=7, stride=2, padding=3, bias=False),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),

            # Stage 2: Capture kinetic turbulence & shear
            nn.Conv2d(32, 64, kernel_size=3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),

            # Stage 3: High-level motion patterning
            nn.Conv2d(64, 128, kernel_size=3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d((1, 1))
        )

        self.projection = nn.Sequential(
            nn.Linear(128, feature_dim),
            nn.BatchNorm1d(feature_dim),
            nn.ReLU(inplace=True),
            nn.Dropout(p=0.2)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: Tensor of shape (Batch * SeqLen, 2, H, W)
        Returns:
            features: Tensor of shape (Batch * SeqLen, feature_dim)
        """
        feats = self.conv(x)
        flattened = torch.flatten(feats, 1)
        projected = self.projection(flattened)
        return projected
