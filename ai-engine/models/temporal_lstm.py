"""
Temporal Sequence Aggregator (BiLSTM + Attention).
Models dynamic time progression across video frame features.
"""

import torch
import torch.nn as nn


class TemporalAttention(nn.Module):
    def __init__(self, hidden_dim: int):
        super().__init__()
        self.attn = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.Tanh(),
            nn.Linear(hidden_dim // 2, 1)
        )

    def forward(self, rnn_outputs: torch.Tensor) -> torch.Tensor:
        """
        Args:
            rnn_outputs: (Batch, SeqLen, hidden_dim)
        Returns:
            context_vector: (Batch, hidden_dim)
        """
        scores = self.attn(rnn_outputs)  # (Batch, SeqLen, 1)
        weights = torch.softmax(scores, dim=1)  # (Batch, SeqLen, 1)
        context = torch.sum(weights * rnn_outputs, dim=1)  # (Batch, hidden_dim)
        return context


class TemporalLSTM(nn.Module):
    def __init__(
        self,
        input_dim: int = 384,      # 256 (spatial) + 128 (flow)
        hidden_dim: int = 256,
        num_layers: int = 2,
        bidirectional: bool = True,
        dropout: float = 0.3
    ):
        super().__init__()
        self.hidden_dim = hidden_dim
        self.bidirectional = bidirectional
        self.num_directions = 2 if bidirectional else 1

        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=bidirectional,
            dropout=dropout if num_layers > 1 else 0.0
        )

        effective_hidden = hidden_dim * self.num_directions
        self.attention = TemporalAttention(effective_hidden)
        self.layer_norm = nn.LayerNorm(effective_hidden)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: (Batch, SeqLen, input_dim)
        Returns:
            aggregated: (Batch, effective_hidden)
        """
        lstm_out, _ = self.lstm(x)  # (Batch, SeqLen, hidden_dim * num_directions)
        lstm_out = self.layer_norm(lstm_out)
        context = self.attention(lstm_out)  # (Batch, hidden_dim * num_directions)
        return context
