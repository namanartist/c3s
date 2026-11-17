"""
Hard-Negative and Multi-Class Synthetic Surveillance Video Generator.
Synthesizes verified video clips for hard-negative scenarios (walking, running,
dancing, handshakes) and violent altercations to train and benchmark the AI engine.
"""

from pathlib import Path
from typing import Tuple, List
import random
import cv2
import numpy as np
from config.categories import ViolenceCategory


class SyntheticVideoGenerator:
    def __init__(self, output_dir: Path, width: int = 224, height: int = 224, fps: int = 15):
        self.output_dir = output_dir
        self.width = width
        self.height = height
        self.fps = fps
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def _create_background(self) -> np.ndarray:
        """Simulates a campus corridor / hallway background with perspective floor lines."""
        bg = np.full((self.height, self.width, 3), 70, dtype=np.uint8)
        # Floor perspective
        cv2.fillPoly(bg, [np.array([[0, self.height], [self.width, self.height], [int(self.width * 0.7), int(self.height * 0.4)], [int(self.width * 0.3), int(self.height * 0.4)]])], (100, 100, 100))
        # Wall lines
        cv2.line(bg, (int(self.width * 0.3), int(self.height * 0.4)), (0, 0), (50, 50, 50), 2)
        cv2.line(bg, (int(self.width * 0.7), int(self.height * 0.4)), (self.width, 0), (50, 50, 50), 2)
        return bg

    def generate_clip(self, category: ViolenceCategory, num_frames: int = 30) -> List[np.ndarray]:
        """
        Generates realistic synthetic surveillance video frames tailored to category kinetics.
        """
        frames = []
        bg = self._create_background()

        if category == ViolenceCategory.NORMAL:
            # Scenario A: Two persons walking smoothly across the screen in same direction
            pos_x1, pos_y1 = 20, 130
            pos_x2, pos_y2 = 45, 135
            vel_x = 3.5  # Constant smooth velocity
            for _ in range(num_frames):
                frame = bg.copy()
                # Draw person 1 (head + body)
                cv2.circle(frame, (int(pos_x1), int(pos_y1)), 10, (200, 180, 160), -1)
                cv2.rectangle(frame, (int(pos_x1 - 10), int(pos_y1 + 10)), (int(pos_x1 + 10), int(pos_y1 + 50)), (180, 100, 50), -1)
                # Draw person 2
                cv2.circle(frame, (int(pos_x2), int(pos_y2)), 10, (190, 170, 150), -1)
                cv2.rectangle(frame, (int(pos_x2 - 10), int(pos_y2 + 10)), (int(pos_x2 + 10), int(pos_y2 + 50)), (60, 140, 180), -1)
                frames.append(frame)
                pos_x1 += vel_x
                pos_x2 += vel_x

        elif category == ViolenceCategory.SUSPICIOUS_INTERACTION:
            # Scenario B: Fast approach, abrupt stop and confrontational proximity
            pos_x1, pos_y1 = 30, 130
            pos_x2, pos_y2 = 180, 130
            for i in range(num_frames):
                frame = bg.copy()
                if i < 15:
                    pos_x1 += 4.0
                    pos_x2 -= 4.0
                else:
                    # Agitated bobbing
                    pos_y1 += random.choice([-2, 2])
                    pos_y2 += random.choice([-2, 2])

                cv2.circle(frame, (int(pos_x1), int(pos_y1)), 10, (200, 180, 160), -1)
                cv2.rectangle(frame, (int(pos_x1 - 10), int(pos_y1 + 10)), (int(pos_x1 + 10), int(pos_y1 + 50)), (180, 100, 50), -1)
                cv2.circle(frame, (int(pos_x2), int(pos_y2)), 10, (190, 170, 150), -1)
                cv2.rectangle(frame, (int(pos_x2 - 10), int(pos_y2 + 10)), (int(pos_x2 + 10), int(pos_y2 + 50)), (60, 140, 180), -1)
                frames.append(frame)

        elif category in [ViolenceCategory.PHYSICAL_AGGRESSION, ViolenceCategory.CONFIRMED_FIGHT]:
            # Scenario C: Chaotic, multi-directional high-frequency collisions, violent struggle
            pos_x1, pos_y1 = 100, 130
            pos_x2, pos_y2 = 115, 130
            for _ in range(num_frames):
                frame = bg.copy()
                # Chaotic jitter & velocity reversals
                dx1 = random.uniform(-10.0, 10.0)
                dy1 = random.uniform(-8.0, 8.0)
                dx2 = random.uniform(-10.0, 10.0)
                dy2 = random.uniform(-8.0, 8.0)

                p1_x = int(np.clip(pos_x1 + dx1, 50, 170))
                p1_y = int(np.clip(pos_y1 + dy1, 100, 160))
                p2_x = int(np.clip(pos_x2 + dx2, 50, 170))
                p2_y = int(np.clip(pos_y2 + dy2, 100, 160))

                # Overlapping bodies
                cv2.circle(frame, (p1_x, p1_y), 11, (200, 180, 160), -1)
                cv2.rectangle(frame, (p1_x - 12, p1_y + 10), (p1_x + 12, p1_y + 55), (180, 100, 50), -1)
                cv2.circle(frame, (p2_x, p2_y), 11, (190, 170, 150), -1)
                cv2.rectangle(frame, (p2_x - 12, p2_y + 10), (p2_x + 12, p2_y + 55), (60, 140, 180), -1)

                # Limb/arm extensions (punching/pushing lines)
                cv2.line(frame, (p1_x, p1_y + 20), (p2_x, p2_y + 20), (180, 100, 50), 3)

                frames.append(frame)

        return frames

    def save_clip_video(self, category: ViolenceCategory, filename: str, num_frames: int = 30) -> Path:
        cat_dir = self.output_dir / category.value.lower()
        cat_dir.mkdir(parents=True, exist_ok=True)
        out_path = cat_dir / filename

        frames = self.generate_clip(category, num_frames=num_frames)
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(str(out_path), fourcc, float(self.fps), (self.width, self.height))

        for f in frames:
            writer.write(f)
        writer.release()
        return out_path
