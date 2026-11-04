"""
ai_surveillance/engine/stream_engine.py
Real-Time Multi-Threaded RTSP / Camera Video Detection Engine.
Executes the full 6-stage Computer Vision pipeline with automated evidence capture.
"""

import time
import threading
from collections import deque
from pathlib import Path
from typing import Callable, Dict, List, Optional
import cv2
import numpy as np
import torch

from ai_surveillance.config.settings import settings
from ai_surveillance.config.categories import ActionCategory, IDX_TO_CATEGORY
from ai_surveillance.models.model_factory import create_model
from ai_surveillance.vision.person_detector import PersonDetector
from ai_surveillance.vision.multi_tracker import MultiPersonTracker
from ai_surveillance.vision.pose_estimator import PoseKinematicsEstimator
from ai_surveillance.vision.circular_buffer import CircularVideoBuffer
from ai_surveillance.vision.evidence_capture import EvidenceCaptureManager
from ai_surveillance.engine.decision_engine import SosDecisionEngine


class CameraStreamProcessor:
    """
    Dedicated detection processor for a single RTSP or webcam camera feed.
    """
    def __init__(
        self,
        camera_id: str,
        stream_source: str,
        location: str,
        on_sos_callback: Optional[Callable[[dict], None]] = None,
        model: Optional[torch.nn.Module] = None,
        device: Optional[torch.device] = None
    ):
        self.camera_id = camera_id
        self.stream_source = stream_source
        self.location = location
        self.on_sos_callback = on_sos_callback

        # 1. Pipeline Stages 1, 2, 3
        self.detector = PersonDetector(
            model_name=settings.YOLO_MODEL_NAME,
            conf_thresh=settings.YOLO_CONFIDENCE_THRESHOLD
        )
        self.tracker = MultiPersonTracker()
        self.pose_estimator = PoseKinematicsEstimator(
            model_name=settings.POSE_MODEL_NAME,
            conf_thresh=settings.POSE_CONFIDENCE_THRESHOLD
        )

        # 2. Pipeline Stage 4 & 5 (Model & Device)
        if model is not None and device is not None:
            self.model = model
            self.device = device
        else:
            self.model, self.device = create_model()
        self.model.eval()

        # 3. Pipeline Stage 6: SOS Decision & Evidence Capture
        self.decision_engine = SosDecisionEngine()
        self.circular_buffer = CircularVideoBuffer(
            fps=settings.TARGET_FPS,
            pre_event_seconds=settings.PRE_EVENT_BUFFER_SECONDS,
            post_event_seconds=settings.POST_EVENT_RECORD_SECONDS
        )
        self.evidence_mgr = EvidenceCaptureManager(
            images_dir=settings.IMAGES_DIR,
            videos_dir=settings.VIDEOS_DIR
        )

        # Sliding sequence buffer for temporal action recognition (T=16 frames)
        self.frame_tensor_buffer = deque(maxlen=settings.SEQUENCE_LENGTH)
        self.pose_vector_buffer = deque(maxlen=settings.SEQUENCE_LENGTH)

        # State & Threading
        self.is_running = False
        self.thread: Optional[threading.Thread] = None
        self.frame_count = 0
        self.current_fps = 0.0
        self.latest_telemetry: dict = {}

    def start(self):
        """Starts real-time video processing thread."""
        if self.is_running:
            return
        self.is_running = True
        self.thread = threading.Thread(target=self._processing_loop, daemon=True)
        self.thread.start()

    def stop(self):
        """Stops video stream processing."""
        self.is_running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=2.0)

    def _processing_loop(self):
        # Open RTSP / video capture
        cap = cv2.VideoCapture(int(self.stream_source) if self.stream_source.isdigit() else self.stream_source)
        # Low buffer size for zero RTSP latency
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        last_fps_time = time.time()
        fps_counter = 0

        while self.is_running and cap.isOpened():
            ret, frame = cap.read()
            if not ret or frame is None:
                # Brief sleep before reconnecting RTSP
                time.sleep(0.05)
                continue

            self.frame_count += 1
            now = time.time()

            # Push frame into rolling circular buffer continuously
            self.circular_buffer.push_frame(frame, timestamp=now)

            # Skip intermediate frames based on configured frame interval
            if self.frame_count % settings.FRAME_INTERVAL != 0:
                continue

            # Stage 1: Person Detection
            detections = self.detector.detect(frame)

            # Stage 2: Multi-Object Tracking
            tracked_subjects = self.tracker.update(detections)
            pairwise_contacts = self.tracker.get_pairwise_distances()

            # Stage 3: Pose Keypoints & Kinematics
            kinematics_by_track = self.pose_estimator.estimate(frame, tracked_subjects)
            kinematic_summary = {
                "is_rapid_punch_motion": any(k.get("is_rapid_punch_motion", False) for k in kinematics_by_track.values()),
                "is_rapid_kick_motion": any(k.get("is_rapid_kick_motion", False) for k in kinematics_by_track.values()),
                "is_posture_collapse": any(k.get("is_posture_collapse", False) for k in kinematics_by_track.values())
            }

            # Prepare tensors for Stage 4: Action Recognition
            resized_rgb = cv2.cvtColor(cv2.resize(frame, (224, 224)), cv2.COLOR_BGR2RGB)
            frame_tensor = torch.from_numpy(resized_rgb).permute(2, 0, 1).float() / 255.0
            self.frame_tensor_buffer.append(frame_tensor)

            # Flatten primary kinematic vector
            flat_kin = np.zeros(34, dtype=np.float32)
            if kinematics_by_track:
                first_kin = list(kinematics_by_track.values())[0]
                flat_kin = first_kin.get("flat_vector", flat_kin)
            self.pose_vector_buffer.append(torch.from_numpy(flat_kin))

            # Default prediction
            predicted_category = ActionCategory.NORMAL_INTERACTION
            aggression_score = 0.0

            # Execute Stage 4 Model Inference when temporal buffer is filled
            if len(self.frame_tensor_buffer) == settings.SEQUENCE_LENGTH:
                video_seq = torch.stack(list(self.frame_tensor_buffer)).unsqueeze(0).to(self.device)
                pose_seq = torch.stack(list(self.pose_vector_buffer)).unsqueeze(0).to(self.device)

                with torch.no_grad():
                    outputs = self.model(video_seq, pose_seq)
                    cat_idx = int(torch.argmax(outputs["action_logits"], dim=-1)[0].cpu().numpy())
                    predicted_category = IDX_TO_CATEGORY.get(cat_idx, ActionCategory.NORMAL_INTERACTION)
                    aggression_score = float(outputs["aggression_confidence"][0].cpu().numpy())

            # Stage 6: Threat Evaluation & SOS Decision (Tri-State Decision Engine)
            tracked_ids = [t.track_id for t in tracked_subjects] if tracked_subjects else [1]
            eval_result = self.decision_engine.evaluate_threat(
                camera_id=self.camera_id,
                predicted_category=predicted_category,
                raw_confidence=aggression_score,
                kinematic_flags=kinematic_summary,
                pairwise_contacts=pairwise_contacts,
                person_tracking_ids=tracked_ids
            )
            should_alert, should_trigger_sos, incident_info = eval_result.should_alert, eval_result.should_trigger_sos, eval_result.incident_payload

            # Structured logging on state change or significant activity
            if eval_result.state.value != "NORMAL" or self.frame_count % 30 == 0:
                rec = eval_result.log_record
                print(f"[{rec['decision_state']}] Cam: {rec['camera_id']} | Action: {rec['predicted_action']} | "
                      f"Normal: {rec['normal_confidence']} | Aggression: {rec['aggression_confidence']} | "
                      f"Consistency: {rec['temporal_consistency']} | SOS: {rec['sos_decision']} ({rec['reason']})")

            # If qualifying violent incident occurs -> Trigger SOS & Evidentiary Capture
            if should_trigger_sos and incident_info:
                self._dispatch_emergency_incident(frame, incident_info, tracked_subjects)

            # Calculate live FPS
            fps_counter += 1
            if now - last_fps_time >= 1.0:
                self.current_fps = round(fps_counter / (now - last_fps_time), 1)
                fps_counter = 0
                last_fps_time = now

            # Store real-time telemetry snapshot
            self.latest_telemetry = {
                "camera_id": self.camera_id,
                "location": self.location,
                "fps": self.current_fps,
                "tracked_persons": len(tracked_subjects),
                "predicted_action": predicted_category.value,
                "aggression_confidence": round(aggression_score, 3),
                "normal_confidence": eval_result.log_record["normal_confidence"],
                "decision_state": eval_result.state.value,
                "is_alert_active": should_alert,
                "timestamp": now
            }

        cap.release()

    def _dispatch_emergency_incident(
        self,
        trigger_frame: np.ndarray,
        incident_info: dict,
        tracked_subjects: list
    ):
        """
        Executes instant evidence snapshot capture and video recording.
        """
        incident_id = incident_info["incident_id"]

        # Format detection bounding boxes for evidence annotation
        boxes_meta = []
        for t in tracked_subjects:
            boxes_meta.append({
                "track_id": t.track_id,
                "bbox": t.bbox,
                "is_threat": True,
                "action": incident_info["category"]
            })

        # 1. Instant Forensic Snapshot Capture
        orig_img, annot_img, sha256_hash = self.evidence_mgr.capture_incident_snapshot(
            frame=trigger_frame,
            incident_id=incident_id,
            camera_id=self.camera_id,
            location=self.location,
            activity=incident_info["category"],
            confidence=incident_info["confidence"],
            boxes=boxes_meta
        )

        incident_info["image_original_path"] = str(orig_img)
        incident_info["image_annotated_path"] = str(annot_img)
        incident_info["image_sha256"] = sha256_hash
        incident_info["location"] = self.location

        # 2. Start Automatic Pre/Post Video Recording
        video_filename = f"{incident_id}_clip.mp4"
        video_path = settings.VIDEOS_DIR / video_filename
        incident_info["video_path"] = str(video_path)

        def on_video_saved(inc_id: str, saved_path: Path):
            vid_hash = EvidenceCaptureManager.calculate_file_hash(saved_path)
            print(f"[Evidence Manager]: Incident video {inc_id} saved: {saved_path} (SHA-256: {vid_hash[:12]}...)")

        self.circular_buffer.start_incident_capture(
            incident_id=incident_id,
            output_filepath=video_path,
            on_complete=on_video_saved
        )

        # 3. Trigger Emergency SOS Callback
        if self.on_sos_callback:
            try:
                self.on_sos_callback(incident_info)
            except Exception as e:
                print(f"[Stream Engine Error]: SOS callback dispatch failed: {e}")

