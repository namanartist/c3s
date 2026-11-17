"""
Evaluation & Benchmarking Engine for CCTV Violence Detector.
Calculates Precision, Recall, F1, Confusion Matrix, and False Alarm Rates (FPR).
"""

from typing import Dict, Any, List
import numpy as np
import torch
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score

from models.violence_detector import CCTVViolenceDetector
from config.categories import INDEX_TO_CATEGORY, NUM_CLASSES


class ModelEvaluator:
    def __init__(self, model: CCTVViolenceDetector):
        self.model = model
        self.model.eval()

    @torch.no_grad()
    def evaluate(self, rgb_batches: List[torch.Tensor], flow_batches: List[torch.Tensor], targets: List[int]) -> Dict[str, Any]:
        """
        Runs comprehensive evaluation over test set.
        """
        all_preds = []
        all_probs = []

        for rgb, flow in zip(rgb_batches, flow_batches):
            logits, probs = self.model(rgb, flow)
            pred = torch.argmax(probs, dim=-1).cpu().numpy()
            all_preds.extend(pred.tolist())
            all_probs.extend(probs.cpu().numpy().tolist())

        y_true = np.array(targets)
        y_pred = np.array(all_preds)
        y_probs = np.array(all_probs)

        report = classification_report(
            y_true,
            y_pred,
            target_names=[INDEX_TO_CATEGORY[i].value for i in range(NUM_CLASSES)],
            output_dict=True,
            zero_division=0
        )
        conf_matrix = confusion_matrix(y_true, y_pred, labels=list(range(NUM_CLASSES))).tolist()

        # False positive rate on Class 0 (NORMAL misclassified as violence)
        normal_mask = (y_true == 0)
        if np.any(normal_mask):
            fp_count = np.sum((y_pred[normal_mask] != 0))
            fpr = float(fp_count / np.sum(normal_mask))
        else:
            fpr = 0.0

        return {
            "accuracy": report["accuracy"],
            "macro_f1": report["macro avg"]["f1-score"],
            "false_positive_rate_on_normal": fpr,
            "classification_report": report,
            "confusion_matrix": conf_matrix
        }
