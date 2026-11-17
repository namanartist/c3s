"""
Real-Time CCTV Stream Processor for Multi-Camera Surveillance.
Supports RTSP network streams, USB/webcams, and pre-recorded MP4 video files
with automatic reconnection, asynchronous frame skipping, and rolling forensic buffering.
"""

from typing import Optional, Dict, Any, Callable
import time
import threading
from pathlib import Path
import cv2
import numpy as np
import torch

from config.settings import settings
from preprocessing.frame_extractor import FrameExtractor
from preprocessing.optical_flow import DenseOpticalFlowExtractor
from tracking.person_tracker import PersonTracker
from .frame_buffer import RollingCCTVBuffer
from .decision_engine import DecisionEngine
from models.violence_detector import CCTVViolenceDetector


class CCTVStreamProcessor:
    def __init__(
        self,
        camera_id: str,
        source_uri: str,  # rtsp://..., 0 (webcam), or path/to/video.mp4
        building: str = "Admin Block",
        location_coords: Dict[str, float] = None,
        model: Optional[CCTVViolenceDetector] = None,
        on_alert_callback: Optional[Callable[[Dict[str, Any]], None]] = None
    ):
        self.camera_id = camera_id
        self.source_uri = source_uri
        self.building = building
        self.location_coords = location_coords or {"lat": 26.2183, "lng": 78.1828}
        self.model = model or CCTVViolenceDetector()
        self.on_alert_callback = on_alert_callback

        # Modular components
        self.extractor = FrameExtractor()
        self.flow_extractor = DenseOpticalFlowExtractor()
        self.tracker = PersonTracker()
        self.buffer = RollingCCTVBuffer(camera_id=camera_id)
        self.decision_engine = DecisionEngine(camera_id=camera_id)

        # Threading & Control Flags
        self.is_running = False
        self.thread: Optional[threading.Thread] = None
        self.current_status = "INITIALIZING"
        self.recent_frames = []
        self.latest_decision: Dict[str, Any] = {}

    def start(self):
        """Starts asynchronous camera ingestion thread."""
        if self.is_running:
            return
        self.is_running = True
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()
        print(f"[CCTV Stream] Started streaming processor for {self.camera_id} ({self.source_uri})")

    def stop(self):
        """Stops streaming and releases camera handle."""
        self.is_running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=2.0)
        self.current_status = "STOPPED"
        print(f"[CCTV Stream] Stopped stream for {self.camera_id}")

    def _open_capture(self) -> Optional[cv2.VideoCapture]:
        # Handle webcam integer index
        if str(self.source_uri).isdigit():
            cap = cv2.VideoCapture(int(self.source_uri))
        else:
            cap = cv2.VideoCapture(str(self.source_uri))
        if cap.isOpened():
            return cap
        return None

    def _run_loop(self):
        frame_counter = 0

        while self.is_running:
            cap = self._open_capture()
            if cap is None:
                self.current_status = "DISCONNECTED"
                print(f"[CCTV Stream] Could not connect to {self.camera_id}. Retrying in {settings.cctv.reconnect_delay_seconds}s...")
                time.sleep(settings.cctv.reconnect_delay_seconds)
                continue

            self.current_status = "ACTIVE"
            while self.is_running and cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    print(f"[CCTV Stream] Stream ended or dropped for {self.camera_id}")
                    break

                frame_counter += 1

                # Feed into rolling forensic evidence buffer
                evidence_path = self.buffer.add_frame(frame)
                if evidence_path:
                    print(f"[CCTV Stream] Post-event evidence clip archived at: {evidence_path}")

                self.recent_frames.append(frame)
                if len(self.recent_frames) > 16:
                    self.recent_frames.pop(0)

                # Frame skipping: only trigger deep learning inference every N frames
                if frame_counter % 4 == 0 and len(self.recent_frames) >= 16:
                    self._process_window(self.recent_frames)

            cap.release()
            if self.is_running:
                time.sleep(settings.cctv.reconnect_delay_seconds)

    def _process_window(self, frames_bgr):
        # 1. Preprocess frames
        rgb_list, rgb_tensor = self.extractor.extract_uniform_sequence(frames_bgr)

        # 2. Extract optical flow motion
        flow_tensor, motion_metrics = self.flow_extractor.extract_sequence_flow(rgb_list)

        # 3. Model forward pass
        raw_pred = self.model.predict_window(rgb_tensor, flow_tensor)

        # 4. Person proximity & interaction
        interaction_info = self.tracker.analyze_interaction(frames_bgr[-1])

        # 5. Measure scene illumination
        gray = cv2.cvtColor(frames_bgr[-1], cv2.COLOR_BGR2GRAY)
        luma = float(np.mean(gray))

        # 6. Intelligent decision filtering
        decision = self.decision_engine.evaluate(
            raw_prediction=raw_pred,
            motion_metrics=motion_metrics,
            interaction_info=interaction_info,
            luma_level=luma
        )
        self.latest_decision = decision

        # 7. Check if emergency SOS is triggered
        if decision.get("sos_trigger"):
            incident_id = f"INC-{self.camera_id}-{int(time.time())}"
            self.buffer.trigger_incident(incident_id)

            alert_payload = {
                "incident_id": incident_id,
                "camera_id": self.camera_id,
                "building": self.building,
                "location": self.location_coords,
                "category": decision["final_category"],
                "severity": decision["severity"],
                "confidence": decision["calibrated_confidence"],
                "timestamp": time.time(),
                "kinetic_breakdown": decision["kinetic_breakdown"],
                "proximity_breakdown": decision["proximity_breakdown"]
            }

            if self.on_alert_callback:
                self.on_alert_callback(alert_payload)
