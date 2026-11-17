"""
Rolling Pre-Event (30s) and Post-Event (60s) CCTV Video Clip Evidence Buffer.
Preserves forensic video clips when an emergency or physical altercation occurs.
"""

from collections import deque
from pathlib import Path
from typing import List, Optional
import time
import cv2
import numpy as np


class RollingCCTVBuffer:
    def __init__(
        self,
        camera_id: str,
        fps: int = 15,
        pre_buffer_seconds: int = 30,
        post_buffer_seconds: int = 60,
        output_dir: Path = Path("evidence_vault")
    ):
        self.camera_id = camera_id
        self.fps = fps
        self.pre_buffer_seconds = pre_buffer_seconds
        self.post_buffer_seconds = post_buffer_seconds
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Pre-event ring buffer holding exactly (fps * pre_buffer_seconds) frames
        self.max_pre_frames = fps * pre_buffer_seconds
        self.pre_buffer: deque = deque(maxlen=self.max_pre_frames)

        # Active incident recording state
        self.recording_incident_id: Optional[str] = None
        self.incident_frames: List[np.ndarray] = []
        self.post_frames_remaining: int = 0
        self.incident_start_time: float = 0.0

    def add_frame(self, frame_bgr: np.ndarray) -> Optional[Path]:
        """
        Pushes a new frame into the rolling buffer.
        If an incident is currently being recorded, accumulates post-event frames.
        Returns the saved video path once post-buffer recording concludes.
        """
        # Maintain pre-event ring buffer
        self.pre_buffer.append(frame_bgr)

        # If recording an active incident:
        if self.recording_incident_id is not None:
            self.incident_frames.append(frame_bgr)
            self.post_frames_remaining -= 1

            if self.post_frames_remaining <= 0:
                saved_path = self._flush_incident_video()
                return saved_path

        return None

    def trigger_incident(self, incident_id: str) -> None:
        """
        Transitions buffer to record an incident.
        Copies the historical 30s pre-buffer and begins recording the next 60s.
        """
        if self.recording_incident_id is not None:
            # Already recording an active incident; ignore duplicate trigger
            return

        self.recording_incident_id = incident_id
        self.incident_start_time = time.time()
        self.incident_frames = list(self.pre_buffer)  # Snapshot 30s pre-buffer
        self.post_frames_remaining = self.fps * self.post_buffer_seconds
        print(f"[Evidence Buffer] Started incident clip recording for {incident_id} (Pre-frames: {len(self.incident_frames)})")

    def _flush_incident_video(self) -> Path:
        """
        Writes accumulated pre + post video frames to MP4 video evidence file.
        """
        filename = f"evidence_{self.camera_id}_{self.recording_incident_id}_{int(self.incident_start_time)}.mp4"
        file_path = self.output_dir / filename

        if len(self.incident_frames) > 0:
            h, w = self.incident_frames[0].shape[:2]
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            out = cv2.VideoWriter(str(file_path), fourcc, float(self.fps), (w, h))

            for f in self.incident_frames:
                out.write(f)
            out.release()
            print(f"[Evidence Buffer] Successfully saved forensic evidence video to {file_path}")

        # Reset recording state
        self.recording_incident_id = None
        self.incident_frames = []
        self.post_frames_remaining = 0
        return file_path
