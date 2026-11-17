"""
Integration Test for C3S Video Aggression Model Pipeline.
"""

import pytest
import torch
from models.violence_detector import CCTVViolenceDetector
from preprocessing.frame_extractor import FrameExtractor
from preprocessing.optical_flow import DenseOpticalFlowExtractor
import numpy as np


def test_model_forward_shape():
    """Verifies output dimensions of the two-stream CNN-LSTM network."""
    model = CCTVViolenceDetector()
    model.eval()

    batch_size = 2
    seq_len = 16
    h, w = 224, 224

    dummy_rgb = torch.randn(batch_size, seq_len, 3, h, w)
    dummy_flow = torch.randn(batch_size, seq_len, 2, h, w)

    logits, probs = model(dummy_rgb, dummy_flow)

    assert logits.shape == (batch_size, 4), f"Expected logits shape {(batch_size, 4)}, got {logits.shape}"
    assert probs.shape == (batch_size, 4), f"Expected probs shape {(batch_size, 4)}, got {probs.shape}"
    # Probabilities must sum to 1.0 along class dimension
    sums = torch.sum(probs, dim=-1).detach().numpy()
    np.testing.assert_allclose(sums, np.ones(batch_size), atol=1e-5)


def test_preprocessing_and_optical_flow():
    """Verifies frame extraction and Farneback flow normalization."""
    extractor = FrameExtractor()
    flow_extractor = DenseOpticalFlowExtractor()

    # Generate 16 dummy frames
    raw_frames = [np.full((300, 400, 3), 128, dtype=np.uint8) for _ in range(16)]

    rgb_list, rgb_tensor = extractor.extract_uniform_sequence(raw_frames)
    assert len(rgb_list) == 16
    assert rgb_tensor.shape == (1, 16, 3, 224, 224)

    flow_tensor, metrics = flow_extractor.extract_sequence_flow(rgb_list)
    assert flow_tensor.shape == (1, 16, 2, 224, 224)
    assert "mean_velocity" in metrics
    assert "motion_disorder" in metrics
