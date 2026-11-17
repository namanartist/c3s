"""
Model Checkpointing and ONNX Exporter for Production Deployment.
"""

from pathlib import Path
import sys

_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

import torch
from models.violence_detector import CCTVViolenceDetector
from config.settings import settings


def export_model_to_onnx(
    model: CCTVViolenceDetector,
    output_path: Path = settings.model.onnx_model_path,
    seq_len: int = 16,
    height: int = 224,
    width: int = 224
):
    """
    Exports the PyTorch CCTVViolenceDetector to an ONNX runtime graph.
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)
    model.eval()

    dummy_rgb = torch.randn(1, seq_len, 3, height, width, dtype=torch.float32)
    dummy_flow = torch.randn(1, seq_len, 2, height, width, dtype=torch.float32)

    torch.onnx.export(
        model,
        (dummy_rgb, dummy_flow),
        str(output_path),
        export_params=True,
        opset_version=17,
        do_constant_folding=True,
        input_names=["rgb_sequence", "flow_sequence"],
        output_names=["logits", "probabilities"],
        dynamic_axes={
            "rgb_sequence": {0: "batch_size"},
            "flow_sequence": {0: "batch_size"},
            "logits": {0: "batch_size"},
            "probabilities": {0: "batch_size"}
        }
    )
    print(f"[ONNX Export] Successfully exported model to {output_path}")


if __name__ == "__main__":
    detector = CCTVViolenceDetector()
    export_model_to_onnx(detector)
