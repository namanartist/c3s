"""
ai_surveillance/vision/pose_estimator.py
Stage 3: Human Pose Estimation & Joint Kinematics.
Extracts 17 body keypoints, arm strike velocity (punches/slaps),
leg strike velocity (kicks), and torso collapse metrics.
"""

from typing import Dict, List, Optional, Tuple
import cv2
import numpy as np


class PoseKinematicsEstimator:
    """
    Extracts keypoints and calculates physical kinematic strike velocities.
    """
    def __init__(self, model_name: str = "yolov8m-pose.pt", conf_thresh: float = 0.50):
        self.model_name = model_name
        self.conf_thresh = conf_thresh
        self.model = None
        self.prev_keypoints_by_id: Dict[int, np.ndarray] = {}

        self._init_pose_model()

    def _init_pose_model(self):
        try:
            from ultralytics import YOLO
            self.model = YOLO(self.model_name)
        except Exception as e:
            print(f"Pose model loading note: {e}. Fallback heuristics active.")
            self.model = None

    def estimate(self, frame: np.ndarray, tracked_subjects: list) -> Dict[int, dict]:
        """
        Runs pose estimation on frame.
        Maps 17 keypoints and velocities to each active TrackedSubject.
        """
        results_by_track = {}
        if self.model is None or not tracked_subjects:
            return self._fallback_kinematics(tracked_subjects)

        # Predict poses
        pose_res = self.model.predict(source=frame, conf=self.conf_thresh, verbose=False)
        extracted_poses = []
        for r in pose_res:
            if hasattr(r, "keypoints") and r.keypoints is not None:
                kpts = r.keypoints.data.cpu().numpy()  # [NumPersons, 17, 3] (x, y, conf)
                extracted_poses.extend(kpts)

        # Associate each detected pose with the closest tracked subject centroid
        for track in tracked_subjects:
            t_cx, t_cy = track.centroid
            best_dist = float("inf")
            matched_kpts = None

            for kpts in extracted_poses:
                # Keypoints center (average of shoulders 5,6 and hips 11,12)
                valid = kpts[kpts[:, 2] > 0.3]
                if len(valid) >= 4:
                    k_cx = np.mean(valid[:, 0])
                    k_cy = np.mean(valid[:, 1])
                    d = np.hypot(k_cx - t_cx, k_cy - t_cy)
                    if d < best_dist and d < 120.0:
                        best_dist = d
                        matched_kpts = kpts

            if matched_kpts is not None:
                kinematics = self._compute_kinematics(track.track_id, matched_kpts)
                results_by_track[track.track_id] = kinematics
            else:
                results_by_track[track.track_id] = self._empty_kinematics()

        return results_by_track

    def _compute_kinematics(self, track_id: int, current_kpts: np.ndarray) -> dict:
        """
        Computes joint velocities and strike extension velocities:
        - Wrists (Idx 9, 10) vs Shoulders (Idx 5, 6)
        - Ankles (Idx 15, 16) vs Hips (Idx 11, 12)
        """
        prev_kpts = self.prev_keypoints_by_id.get(track_id)
        self.prev_keypoints_by_id[track_id] = current_kpts.copy()

        if prev_kpts is None:
            return self._empty_kinematics(current_kpts)

        # Delta displacement between consecutive frames
        delta = current_kpts[:, :2] - prev_kpts[:, :2]  # [17, 2]
        joint_speeds = np.linalg.norm(delta, axis=1)    # [17]

        # 1. Arm Strike Speed (Max velocity of left/right wrists)
        wrist_speed = float(max(joint_speeds[9], joint_speeds[10]))

        # 2. Leg Strike Speed (Max velocity of left/right ankles)
        ankle_speed = float(max(joint_speeds[15], joint_speeds[16]))

        # 3. Torso Downward Collapse (Downward velocity of hips/head)
        downward_velocity = float(max(delta[0, 1], delta[11, 1], delta[12, 1]))

        # Normalize 17 keypoint velocities as feature vector for Stage 4 action model [34]
        flat_kinematics = delta.flatten()[:34]
        if len(flat_kinematics) < 34:
            flat_kinematics = np.pad(flat_kinematics, (0, 34 - len(flat_kinematics)))

        return {
            "keypoints": current_kpts,
            "wrist_strike_speed": wrist_speed,
            "ankle_strike_speed": ankle_speed,
            "downward_collapse_speed": downward_velocity,
            "is_rapid_punch_motion": wrist_speed > 28.0,
            "is_rapid_kick_motion": ankle_speed > 32.0,
            "is_posture_collapse": downward_velocity > 35.0,
            "flat_vector": flat_kinematics.astype(np.float32)
        }

    def _empty_kinematics(self, kpts: Optional[np.ndarray] = None) -> dict:
        return {
            "keypoints": kpts if kpts is not None else np.zeros((17, 3), dtype=np.float32),
            "wrist_strike_speed": 0.0,
            "ankle_strike_speed": 0.0,
            "downward_collapse_speed": 0.0,
            "is_rapid_punch_motion": False,
            "is_rapid_kick_motion": False,
            "is_posture_collapse": False,
            "flat_vector": np.zeros(34, dtype=np.float32)
        }

    def _fallback_kinematics(self, tracked_subjects: list) -> Dict[int, dict]:
        res = {}
        for t in tracked_subjects:
            res[t.track_id] = self._empty_kinematics()
        return res

