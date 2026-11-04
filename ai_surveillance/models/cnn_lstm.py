"""
ai_surveillance/models/cnn_lstm.py
Spatio-Temporal CNN-BiLSTM Action Recognition Architecture with Multi-Modal Pose Fusion.
Combines visual spatial frame embeddings with keypoint kinematics across temporal sequences.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from ai_surveillance.config.categories import NUM_CLASSES


class SpatialFeatureExtractor(nn.Module):
    """
    Lightweight 2D Convolutional backbone for extracting frame embeddings.
    Can be loaded standalone or initialized with pre-trained weights.
    """
    def __init__(self, embedding_dim: int = 256):
        super().__init__()
        self.conv_net = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, stride=2, padding=1),  # 224x224 -> 112x112
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),

            nn.Conv2d(32, 64, kernel_size=3, stride=2, padding=1), # 112x112 -> 56x56
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),

            nn.Conv2d(64, 128, kernel_size=3, stride=2, padding=1), # 56x56 -> 28x28
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),

            nn.Conv2d(128, 256, kernel_size=3, stride=2, padding=1), # 28x28 -> 14x14
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),

            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten(),
            nn.Linear(256, embedding_dim),
            nn.LayerNorm(embedding_dim),
            nn.Dropout(0.3)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: [Batch * Time, Channels, Height, Width]
        return self.conv_net(x)


class TemporalSelfAttention(nn.Module):
    """
    Multi-Head Self-Attention over temporal sequence steps to attend to peak strike frames.
    """
    def __init__(self, hidden_dim: int, num_heads: int = 4):
        super().__init__()
        self.mha = nn.MultiheadAttention(embed_dim=hidden_dim, num_heads=num_heads, batch_first=True)
        self.norm = nn.LayerNorm(hidden_dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: [Batch, Time, HiddenDim]
        attn_out, _ = self.mha(x, x, x)
        return self.norm(x + attn_out)


class SpatioTemporalCnnLstm(nn.Module):
    """
    Complete Multi-Modal Violence & Aggression Classifier:
    - Visual Stream: Video frames -> CNN -> BiLSTM -> Temporal Attention
    - Kinematics Stream: Pose keypoint displacement & velocities -> MLP
    - Fusion Head: Aggression Score, 14-Class Prediction, Severity Head
    """
    def __init__(
        self,
        num_classes: int = NUM_CLASSES,
        visual_dim: int = 256,
        pose_dim: int = 34,        # 17 keypoints * 2 (x, y velocities / coordinates)
        lstm_hidden: int = 128,
        lstm_layers: int = 2,
        dropout: float = 0.4
    ):
        super().__init__()
        self.spatial_extractor = SpatialFeatureExtractor(embedding_dim=visual_dim)

        # Pose Kinematics Encoder (velocity, acceleration, distance)
        self.pose_encoder = nn.Sequential(
            nn.Linear(pose_dim, 64),
            nn.ReLU(inplace=True),
            nn.Linear(64, 64),
            nn.LayerNorm(64),
            nn.Dropout(dropout)
        )

        # Joint Visual-Kinematics Temporal BiLSTM
        fusion_input_dim = visual_dim + 64
        self.bilstm = nn.LSTM(
            input_size=fusion_input_dim,
            hidden_size=lstm_hidden,
            num_layers=lstm_layers,
            batch_first=True,
            bidirectional=True,
            dropout=dropout if lstm_layers > 1 else 0.0
        )

        lstm_out_dim = lstm_hidden * 2  # Bidirectional
        self.temporal_attention = TemporalSelfAttention(hidden_dim=lstm_out_dim, num_heads=4)

        # Multi-Head Classification
        # 1. Action Category Head (14 fine-grained classes)
        self.action_head = nn.Sequential(
            nn.Linear(lstm_out_dim, 128),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
            nn.Linear(128, num_classes)
        )

        # 2. Continuous Aggression Confidence Head (0.0 to 1.0 sigmoid score)
        self.aggression_head = nn.Sequential(
            nn.Linear(lstm_out_dim, 64),
            nn.ReLU(inplace=True),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )

        # 3. Severity Level Head (4 classes: Low, Medium, High, Critical)
        self.severity_head = nn.Sequential(
            nn.Linear(lstm_out_dim, 64),
            nn.ReLU(inplace=True),
            nn.Linear(64, 4)
        )

    def forward(
        self,
        video_seq: torch.Tensor,
        pose_seq: torch.Tensor = None
    ) -> dict:
        """
        video_seq: [Batch, Time, Channels, Height, Width]
        pose_seq:  [Batch, Time, PoseDim] (Optional, zero-filled if pose not tracked)
        """
        B, T, C, H, W = video_seq.shape

        # 1. Extract visual spatial features per frame
        flat_video = video_seq.view(B * T, C, H, W)
        visual_features = self.spatial_extractor(flat_video)
        visual_features = visual_features.view(B, T, -1)  # [B, T, visual_dim]

        # 2. Encode pose kinematics
        if pose_seq is None:
            pose_seq = torch.zeros(B, T, 34, device=video_seq.device)
        pose_features = self.pose_encoder(pose_seq)       # [B, T, 64]

        # 3. Fuse Visual and Kinematic streams across time steps
        fused_seq = torch.cat([visual_features, pose_features], dim=-1) # [B, T, visual_dim + 64]

        # 4. Spatio-Temporal Temporal Modeling
        lstm_out, _ = self.bilstm(fused_seq)  # [B, T, lstm_out_dim]
        attn_out = self.temporal_attention(lstm_out)

        # Global temporal pooling (attend across time)
        pooled = torch.mean(attn_out, dim=1)  # [B, lstm_out_dim]

        # 5. Predictions
        action_logits = self.action_head(pooled)
        aggression_score = self.aggression_head(pooled).squeeze(-1)
        severity_logits = self.severity_head(pooled)

        return {
            "action_logits": action_logits,
            "aggression_confidence": aggression_score,
            "severity_logits": severity_logits
        }

