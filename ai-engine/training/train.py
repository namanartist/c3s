"""
Main Training Script for C3S Violence and Fight Detection Engine.
Can train on external datasets (RWF-2000, UCF-Crime) or synthesized hard-negative benchmark data.
"""

from pathlib import Path
import sys

_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

import argparse
import torch
from torch.utils.data import DataLoader

from models.violence_detector import CCTVViolenceDetector
from models.export_onnx import export_model_to_onnx
from datasets.hard_negatives import SyntheticVideoGenerator
from datasets.dataset_loader import CCTVViolenceDataset
from config.categories import ViolenceCategory
from config.settings import settings
from training.trainer import ModelTrainer


def train_pipeline(epochs: int = 5, batch_size: int = 2, synthetic_samples_per_class: int = 4):
    print("==================================================")
    print("  C3S Violence Detection Engine - Model Training  ")
    print("==================================================")

    data_dir = settings.model.model_checkpoint_path.parent.parent / "data" / "benchmark_clips"
    generator = SyntheticVideoGenerator(output_dir=data_dir)

    print(f"[Dataset Preparation] Generating {synthetic_samples_per_class} sample clips per category...")
    samples = []
    for cat in ViolenceCategory:
        for i in range(synthetic_samples_per_class):
            filename = f"sample_{cat.value.lower()}_{i}.mp4"
            clip_path = generator.save_clip_video(cat, filename, num_frames=20)
            samples.append({"path": str(clip_path), "category": cat})

    # Train / Val split (80 / 20)
    split_idx = int(0.8 * len(samples))
    train_samples = samples[:split_idx]
    val_samples = samples[split_idx:]

    train_ds = CCTVViolenceDataset(train_samples, sequence_length=16, augment=True)
    val_ds = CCTVViolenceDataset(val_samples, sequence_length=16, augment=False)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False)

    print(f"[Dataset] Train samples: {len(train_ds)}, Val samples: {len(val_ds)}")

    model = CCTVViolenceDetector()
    trainer = ModelTrainer(model=model, checkpoint_dir=settings.model.model_checkpoint_path.parent)

    print(f"[Training] Beginning {epochs} training epochs...")
    for epoch in range(1, epochs + 1):
        train_loss = trainer.train_epoch(train_loader)
        val_metrics = trainer.validate_epoch(val_loader)
        print(f"Epoch {epoch:02d}/{epochs:02d} | Train Loss: {train_loss:.4f} | Val Loss: {val_metrics['val_loss']:.4f} | Val Acc: {val_metrics['accuracy'] * 100:.1f}%")

    checkpoint_file = settings.model.model_checkpoint_path
    trainer.save_checkpoint(checkpoint_file)

    # Export to ONNX
    onnx_file = settings.model.onnx_model_path
    print(f"[Export] Exporting trained checkpoint to ONNX...")
    export_model_to_onnx(model, output_path=onnx_file)
    print("[Complete] Training and export completed successfully.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--batch-size", type=int, default=2)
    args = parser.parse_args()
    train_pipeline(epochs=args.epochs, batch_size=args.batch_size)
