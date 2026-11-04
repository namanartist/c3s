"""
ai_surveillance/models/model_factory.py
Model instantiation, checkpoint serialization, and device management.
"""

import os
from pathlib import Path
from typing import Optional, Tuple
import torch
import torch.nn as nn
from ai_surveillance.config.settings import settings
from ai_surveillance.models.cnn_lstm import SpatioTemporalCnnLstm
from ai_surveillance.models.video_transformer import SpatioTemporalTransformer


def create_model(
    model_type: str = settings.ACTION_MODEL_TYPE,
    device: Optional[torch.device] = None
) -> Tuple[nn.Module, torch.device]:
    """
    Instantiates the configured action recognition model on the target device.
    """
    if device is None:
        if torch.cuda.is_available():
            device = torch.device("cuda")
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            device = torch.device("mps")
        else:
            device = torch.device("cpu")

    if model_type == "video_transformer":
        model = SpatioTemporalTransformer()
    else:
        model = SpatioTemporalCnnLstm()

    model = model.to(device)
    return model, device


def load_checkpoint(
    model: nn.Module,
    checkpoint_path: Path,
    device: torch.device
) -> nn.Module:
    """
    Loads saved checkpoint weights into model.
    """
    if not os.path.exists(checkpoint_path):
        raise FileNotFoundError(f"Checkpoint not found at: {checkpoint_path}")

    checkpoint = torch.load(checkpoint_path, map_location=device)
    state_dict = checkpoint.get("model_state_dict", checkpoint)
    model.load_state_dict(state_dict)
    model.eval()
    return model


def save_checkpoint(
    model: nn.Module,
    optimizer: torch.optim.Optimizer,
    epoch: int,
    metrics: dict,
    save_path: Path
):
    """
    Saves model state, optimizer state, and training telemetry.
    """
    save_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save({
        "epoch": epoch,
        "model_state_dict": model.state_dict(),
        "optimizer_state_dict": optimizer.state_dict(),
        "metrics": metrics
    }, save_path)

