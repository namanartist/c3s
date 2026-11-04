"""
ai_surveillance/training/train.py
Production PyTorch model training script for custom aggression & violence detection.
Supports CNN-LSTM and Video Transformer architectures with multi-task loss and early stopping.
"""

import argparse
import sys
from pathlib import Path
import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR

from ai_surveillance.config.settings import settings
from ai_surveillance.data.dataset_pipeline import SurveillanceDatasetPipeline
from ai_surveillance.data.dataloader import create_surveillance_dataloaders
from ai_surveillance.models.model_factory import create_model, save_checkpoint
from ai_surveillance.models.loss import ClassBalancedLoss


def train_epoch(
    model: nn.Module,
    loader,
    optimizer: torch.optim.Optimizer,
    criterion_action: nn.Module,
    criterion_aggression: nn.Module,
    criterion_severity: nn.Module,
    device: torch.device
) -> dict:
    model.train()
    total_loss = 0.0
    correct_actions = 0
    total_samples = 0

    for batch in loader:
        video = batch["video"].to(device)
        pose = batch["pose"].to(device)
        action_target = batch["action_label"].to(device)
        aggression_target = batch["aggression_target"].to(device)
        severity_target = batch["severity_label"].to(device)

        optimizer.zero_grad()
        outputs = model(video, pose)

        # Multi-task loss: 1. Action Classification + 2. Aggression Score + 3. Severity Level
        loss_action = criterion_action(outputs["action_logits"], action_target)
        loss_aggression = criterion_aggression(outputs["aggression_confidence"], aggression_target)
        loss_severity = criterion_severity(outputs["severity_logits"], severity_target)

        loss = loss_action + 1.5 * loss_aggression + 0.5 * loss_severity
        loss.backward()

        # Gradient clipping to prevent exploding gradients in recurrent/transformer layers
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()

        total_loss += loss.item() * video.size(0)
        preds = torch.argmax(outputs["action_logits"], dim=-1)
        correct_actions += (preds == action_target).sum().item()
        total_samples += video.size(0)

    avg_loss = total_loss / max(1, total_samples)
    acc = correct_actions / max(1, total_samples)
    return {"loss": avg_loss, "accuracy": acc}


@torch.no_grad()
def evaluate_epoch(
    model: nn.Module,
    loader,
    criterion_action: nn.Module,
    criterion_aggression: nn.Module,
    criterion_severity: nn.Module,
    device: torch.device
) -> dict:
    model.eval()
    total_loss = 0.0
    correct_actions = 0
    total_samples = 0

    for batch in loader:
        video = batch["video"].to(device)
        pose = batch["pose"].to(device)
        action_target = batch["action_label"].to(device)
        aggression_target = batch["aggression_target"].to(device)
        severity_target = batch["severity_label"].to(device)

        outputs = model(video, pose)

        loss_action = criterion_action(outputs["action_logits"], action_target)
        loss_aggression = criterion_aggression(outputs["aggression_confidence"], aggression_target)
        loss_severity = criterion_severity(outputs["severity_logits"], severity_target)

        loss = loss_action + 1.5 * loss_aggression + 0.5 * loss_severity

        total_loss += loss.item() * video.size(0)
        preds = torch.argmax(outputs["action_logits"], dim=-1)
        correct_actions += (preds == action_target).sum().item()
        total_samples += video.size(0)

    avg_loss = total_loss / max(1, total_samples)
    acc = correct_actions / max(1, total_samples)
    return {"loss": avg_loss, "accuracy": acc}


def main():
    parser = argparse.ArgumentParser(description="Train custom violence and aggression recognition model.")
    parser.add_argument("--model", type=str, default="cnn_lstm", choices=["cnn_lstm", "video_transformer"])
    parser.add_argument("--epochs", type=int, default=25)
    parser.add_argument("--batch_size", type=int, default=8)
    parser.add_argument("--lr", type=float, default=3e-4)
    parser.add_argument("--data_dir", type=str, default="ai_surveillance/data")
    parser.add_argument("--output_dir", type=str, default="ai_surveillance/models/checkpoints")
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"=== Initializing Training Pipeline ===")
    print(f"Architecture: {args.model.upper()}")
    print(f"Epochs: {args.epochs} | Batch Size: {args.batch_size} | LR: {args.lr}")

    # 1. Pipeline splits
    pipeline = SurveillanceDatasetPipeline(data_root=data_dir)
    splits = pipeline.generate_leak_free_splits()
    print(f"Dataset summary: Train: {len(splits['train'])} | Val: {len(splits['val'])} | Test: {len(splits['test'])}")

    # 2. Dataloaders
    train_loader, val_loader, test_loader = create_surveillance_dataloaders(splits, batch_size=args.batch_size)

    # 3. Model & Device
    model, device = create_model(model_type=args.model)
    print(f"Target Compute Device: {device}")

    # 4. Class-balanced loss weights
    class_weights = pipeline.calculate_class_weights(splits["train"])
    criterion_action = ClassBalancedLoss(samples_per_class=[max(1, int(1.0 / w * 100)) for w in class_weights])
    criterion_aggression = nn.BCELoss()
    criterion_severity = nn.CrossEntropyLoss()

    optimizer = AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    scheduler = CosineAnnealingLR(optimizer, T_max=args.epochs, eta_min=1e-6)

    best_val_loss = float("inf")
    patience = 7
    patience_counter = 0

    for epoch in range(1, args.epochs + 1):
        train_res = train_epoch(
            model, train_loader, optimizer,
            criterion_action, criterion_aggression, criterion_severity,
            device
        )
        val_res = evaluate_epoch(
            model, val_loader,
            criterion_action, criterion_aggression, criterion_severity,
            device
        )
        scheduler.step()

        print(
            f"Epoch {epoch:02d}/{args.epochs:02d} | "
            f"Train Loss: {train_res['loss']:.4f} Acc: {train_res['accuracy'] * 100:.1f}% | "
            f"Val Loss: {val_res['loss']:.4f} Acc: {val_res['accuracy'] * 100:.1f}%"
        )

        if val_res["loss"] < best_val_loss:
            best_val_loss = val_res["loss"]
            patience_counter = 0
            best_model_path = output_dir / f"best_aggression_{args.model}.pt"
            save_checkpoint(model, optimizer, epoch, val_res, best_model_path)
            print(f" -> Checkpoint saved: {best_model_path}")
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"Early stopping triggered at epoch {epoch}")
                break

    print(f"Training completed successfully! Best model saved to: {output_dir}")


if __name__ == "__main__":
    main()

