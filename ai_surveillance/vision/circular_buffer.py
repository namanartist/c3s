"""
ai_surveillance/vision/circular_buffer.py
Thread-safe rolling circular video frame buffer.
Captures pre-event footage (10s), incident frames, and post-event footage (20-30s).
"""

import time
import threading
from collections import deque
from pathlib import Path
from typing import List, Optional, Tuple
import cv2
import numpy as np


class CircularVideoBuffer:
    """
    Circular in-memory FIFO frame buffer.
    Maintains continuous rolling window of pre-event frames and manages
    seamless transition to post-event incident recording.
    """
    def __init__(
        self,
        fps: int = 30,
        pre_event_seconds: int = 10,
        post_event_seconds: int = 25,
        frame_size: Tuple[int, int] = (640, 480)
    ):
        self.fps = fps
        self.pre_event_seconds = pre_event_seconds
        self.post_event_seconds = post_event_seconds
        self.frame_size = frame_size
        self.max_pre_frames = fps * pre_event_seconds
        self.max_post_frames = fps * post_event_seconds

        self.buffer = deque(maxlen=self.max_pre_frames)
        self.lock = threading.Lock()

        # Active incident recording states
        self.is_recording_incident = False
        self.incident_frames: List[np.ndarray] = []
        self.incident_post_counter = 0
        self.active_incident_id: Optional[str] = None
        self.incident_output_path: Optional[Path] = None
        self.on_recording_complete_cb = None

    def push_frame(self, frame: np.ndarray, timestamp: float = None):
        """
        Appends a frame into the circular buffer and active recording session.
        """
        ts = timestamp or time.time()
        # Ensure frame is uniform size
        if (frame.shape[1], frame.shape[0]) != self.frame_size:
            frame = cv2.resize(frame, self.frame_size)

        with self.lock:
            # Add to pre-event rolling buffer
            self.buffer.append((frame.copy(), ts))

            # If an incident recording is underway, accumulate post-event frames
            if self.is_recording_incident:
                self.incident_frames.append(frame.copy())
                self.incident_post_counter += 1

                if self.incident_post_counter >= self.max_post_frames:
                    self._finalize_incident_recording_async()

    def start_incident_capture(
        self,
        incident_id: str,
        output_filepath: Path,
        on_complete = None
    ) -> bool:
        """
        Locks rolling pre-event buffer into the incident video and starts post-event recording.
        """
        with self.lock:
            if self.is_recording_incident:
                # Already recording an incident
                return False

            self.is_recording_incident = True
            self.active_incident_id = incident_id
            self.incident_output_path = Path(output_filepath)
            self.on_recording_complete_cb = on_complete
            self.incident_post_counter = 0

            # Prepend all pre-event frames from circular buffer
            self.incident_frames = [f for f, _ in self.buffer]
            return True

    def _finalize_incident_recording_async(self):
        """
        Encodes the collected incident frames into an MP4 file in a background thread.
        """
        frames_to_write = list(self.incident_frames)
        output_path = self.incident_output_path
        callback = self.on_recording_complete_cb
        incident_id = self.active_incident_id

        # Reset states
        self.is_recording_incident = False
        self.incident_frames = []
        self.incident_post_counter = 0
        self.active_incident_id = None
        self.incident_output_path = None

        def writer_worker():
            if not frames_to_write or not output_path:
                return

            output_path.parent.mkdir(parents=True, exist_ok=True)
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            writer = cv2.VideoWriter(
                str(output_path),
                fourcc,
                float(self.fps),
                self.frame_size
            )

            for f in frames_to_write:
                writer.write(f)
            writer.release()

            if callback:
                try:
                    callback(incident_id, output_path)
                except Exception as e:
                    print(f"Error in recording complete callback: {e}")

        t = threading.Thread(target=writer_worker, daemon=True)
        t.start()

    def get_current_pre_event_duration(self) -> float:
        """
        Returns buffered seconds available before current moment.
        """
        with self.lock:
            return len(self.buffer) / float(self.fps)

