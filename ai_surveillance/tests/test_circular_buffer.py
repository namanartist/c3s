"""
ai_surveillance/tests/test_circular_buffer.py
Unit tests for the rolling circular pre/post video frame buffer.
"""

import time
import unittest
from pathlib import Path
import numpy as np
import cv2

from ai_surveillance.vision.circular_buffer import CircularVideoBuffer


class TestCircularVideoBuffer(unittest.TestCase):
    def setUp(self):
        self.fps = 10
        self.pre_sec = 2
        self.post_sec = 2
        self.buffer = CircularVideoBuffer(
            fps=self.fps,
            pre_event_seconds=self.pre_sec,
            post_event_seconds=self.post_sec,
            frame_size=(320, 240)
        )

    def test_pre_event_rolling_capacity(self):
        # Push 40 frames into buffer with capacity 20 (10 fps * 2 sec)
        for i in range(40):
            dummy = np.zeros((240, 320, 3), dtype=np.uint8)
            self.buffer.push_frame(dummy)

        # Buffer length must not exceed max_pre_frames (20)
        self.assertEqual(len(self.buffer.buffer), 20)
        self.assertAlmostEqual(self.buffer.get_current_pre_event_duration(), 2.0, places=1)

    def test_incident_capture_lifecycle(self):
        # 1. Fill pre-event buffer
        for i in range(20):
            dummy = np.ones((240, 320, 3), dtype=np.uint8) * 50
            self.buffer.push_frame(dummy)

        out_path = Path("ai_surveillance/evidence/videos/test_clip.mp4")
        saved_flag = {"completed": False}

        def on_complete(inc_id, path):
            saved_flag["completed"] = True

        # 2. Trigger incident
        started = self.buffer.start_incident_capture(
            incident_id="TEST-INC-001",
            output_filepath=out_path,
            on_complete=on_complete
        )
        self.assertTrue(started)
        self.assertTrue(self.buffer.is_recording_incident)

        # 3. Push post-event frames (20 frames)
        for i in range(20):
            dummy = np.ones((240, 320, 3), dtype=np.uint8) * 100
            self.buffer.push_frame(dummy)

        # Allow worker thread to finish encoding
        time.sleep(1.0)
        self.assertTrue(saved_flag["completed"])
        self.assertTrue(out_path.exists())

        # Cleanup test artifact
        if out_path.exists():
            out_path.unlink()


if __name__ == "__main__":
    unittest.main()

