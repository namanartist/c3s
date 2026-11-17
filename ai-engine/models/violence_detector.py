"""
Composite Two-Stream CNN-LSTM Network for CCTV Violence Detection.
Integrates MobileNetV3 (spatial) + Farneback Optical Flow (motion) + Temporal BiLSTM.
"""

from typing import Tuple, Dict, Any
import torch
import torch.nn as nn
from models.mobilenet_extractor import SpatialFeatureExtractor
from models.optical_flow_net import MotionFeatureExtractor
from models.temporal_lstm import TemporalLSTM
from config.categories import ViolenceCategory, NUM_CLASSES


class CCTVViolenceDetector(nn.Module):
    def __init__(
        self,
        spatial_dim: int = 256,
        motion_dim: int = 128,
        lstm_hidden: int = 256,
        num_classes: int = NUM_CLASSES,
        dropout: float = 0.3
    ):
        super().__init__()
        self.spatial_dim = spatial_dim
        self.motion_dim = motion_dim
        self.fused_dim = spatial_dim + motion_dim

        # Stream 1: Spatial representation
        self.spatial_net = SpatialFeatureExtractor(feature_dim=spatial_dim, pretrained=True)

        # Stream 2: Motion representation (Optical Flow)
        self.motion_net = MotionFeatureExtractor(in_channels=2, feature_dim=motion_dim)

        # Temporal Sequence Aggregation
        self.temporal_aggregator = TemporalLSTM(
            input_dim=self.fused_dim,
            hidden_dim=lstm_hidden,
            num_layers=2,
            bidirectional=True,
            dropout=dropout
        )

        # Multi-class Classifier Head
        classifier_in = lstm_hidden * 2  # Bidirectional
        self.classifier = nn.Sequential(
            nn.Linear(classifier_in, 128),
            nn.ReLU(inplace=True),
            nn.Dropout(p=dropout),
            nn.Linear(128, num_classes)
        )

    def forward(self, rgb_seq: torch.Tensor, flow_seq: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Args:
            rgb_seq: (Batch, SeqLen, 3, H, W)
            flow_seq: (Batch, SeqLen, 2, H, W)
        Returns:
            logits: (Batch, num_classes)
            probabilities: (Batch, num_classes)
        """
        B, T, C_rgb, H, W = rgb_seq.shape
        _, _, C_flow, _, _ = flow_seq.shape

        # Fold Batch and Temporal dimensions for parallel 2D convolutions
        rgb_flat = rgb_seq.view(B * T, C_rgb, H, W)
        flow_flat = flow_seq.view(B * T, C_flow, H, W)

        # Extract features
        spatial_feats = self.spatial_net(rgb_flat)  # (B*T, spatial_dim)
        motion_feats = self.motion_net(flow_flat)    # (B*T, motion_dim)

        # Fuse streams: (B*T, spatial_dim + motion_dim)
        fused = torch.cat([spatial_feats, motion_feats], dim=1)

        # Reshape back to temporal sequence: (B, T, fused_dim)
        sequence_feats = fused.view(B, T, self.fused_dim)

        # Temporal BiLSTM + Attention aggregation
        context = self.temporal_aggregator(sequence_feats)  # (B, hidden * 2)

        # Logits & Softmax probabilities
        logits = self.classifier(context)
        probs = torch.softmax(logits, dim=-1)

        return logits, probs

    @torch.no_grad()
    def predict_window(self, rgb_seq: torch.Tensor, flow_seq: torch.Tensor) -> Dict[str, Any]:
        """
        Performs inference on a single sequence window (Batch = 1).
        Returns category, confidence, and calibrated class distribution.
        """
        self.eval()
        logits, probs = self.forward(rgb_seq, flow_seq)
        probs_np = probs.cpu().numpy()[0]
        top_idx = int(torch.argmax(probs, dim=-1)[0].item())

        from config.categories import INDEX_TO_CATEGORY, CATEGORY_METADATA
        category = INDEX_TO_CATEGORY[top_idx]
        confidence = float(probs_np[top_idx])

        return {
            "category": category.value,
            "category_label": CATEGORY_METADATA[category]["label"],
            "severity": CATEGORY_METADATA[category]["severity"],
            "confidence": round(confidence, 4),
            "class_probabilities": {
                INDEX_TO_CATEGORY[i].value: round(float(p), 4)
                for i, p in enumerate(probs_np)
            }
        }
