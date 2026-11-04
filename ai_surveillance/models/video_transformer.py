"""
ai_surveillance/models/video_transformer.py
Spatio-Temporal Video Transformer Architecture for Violence & Aggression Classification.
Uses 3D spatio-temporal tubelet projection and multi-layer Transformer Encoder.
"""

import math
import torch
import torch.nn as nn
from ai_surveillance.config.categories import NUM_CLASSES


class TubeletEmbedding(nn.Module):
    """
    3D Convolutional projection to tokenize video clips into spatio-temporal tokens.
    """
    def __init__(self, in_channels: int = 3, embed_dim: int = 192, tubelet_size=(2, 16, 16)):
        super().__init__()
        self.tubelet_size = tubelet_size
        self.proj = nn.Conv3d(
            in_channels,
            embed_dim,
            kernel_size=tubelet_size,
            stride=tubelet_size
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: [Batch, Channels, Time, Height, Width]
        tokens = self.proj(x)  # [Batch, EmbedDim, T', H', W']
        tokens = tokens.flatten(2).transpose(1, 2)  # [Batch, NumTokens, EmbedDim]
        return tokens


class SpatioTemporalTransformer(nn.Module):
    """
    Video Transformer Architecture for Aggression Recognition.
    Evaluated alongside CNN-LSTM for benchmarking as requested in Section 3 & 4.
    """
    def __init__(
        self,
        num_classes: int = NUM_CLASSES,
        embed_dim: int = 192,
        num_heads: int = 6,
        num_layers: int = 4,
        mlp_ratio: float = 4.0,
        dropout: float = 0.2
    ):
        super().__init__()
        self.tubelet_embed = TubeletEmbedding(embed_dim=embed_dim)
        self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))

        # Learnable positional embeddings
        self.pos_drop = nn.Dropout(p=dropout)

        encoder_layer = nn.TransformerEncoderLayer(
            d_model=embed_dim,
            nhead=num_heads,
            dim_feedforward=int(embed_dim * mlp_ratio),
            dropout=dropout,
            activation='gelu',
            batch_first=True,
            norm_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        self.norm = nn.LayerNorm(embed_dim)

        # Classification Heads
        self.action_head = nn.Linear(embed_dim, num_classes)
        self.aggression_head = nn.Sequential(
            nn.Linear(embed_dim, 1),
            nn.Sigmoid()
        )
        self.severity_head = nn.Linear(embed_dim, 4)

        self._init_weights()

    def _init_weights(self):
        nn.init.trunc_normal_(self.cls_token, std=0.02)

    def forward(self, video_seq: torch.Tensor, pose_seq: torch.Tensor = None) -> dict:
        # video_seq: [Batch, Time, Channels, Height, Width]
        # Permute to 3D Conv format: [Batch, Channels, Time, Height, Width]
        x = video_seq.permute(0, 2, 1, 3, 4)
        tokens = self.tubelet_embed(x)
        B = tokens.shape[0]

        cls_tokens = self.cls_token.expand(B, -1, -1)
        tokens = torch.cat((cls_tokens, tokens), dim=1)
        tokens = self.pos_drop(tokens)

        encoded = self.transformer(tokens)
        encoded = self.norm(encoded)

        # Extract CLS token representation
        cls_rep = encoded[:, 0]

        action_logits = self.action_head(cls_rep)
        aggression_score = self.aggression_head(cls_rep).squeeze(-1)
        severity_logits = self.severity_head(cls_rep)

        return {
            "action_logits": action_logits,
            "aggression_confidence": aggression_score,
            "severity_logits": severity_logits
        }

