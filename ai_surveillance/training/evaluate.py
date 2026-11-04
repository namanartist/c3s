"""
ai_surveillance/training/evaluate.py
Performance benchmarking and evaluation metrics:
Precision, Recall, F1-Score, Confusion Matrix, FPR, FNR, Inference Latency (ms), and FPS.
"""

import time
import argparse
from pathlib import Path
import numpy as np
import torch
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)

from ai_surveillance.config.categories import ActionCategory, IDX_TO_CATEGORY, NUM_CLASSES
from ai_surveillance.data.dataset_pipeline import SurveillanceDatasetPipeline
from ai_surveillance.data.dataloader import create_surveillance_dataloaders
from ai_surveillance.models.model_factory import create_model, load_checkpoint


def benchmark_latency(model: torch.nn.Module, device: torch.device, num_iterations: int = 50) -> dict:
    """
    Measures genuine forward-pass inference latency and throughput (FPS).
    Warm-up runs are performed before benchmarking.
    """
    model.eval()
    dummy_video = torch.randn(1, 16, 3, 224, 224, device=device)
    dummy_pose = torch.randn(1, 16, 34, device=device)

    # Warmup
    for _ in range(5):
        with torch.no_grad():
            _ = model(dummy_video, dummy_pose)

    if device.type == "cuda":
        torch.cuda.synchronize()

    latencies_ms = []
    for _ in range(num_iterations):
        start_t = time.perf_counter()
        with torch.no_grad():
            _ = model(dummy_video, dummy_pose)
        if device.type == "cuda":
            torch.cuda.synchronize()
        end_t = time.perf_counter()
        latencies_ms.append((end_t - start_t) * 1000.0)

    avg_latency = float(np.mean(latencies_ms))
    p95_latency = float(np.percentile(latencies_ms, 95))
    fps = 1000.0 / avg_latency if avg_latency > 0 else 0.0

    return {
        "mean_latency_ms": round(avg_latency, 2),
        "p95_latency_ms": round(p95_latency, 2),
        "throughput_fps": round(fps, 1)
    }


def evaluate_model_performance(
    model: torch.nn.Module,
    test_loader,
    device: torch.device
) -> dict:
    """
    Computes Precision, Recall, F1, Confusion Matrix, FPR, and FNR on test data.
    """
    model.eval()
    all_preds = []
    all_targets = []
    all_aggression_preds = []
    all_aggression_targets = []

    with torch.no_grad():
        for batch in test_loader:
            video = batch["video"].to(device)
            pose = batch["pose"].to(device)
            action_targets = batch["action_label"].cpu().numpy()
            aggression_targets = batch["aggression_target"].cpu().numpy()

            outputs = model(video, pose)
            action_preds = torch.argmax(outputs["action_logits"], dim=-1).cpu().numpy()
            agg_scores = outputs["aggression_confidence"].cpu().numpy()
            agg_binary_preds = (agg_scores >= 0.70).astype(int)

            all_preds.extend(action_preds)
            all_targets.extend(action_targets)
            all_aggression_preds.extend(agg_binary_preds)
            all_aggression_targets.extend(aggression_targets)

    all_preds = np.array(all_preds)
    all_targets = np.array(all_targets)
    all_agg_preds = np.array(all_aggression_preds)
    all_agg_targets = np.array(all_aggression_targets)

    # Binary Violence / Aggression Metrics
    if len(all_agg_targets) > 0 and len(np.unique(all_agg_targets)) > 1:
        cm = confusion_matrix(all_agg_targets, all_agg_preds, labels=[0, 1])
        tn, fp, fn, tp = cm.ravel()
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
        fnr = fn / (fn + tp) if (fn + tp) > 0 else 0.0
        precision = precision_score(all_agg_targets, all_agg_preds, zero_division=0)
        recall = recall_score(all_agg_targets, all_agg_preds, zero_division=0)
        f1 = f1_score(all_agg_targets, all_agg_preds, zero_division=0)
    else:
        cm = np.zeros((2, 2), dtype=int)
        fpr, fnr, precision, recall, f1 = 0.0, 0.0, 0.0, 0.0, 0.0

    return {
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1_score": round(float(f1), 4),
        "false_positive_rate": round(float(fpr), 4),
        "false_negative_rate": round(float(fnr), 4),
        "confusion_matrix": cm.tolist()
    }


def main():
    parser = argparse.ArgumentParser(description="Evaluate aggression detection model.")
    parser.add_argument("--model", type=str, default="cnn_lstm", choices=["cnn_lstm", "video_transformer"])
    parser.add_argument("--checkpoint", type=str, default=None)
    parser.add_argument("--data_dir", type=str, default="ai_surveillance/data")
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    pipeline = SurveillanceDatasetPipeline(data_root=data_dir)
    splits = pipeline.generate_leak_free_splits()
    _, _, test_loader = create_surveillance_dataloaders(splits, batch_size=4)

    model, device = create_model(model_type=args.model)
    if args.checkpoint:
        model = load_checkpoint(model, Path(args.checkpoint), device)
        print(f"Loaded weights from: {args.checkpoint}")
    else:
        print("Benchmarking model baseline forward pass (uninitialized/dev weights)...")

    # 1. Latency & Throughput Benchmark
    perf = benchmark_latency(model, device)
    print("\n--- Latency & Throughput Benchmark ---")
    print(f"Device: {device}")
    print(f"Mean Latency: {perf['mean_latency_ms']} ms")
    print(f"P95 Latency:  {perf['p95_latency_ms']} ms")
    print(f"Throughput:   {perf['throughput_fps']} FPS")

    # 2. Evaluation Metrics
    metrics = evaluate_model_performance(model, test_loader, device)
    print("\n--- Classification & Accuracy Metrics ---")
    print(f"Precision: {metrics['precision'] * 100:.2f}%")
    print(f"Recall:    {metrics['recall'] * 100:.2f}%")
    print(f"F1-Score:  {metrics['f1_score'] * 100:.2f}%")
    print(f"FPR:       {metrics['false_positive_rate'] * 100:.2f}%")
    print(f"FNR:       {metrics['false_negative_rate'] * 100:.2f}%")
    print(f"Confusion Matrix [TN, FP / FN, TP]: {metrics['confusion_matrix']}")


if __name__ == "__main__":
    main()

