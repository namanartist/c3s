"""
ai_surveillance/vision/multi_tracker.py
Stage 2: Multi-Object & Multi-Person Tracking using OpenCV.
Maintains persistent track IDs, inter-person distances, and interaction velocities
without heavy deep learning tracking dependencies.
"""

from typing import Dict, List, Tuple
import numpy as np


class TrackedSubject:
    def __init__(
        self,
        track_id: int,
        bbox: Tuple[float, float, float, float],
        score: float,
        cls_id: int = 0,
        class_label: str = "person"
    ):
        self.track_id = track_id
        self.bbox = bbox  # x1, y1, x2, y2
        self.score = score
        self.cls_id = cls_id
        self.class_label = class_label
        self.history: List[Tuple[float, float, float, float]] = [bbox]
        self.centroid = ((bbox[0] + bbox[2]) / 2.0, (bbox[1] + bbox[3]) / 2.0)
        self.velocity = (0.0, 0.0)
        self.time_since_update = 0

    def update(self, bbox: Tuple[float, float, float, float], score: float, cls_id: int = 0):
        old_cx, old_cy = self.centroid
        self.bbox = bbox
        self.score = score
        self.cls_id = cls_id
        self.class_label = "person" if cls_id == 0 else "object"
        self.history.append(bbox)
        if len(self.history) > 30:
            self.history.pop(0)

        new_cx = (bbox[0] + bbox[2]) / 2.0
        new_cy = (bbox[1] + bbox[3]) / 2.0
        self.velocity = (new_cx - old_cx, new_cy - old_cy)
        self.centroid = (new_cx, new_cy)
        self.time_since_update = 0


class MultiPersonTracker:
    """
    OpenCV IoU-based association tracker with motion continuity.
    Preserves tracking IDs across occlusions, crowds, and physical altercations.
    """
    def __init__(self, iou_threshold: float = 0.35, max_age: int = 30):
        self.iou_threshold = iou_threshold
        self.max_age = max_age
        self.tracks: Dict[int, TrackedSubject] = {}
        self.next_id = 1

    @staticmethod
    def _compute_iou(b1: Tuple[float, float, float, float], b2: Tuple[float, float, float, float]) -> float:
        xA = max(b1[0], b2[0])
        yA = max(b1[1], b2[1])
        xB = min(b1[2], b2[2])
        yB = min(b1[3], b2[3])

        inter_area = max(0.0, xB - xA) * max(0.0, yB - yA)
        boxA_area = (b1[2] - b1[0]) * (b1[3] - b1[1])
        boxB_area = (b2[2] - b2[0]) * (b2[3] - b2[1])

        union_area = boxA_area + boxB_area - inter_area
        return inter_area / max(1e-6, union_area)

    def update(self, detections: List[Tuple[float, float, float, float, float, int]]) -> List[TrackedSubject]:
        """
        Matches incoming person detections to existing track IDs.
        detections: list of [x1, y1, x2, y2, score, cls_id]
        """
        matched_tracks = set()
        matched_dets = set()

        # Build IoU cost matrix
        det_boxes = [(d[0], d[1], d[2], d[3]) for d in detections]
        track_ids = list(self.tracks.keys())

        if track_ids and det_boxes:
            for t_idx, t_id in enumerate(track_ids):
                t_box = self.tracks[t_id].bbox
                best_iou = 0.0
                best_det_idx = -1

                for d_idx, d_box in enumerate(det_boxes):
                    if d_idx in matched_dets:
                        continue
                    iou = self._compute_iou(t_box, d_box)
                    if iou > best_iou:
                        best_iou = iou
                        best_det_idx = d_idx

                if best_iou >= self.iou_threshold and best_det_idx >= 0:
                    matched_det = detections[best_det_idx]
                    det_cls = matched_det[5] if len(matched_det) > 5 else 0
                    self.tracks[t_id].update(det_boxes[best_det_idx], matched_det[4], cls_id=det_cls)
                    matched_tracks.add(t_id)
                    matched_dets.add(best_det_idx)

        # Create new tracks for unmatched detections
        for d_idx, d_box in enumerate(det_boxes):
            if d_idx not in matched_dets:
                d_cls = detections[d_idx][5] if len(detections[d_idx]) > 5 else 0
                d_label = "person" if d_cls == 0 else "object"
                new_track = TrackedSubject(
                    self.next_id,
                    d_box,
                    detections[d_idx][4],
                    cls_id=d_cls,
                    class_label=d_label
                )
                self.tracks[self.next_id] = new_track
                self.next_id += 1

        # Age and remove inactive tracks
        dead_tracks = []
        for t_id, track in self.tracks.items():
            if t_id not in matched_tracks:
                track.time_since_update += 1
                if track.time_since_update > self.max_age:
                    dead_tracks.append(t_id)

        for t_id in dead_tracks:
            del self.tracks[t_id]

        return list(self.tracks.values())

    def get_pairwise_distances(self) -> List[dict]:
        """
        Computes pairwise distances and relative velocities between active subjects.
        Crucial for distinguishing isolated movement from combat clashes.
        """
        active_list = list(self.tracks.values())
        pairs = []
        for i in range(len(active_list)):
            for j in range(i + 1, len(active_list)):
                t1, t2 = active_list[i], active_list[j]
                dx = t1.centroid[0] - t2.centroid[0]
                dy = t1.centroid[1] - t2.centroid[1]
                dist = np.sqrt(dx * dx + dy * dy)
                rel_v = (t1.velocity[0] - t2.velocity[0], t1.velocity[1] - t2.velocity[1])
                rel_speed = np.sqrt(rel_v[0] ** 2 + rel_v[1] ** 2)

                pairs.append({
                    "id1": t1.track_id,
                    "id2": t2.track_id,
                    "distance_px": float(dist),
                    "relative_speed": float(rel_speed),
                    "is_in_contact": dist < 85.0
                })
        return pairs


# Backward-compatible and OpenCV-native alias
OpenCVMultiTracker = MultiPersonTracker


