"""
ai_surveillance/models/loss.py
Loss functions for aggressive action recognition under extreme class imbalance.
Implements Focal Loss and Class-Balanced Loss.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class FocalLoss(nn.Module):
    """
    Multi-class Focal Loss to down-weight easy non-aggressive examples and focus on hard fight samples.
    FL(p_t) = -alpha_t * (1 - p_t)^gamma * log(p_t)
    """
    def __init__(self, alpha=None, gamma: float = 2.0, reduction: str = 'mean'):
        super().__init__()
        self.gamma = gamma
        self.reduction = reduction
        if alpha is not None:
            if isinstance(alpha, (list, tuple)):
                self.alpha = torch.tensor(alpha, dtype=torch.float32)
            else:
                self.alpha = alpha
        else:
            self.alpha = None

    def forward(self, inputs: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        # inputs: [Batch, NumClasses], targets: [Batch]
        ce_loss = F.cross_entropy(inputs, targets, reduction='none')
        pt = torch.exp(-ce_loss)  # probability of true class
        focal_loss = ((1.0 - pt) ** self.gamma) * ce_loss

        if self.alpha is not None:
            if self.alpha.device != inputs.device:
                self.alpha = self.alpha.to(inputs.device)
            alpha_t = self.alpha[targets]
            focal_loss = alpha_t * focal_loss

        if self.reduction == 'mean':
            return focal_loss.mean()
        elif self.reduction == 'sum':
            return focal_loss.sum()
        return focal_loss


class ClassBalancedLoss(nn.Module):
    """
    Class-Balanced Loss Based on Effective Number of Samples (Cui et al., CVPR 2019).
    E_n = (1 - beta^n) / (1 - beta)
    Weights are inversely proportional to the effective number of samples per class.
    """
    def __init__(self, samples_per_class: list, beta: float = 0.9999, gamma: float = 2.0):
        super().__init__()
        effective_num = 1.0 - (beta ** torch.tensor(samples_per_class, dtype=torch.float32))
        weights = (1.0 - beta) / (effective_num + 1e-8)
        weights = weights / weights.sum() * len(samples_per_class)
        self.focal_loss = FocalLoss(alpha=weights, gamma=gamma)

    def forward(self, inputs: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        return self.focal_loss(inputs, targets)

