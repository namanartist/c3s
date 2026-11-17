"""
Person Interaction Analysis & Multi-Person Tracking.
Verifies whether suspicious motion occurs within close human-to-human physical proximity.
Supports both OpenCV HOGDescriptor and adaptive spatial silhouette clustering.
"""

from typing import List, Tuple, Dict, Any
import cv2
import numpy as np


class PersonTracker:
    def __init__(self, min_confidence: float = 0.2):
        self.min_confidence = min_confidence
        self.use_hog = hasattr(cv2, "HOGDescriptor")
        if self.use_hog:
            try:
                self.hog = cv2.HOGDescriptor()
                self.hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
            except Exception:
                self.use_hog = False
        else:
            self.hog = None

    def detect_persons(self, frame_bgr: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Detects person bounding boxes: (x, y, w, h).
        Uses HOG where supported, with morphological human silhouette clustering fallback.
        """
        h, w = frame_bgr.shape[:2]

        if self.use_hog and self.hog is not None:
            scale = 400.0 / w if w > 400 else 1.0
            small_frame = cv2.resize(frame_bgr, (int(w * scale), int(h * scale)))
            boxes, _ = self.hog.detectMultiScale(
                small_frame,
                winStride=(8, 8),
                padding=(4, 4),
                scale=1.05
            )
            rescaled_boxes = []
            for box in boxes:
                x, y, bw, bh = box
                rescaled_boxes.append((
                    int(x / scale),
                    int(y / scale),
                    int(bw / scale),
                    int(bh / scale)
                ))
            return rescaled_boxes

        # Adaptive silhouette fallback: identifies separated human subject clusters
        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 21, 4
        )
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 9))
        dilated = cv2.dilate(thresh, kernel, iterations=2)

        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        candidate_boxes = []
        min_area = (h * w) * 0.01  # Subject must occupy at least 1% of frame
        max_area = (h * w) * 0.70

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if min_area < area < max_area:
                x, y, bw, bh = cv2.boundingRect(cnt)
                aspect_ratio = bh / float(bw) if bw > 0 else 0
                # Persons standing or moving have roughly vertical orientation (height > 0.8 * width)
                if aspect_ratio > 0.7:
                    candidate_boxes.append((x, y, bw, bh))

        return candidate_boxes

    def compute_iou(self, boxA: Tuple[int, int, int, int], boxB: Tuple[int, int, int, int]) -> float:
        """
        Computes Intersection over Union (IoU) of two bounding boxes.
        """
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[0] + boxA[2], boxB[0] + boxB[2])
        yB = min(boxA[1] + boxA[3], boxB[1] + boxB[3])

        interArea = max(0, xB - xA) * max(0, yB - yA)
        boxAArea = boxA[2] * boxA[3]
        boxBArea = boxB[2] * boxB[3]

        denom = float(boxAArea + boxBArea - interArea)
        return interArea / denom if denom > 0 else 0.0

    def analyze_interaction(self, frame_bgr: np.ndarray) -> Dict[str, Any]:
        """
        Analyzes the scene for multi-person proximity.
        Actual fights require at least 2 interacting bodies or severe clustering.
        """
        boxes = self.detect_persons(frame_bgr)
        num_persons = len(boxes)

        if num_persons < 2:
            return {
                "num_persons": num_persons,
                "has_interaction": False,
                "max_proximity_iou": 0.0,
                "boxes": boxes,
                "reason": "Single individual or solitary movement - violence suppressed"
            }

        # Check maximum pairwise IoU or expansion overlap
        max_iou = 0.0
        for i in range(num_persons):
            for j in range(i + 1, num_persons):
                b1 = boxes[i]
                b2 = boxes[j]
                exp_b1 = (b1[0] - int(b1[2] * 0.15), b1[1], int(b1[2] * 1.3), b1[3])
                exp_b2 = (b2[0] - int(b2[2] * 0.15), b2[1], int(b2[2] * 1.3), b2[3])

                iou = self.compute_iou(exp_b1, exp_b2)
                if iou > max_iou:
                    max_iou = iou

        has_interaction = max_iou > 0.02  # Close spatial adjacency

        return {
            "num_persons": num_persons,
            "has_interaction": has_interaction,
            "max_proximity_iou": round(max_iou, 4),
            "boxes": boxes,
            "reason": "Multi-person physical proximity verified" if has_interaction else "Dispersed individuals without physical contact"
        }
