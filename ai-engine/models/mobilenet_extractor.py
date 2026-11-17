"""
MobileNetV3 Spatial Feature Extractor.
Extracts compact visual features from each video frame.
"""

import torch
import torch.nn as nn
from torchvision.models import mobilenet_v3_small, MobileNet_V3_Small_Weights


class SpatialFeatureExtractor(nn.Module):
    def __init__(self, feature_dim: int = 256, pretrained: bool = True):
        super().__init__()
        weights = MobileNet_V3_Small_Weights.DEFAULT if pretrained else None
        base_model = mobilenet_v3_small(weights=weights)

        # Retain feature extraction stages up to global average pool
        self.features = base_model.features
        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))

        # MobileNetV3-Small features end with 576 channels
        in_channels = 576
        self.projection = nn.Sequential(
            nn.Linear(in_channels, feature_dim),
            nn.BatchNorm1d(feature_dim),
            nn.Hardswish(),
            nn.Dropout(p=0.2)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: Tensor of shape (Batch * SeqLen, 3, H, W)
        Returns:
            features: Tensor of shape (Batch * SeqLen, feature_dim)
        """
        feats = self.features(x)
        pooled = self.avgpool(feats)
        flattened = torch.flatten(pooled, 1)
        projected = self.projection(flattened)
        return projected
