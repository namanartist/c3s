"""
Training and Validation Engine for CCTV Violence Detector.
Includes learning rate scheduling, validation checks, and automatic checkpointing.
"""

from pathlib import Path
from typing import Dict, Any
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

from training.loss import FocalLoss
from models.violence_detector import CCTVViolenceDetector
from config.settings import settings


class ModelTrainer:
    def __init__(
        self,
        model: CCTVViolenceDetector,
        device: torch.device = None,
        learning_rate: float = 1e-4,
        weight_decay: float = 1e-4,
        checkpoint_dir: Path = settings.model.model_checkpoint_path.parent
    ):
        self.device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = model.to(self.device)
        self.checkpoint_dir = checkpoint_dir
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)

        # Class weights: up-weight rare classes (FIGHT and PHYSICAL_AGGRESSION)
        # Class 0: NORMAL (1.0), Class 1: SUSP (1.5), Class 2: AGGR (2.0), Class 3: FIGHT (2.5)
        alpha = torch.tensor([1.0, 1.5, 2.0, 2.5], dtype=torch.float32)
        self.criterion = FocalLoss(alpha=alpha, gamma=2.0)

        self.optimizer = torch.optim.AdamW(
            self.model.parameters(),
            lr=learning_rate,
            weight_decay=weight_decay
        )
        self.scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
            self.optimizer, mode="min", factor=0.5, patience=3
        )

        self.best_val_loss = float("inf")

    def train_epoch(self, dataloader: DataLoader) -> float:
        self.model.train()
        total_loss = 0.0
        n_batches = len(dataloader)

        for rgb_seq, flow_seq, targets in dataloader:
            rgb_seq = rgb_seq.to(self.device)
            flow_seq = flow_seq.to(self.device)
            targets = targets.to(self.device)

            self.optimizer.zero_grad()
            logits, _ = self.model(rgb_seq, flow_seq)
            loss = self.criterion(logits, targets)

            loss.backward()
            nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
            self.optimizer.step()

            total_loss += loss.item()

        return total_loss / max(1, n_batches)

    @torch.no_grad()
    def validate_epoch(self, dataloader: DataLoader) -> Dict[str, float]:
        self.model.eval()
        total_loss = 0.0
        correct = 0
        total_samples = 0
        n_batches = len(dataloader)

        for rgb_seq, flow_seq, targets in dataloader:
            rgb_seq = rgb_seq.to(self.device)
            flow_seq = flow_seq.to(self.device)
            targets = targets.to(self.device)

            logits, probs = self.model(rgb_seq, flow_seq)
            loss = self.criterion(logits, targets)

            preds = torch.argmax(probs, dim=-1)
            correct += (preds == targets).sum().item()
            total_samples += targets.size(0)
            total_loss += loss.item()

        avg_loss = total_loss / max(1, n_batches)
        accuracy = (correct / total_samples) if total_samples > 0 else 0.0
        return {"val_loss": avg_loss, "accuracy": accuracy}

    def save_checkpoint(self, path: Path):
        torch.save({
            "model_state_dict": self.model.state_dict(),
            "optimizer_state_dict": self.optimizer.state_dict(),
            "best_val_loss": self.best_val_loss
        }, str(path))
        print(f"[Trainer] Checkpoint saved successfully at {path}")
