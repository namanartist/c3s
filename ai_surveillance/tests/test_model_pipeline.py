"""
ai_surveillance/tests/test_model_pipeline.py
Unit tests for CNN-LSTM and Video Transformer tensor forward passes and losses.
"""

import unittest
import torch
from ai_surveillance.config.categories import NUM_CLASSES
from ai_surveillance.models.cnn_lstm import SpatioTemporalCnnLstm
from ai_surveillance.models.video_transformer import SpatioTemporalTransformer
from ai_surveillance.models.loss import FocalLoss, ClassBalancedLoss


class TestModelPipeline(unittest.TestCase):
    def setUp(self):
        self.device = torch.device("cpu")
        self.batch_size = 2
        self.seq_len = 16
        self.channels = 3
        self.height = 224
        self.width = 224

        self.dummy_video = torch.randn(self.batch_size, self.seq_len, self.channels, self.height, self.width)
        self.dummy_pose = torch.randn(self.batch_size, self.seq_len, 34)

    def test_cnn_lstm_forward_shapes(self):
        model = SpatioTemporalCnnLstm(num_classes=NUM_CLASSES)
        outputs = model(self.dummy_video, self.dummy_pose)

        self.assertIn("action_logits", outputs)
        self.assertIn("aggression_confidence", outputs)
        self.assertIn("severity_logits", outputs)

        # Check tensor dimensions
        self.assertEqual(outputs["action_logits"].shape, (self.batch_size, NUM_CLASSES))
        self.assertEqual(outputs["aggression_confidence"].shape, (self.batch_size,))
        self.assertEqual(outputs["severity_logits"].shape, (self.batch_size, 4))

        # Confidence must be between 0.0 and 1.0 (sigmoid output)
        conf = outputs["aggression_confidence"]
        self.assertTrue(torch.all(conf >= 0.0) and torch.all(conf <= 1.0))

    def test_video_transformer_forward_shapes(self):
        model = SpatioTemporalTransformer(num_classes=NUM_CLASSES, embed_dim=64, num_heads=2, num_layers=2)
        outputs = model(self.dummy_video, self.dummy_pose)

        self.assertEqual(outputs["action_logits"].shape, (self.batch_size, NUM_CLASSES))
        self.assertEqual(outputs["aggression_confidence"].shape, (self.batch_size,))

    def test_loss_functions(self):
        focal = FocalLoss(gamma=2.0)
        logits = torch.randn(self.batch_size, NUM_CLASSES)
        targets = torch.tensor([0, 1], dtype=torch.long)

        loss_val = focal(logits, targets)
        self.assertTrue(torch.is_tensor(loss_val))
        self.assertGreater(loss_val.item(), 0.0)


if __name__ == "__main__":
    unittest.main()

