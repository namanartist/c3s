"""
ai_surveillance/config/settings.py
Global system configuration and hyperparameters.
Supports Pydantic Settings when installed with pure standard-library dataclass fallback.
"""

import os
from pathlib import Path
from typing import List, Optional

BASE_DIR = Path(__file__).resolve().parent.parent

try:
    from pydantic import Field
    from pydantic_settings import BaseSettings

    class SurveillanceSettings(BaseSettings):
        PROJECT_NAME: str = "AI-Powered Aggression & Violence Surveillance System"
        VERSION: str = "1.0.0"
        ENVIRONMENT: str = Field(default="production", env="SURVEILLANCE_ENV")
        DEBUG: bool = Field(default=False, env="SURVEILLANCE_DEBUG")

        # Storage Paths
        EVIDENCE_DIR: Path = Field(default=BASE_DIR / "evidence")
        IMAGES_DIR: Path = Field(default=BASE_DIR / "evidence" / "images")
        VIDEOS_DIR: Path = Field(default=BASE_DIR / "evidence" / "videos")
        MODELS_DIR: Path = Field(default=BASE_DIR / "models" / "checkpoints")

        # Video & Stream Processing
        FRAME_WIDTH: int = 640
        FRAME_HEIGHT: int = 480
        TARGET_FPS: int = 30
        SEQUENCE_LENGTH: int = 16
        FRAME_INTERVAL: int = 2

        # Rolling Circular Buffer for Pre/Post Evidence
        PRE_EVENT_BUFFER_SECONDS: int = 10
        POST_EVENT_RECORD_SECONDS: int = 25
        CIRCULAR_BUFFER_MAX_FRAMES: int = TARGET_FPS * PRE_EVENT_BUFFER_SECONDS

        # Stage 1: Person & Object Detection (OpenCV Native HOG + MOG2)
        VISION_ENGINE: str = "opencv"
        OPENCV_DETECTOR_ENGINE: str = "opencv_hog_mog2"
        YOLO_MODEL_NAME: str = "opencv_hog_mog2"  # Backward-compatible alias
        YOLO_CONFIDENCE_THRESHOLD: float = 0.40
        YOLO_IOU_THRESHOLD: float = 0.50

        # Stage 2: Multi-Object Tracking (ByteTrack)
        TRACK_HIGH_THRESH: float = 0.60
        TRACK_LOW_THRESH: float = 0.10
        NEW_TRACK_THRESH: float = 0.70
        MATCH_THRESH: float = 0.80
        TRACK_BUFFER_FRAMES: int = 30

        # Stage 3: Pose Estimation
        POSE_MODEL_NAME: str = "yolov8m-pose.pt"
        POSE_CONFIDENCE_THRESHOLD: float = 0.50
        NUM_KEYPOINTS: int = 17

        # Stage 4 & 5: Action Recognition & Aggression Classification
        ACTION_MODEL_TYPE: str = "cnn_lstm"
        AGGRESSION_CONFIRMATION_FRAMES: int = 5
        AGGRESSION_SCORE_SMOOTHING: float = 0.75

        # Stage 6: SOS Decision Engine Thresholds
        ALERT_CONFIDENCE_THRESHOLD: float = 0.70
        SOS_DISPATCH_THRESHOLD: float = 0.82
        INCIDENT_DEBOUNCE_SECONDS: int = 30

        # Database & Message Broker
        DATABASE_URL: str = Field(
            default="postgresql+asyncpg://postgres:postgres@localhost:5432/c3s_surveillance",
            env="DATABASE_URL"
        )
        REDIS_URL: str = Field(
            default="redis://localhost:6379/0",
            env="REDIS_URL"
        )

        # API & WebSocket Server
        API_HOST: str = "0.0.0.0"
        API_PORT: int = 8000
        CORS_ORIGINS: List[str] = [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "*"
        ]

        # Security & Evidence Integrity
        HASH_ALGORITHM: str = "sha256"
        EVIDENCE_ENCRYPTION_KEY: Optional[str] = Field(default=None, env="EVIDENCE_ENCRYPTION_KEY")

        class Config:
            env_file = ".env"
            extra = "allow"

except ImportError:
    from dataclasses import dataclass, field

    @dataclass
    class SurveillanceSettings:
        PROJECT_NAME: str = "AI-Powered Aggression & Violence Surveillance System"
        VERSION: str = "1.0.0"
        ENVIRONMENT: str = os.getenv("SURVEILLANCE_ENV", "production")
        DEBUG: bool = os.getenv("SURVEILLANCE_DEBUG", "false").lower() == "true"

        EVIDENCE_DIR: Path = BASE_DIR / "evidence"
        IMAGES_DIR: Path = BASE_DIR / "evidence" / "images"
        VIDEOS_DIR: Path = BASE_DIR / "evidence" / "videos"
        MODELS_DIR: Path = BASE_DIR / "models" / "checkpoints"

        FRAME_WIDTH: int = 640
        FRAME_HEIGHT: int = 480
        TARGET_FPS: int = 30
        SEQUENCE_LENGTH: int = 16
        FRAME_INTERVAL: int = 2

        PRE_EVENT_BUFFER_SECONDS: int = 10
        POST_EVENT_RECORD_SECONDS: int = 25
        CIRCULAR_BUFFER_MAX_FRAMES: int = 300

        VISION_ENGINE: str = "opencv"
        OPENCV_DETECTOR_ENGINE: str = "opencv_hog_mog2"
        YOLO_MODEL_NAME: str = "opencv_hog_mog2"
        YOLO_CONFIDENCE_THRESHOLD: float = 0.40
        YOLO_IOU_THRESHOLD: float = 0.50

        TRACK_HIGH_THRESH: float = 0.60
        TRACK_LOW_THRESH: float = 0.10
        NEW_TRACK_THRESH: float = 0.70
        MATCH_THRESH: float = 0.80
        TRACK_BUFFER_FRAMES: int = 30

        POSE_MODEL_NAME: str = "yolov8m-pose.pt"
        POSE_CONFIDENCE_THRESHOLD: float = 0.50
        NUM_KEYPOINTS: int = 17

        ACTION_MODEL_TYPE: str = "cnn_lstm"
        AGGRESSION_CONFIRMATION_FRAMES: int = 5
        AGGRESSION_SCORE_SMOOTHING: float = 0.75

        ALERT_CONFIDENCE_THRESHOLD: float = 0.70
        SOS_DISPATCH_THRESHOLD: float = 0.82
        INCIDENT_DEBOUNCE_SECONDS: int = 30

        DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/c3s_surveillance")
        REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

        API_HOST: str = "0.0.0.0"
        API_PORT: int = 8000
        CORS_ORIGINS: List[str] = field(default_factory=lambda: [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "*"
        ])

        HASH_ALGORITHM: str = "sha256"
        EVIDENCE_ENCRYPTION_KEY: Optional[str] = os.getenv("EVIDENCE_ENCRYPTION_KEY", None)


settings = SurveillanceSettings()

settings.IMAGES_DIR.mkdir(parents=True, exist_ok=True)
settings.VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)
