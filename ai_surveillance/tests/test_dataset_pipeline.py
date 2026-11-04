"""
ai_surveillance/tests/test_dataset_pipeline.py
Unit tests for the leak-free dataset splitting and annotation pipeline.
"""

import unittest
from pathlib import Path
import shutil
from ai_surveillance.data.dataset_pipeline import SurveillanceDatasetPipeline
from ai_surveillance.config.categories import ActionCategory, NUM_CLASSES


class TestDatasetPipeline(unittest.TestCase):
    def setUp(self):
        self.test_data_dir = Path("ai_surveillance/tests/tmp_data")
        self.pipeline = SurveillanceDatasetPipeline(data_root=self.test_data_dir)

    def tearDown(self):
        if self.test_data_dir.exists():
            shutil.rmtree(self.test_data_dir)

    def test_sample_manifest_creation(self):
        manifest_file = self.pipeline.create_sample_manifest()
        self.assertTrue(manifest_file.exists())

    def test_leak_free_split_generation(self):
        self.pipeline.create_sample_manifest()
        splits = self.pipeline.generate_leak_free_splits(train_ratio=0.5, val_ratio=0.25, test_ratio=0.25)

        self.assertIn("train", splits)
        self.assertIn("val", splits)
        self.assertIn("test", splits)

        # Ensure no overlap of subject IDs across splits
        train_subjects = set()
        for item in splits["train"]:
            train_subjects.update(item.get("subject_ids", []))

        val_subjects = set()
        for item in splits["val"]:
            val_subjects.update(item.get("subject_ids", []))

        test_subjects = set()
        for item in splits["test"]:
            test_subjects.update(item.get("subject_ids", []))

        self.assertEqual(len(train_subjects.intersection(val_subjects)), 0)
        self.assertEqual(len(train_subjects.intersection(test_subjects)), 0)
        self.assertEqual(len(val_subjects.intersection(test_subjects)), 0)

    def test_class_weights_calculation(self):
        sample_items = [
            {"label": ActionCategory.NORMAL_INTERACTION.value},
            {"label": ActionCategory.NORMAL_INTERACTION.value},
            {"label": ActionCategory.NORMAL_INTERACTION.value},
            {"label": ActionCategory.PHYSICAL_FIGHTING.value}
        ]
        weights = self.pipeline.calculate_class_weights(sample_items)
        self.assertEqual(len(weights), NUM_CLASSES)
        # Rare class (fight) must have higher weight than frequent class (normal)
        self.assertGreater(weights[7], weights[0])


if __name__ == "__main__":
    unittest.main()

