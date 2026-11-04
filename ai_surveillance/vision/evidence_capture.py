"""
ai_surveillance/vision/evidence_capture.py
Forensic snapshot capture, HUD bounding box annotation, and SHA-256 cryptographic hashing.
"""

import hashlib
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import cv2
import numpy as np


class EvidenceCaptureManager:
    """
    Manages forensic evidentiary packaging for CCTV aggression incidents.
    """
    def __init__(self, images_dir: Path, videos_dir: Path):
        self.images_dir = Path(images_dir)
        self.videos_dir = Path(videos_dir)
        self.images_dir.mkdir(parents=True, exist_ok=True)
        self.videos_dir.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def calculate_file_hash(filepath: Path) -> str:
        """
        Computes SHA-256 integrity checksum of media file for evidentiary chain of custody.
        """
        sha256 = hashlib.sha256()
        with open(filepath, "rb") as f:
            while chunk := f.read(65536):
                sha256.update(chunk)
        return sha256.hexdigest()

    def capture_incident_snapshot(
        self,
        frame: np.ndarray,
        incident_id: str,
        camera_id: str,
        location: str,
        activity: str,
        confidence: float,
        boxes: Optional[List[dict]] = None
    ) -> Tuple[Path, Path, str]:
        """
        Saves both original pristine frame and forensic HUD annotated snapshot.
        Returns (original_path, annotated_path, sha256_hash).
        """
        timestamp_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        file_prefix = f"{incident_id}_{int(time.time())}"

        # 1. Save original pristine frame
        orig_filename = f"{file_prefix}_raw.jpg"
        orig_path = self.images_dir / orig_filename
        cv2.imwrite(str(orig_path), frame)

        # 2. Generate forensic HUD annotated frame
        annotated = frame.copy()
        h, w = annotated.shape[:2]

        # Draw detected person boxes and threat vectors
        if boxes:
            for b in boxes:
                x1, y1, x2, y2 = b["bbox"]
                track_id = b.get("track_id", "N/A")
                is_threat = b.get("is_threat", False)
                color = (0, 0, 255) if is_threat else (0, 255, 0) # Red or Green

                cv2.rectangle(annotated, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
                tag = f"ID:{track_id} {b.get('action', '')}"
                cv2.putText(
                    annotated, tag, (int(x1), max(20, int(y1) - 6)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2
                )

        # Top Forensic Banner
        cv2.rectangle(annotated, (0, 0), (w, 40), (15, 23, 42), -1)
        banner_text = f"🚨 AI SURVEILLANCE SOS: {activity.upper()} ({confidence * 100:.1f}%)"
        cv2.putText(annotated, banner_text, (10, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 50, 255), 2)

        # Bottom Metadata HUD
        cv2.rectangle(annotated, (0, h - 35), (w, h), (15, 23, 42), -1)
        sub_text = f"CAM: {camera_id} | LOC: {location} | TIME: {timestamp_str}"
        cv2.putText(annotated, sub_text, (10, h - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)

        annot_filename = f"{file_prefix}_annotated.jpg"
        annot_path = self.images_dir / annot_filename
        cv2.imwrite(str(annot_path), annotated)

        # 3. Calculate cryptographic hash of original evidence
        evidence_hash = self.calculate_file_hash(orig_path)

        # 4. Save metadata sidecar
        meta = {
            "incident_id": incident_id,
            "camera_id": camera_id,
            "location": location,
            "activity": activity,
            "confidence": confidence,
            "timestamp": timestamp_str,
            "original_sha256": evidence_hash
        }
        with open(self.images_dir / f"{file_prefix}_meta.json", "w") as f:
            json.dump(meta, f, indent=2)

        return orig_path, annot_path, evidence_hash

