"""
Global Configuration and Hyperparameters for C3S Video Aggression Engine.
"""

import os
from pathlib import Path
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent.parent


class ModelConfig(BaseModel):
    # Input resolution and frame sequence parameters
    frame_width: int = 224
    frame_height: int = 224
    sequence_length: int = 16  # Frames per temporal analysis window
    flow_channels: int = 2     # Dense optical flow (dx, dy)
    feature_dim: int = 256     # Compressed spatial feature dimension
    flow_feature_dim: int = 128  # Compressed motion feature dimension
    lstm_hidden_dim: int = 256
    lstm_layers: int = 2
    bidirectional: bool = True
    dropout: float = 0.3
    num_classes: int = 4

    # Weights paths
    model_checkpoint_path: Path = BASE_DIR / "weights" / "violence_cnn_lstm.pt"
    onnx_model_path: Path = BASE_DIR / "weights" / "violence_cnn_lstm.onnx"


class ThresholdConfig(BaseModel):
    # Multi-class detection thresholds
    suspicious_threshold: float = 0.55
    aggression_threshold: float = 0.70
    fight_threshold: float = 0.85

    # False-positive suppression gates
    min_continuous_fight_frames: int = 8      # Minimum consecutive frames before SOS
    min_event_duration_seconds: float = 0.8   # Event must persist >= 800ms
    camera_alert_cooldown_seconds: float = 30.0  # Suppress duplicate alarms per camera
    min_person_interaction_iou: float = 0.05  # Must have overlapping / adjacent bounding boxes
    low_light_luma_threshold: float = 25.0    # Fallback to high-contrast flow under low light
    direction_reversal_threshold: float = 0.40 # High variance in flow vectors required


class CCTVConfig(BaseModel):
    # Stream settings
    fps_sample_rate: int = 15     # Process every Nth frame if stream FPS is high
    max_cameras: int = 16
    pre_event_buffer_seconds: int = 30
    post_event_buffer_seconds: int = 60
    reconnect_delay_seconds: float = 3.0
    buffer_directory: Path = BASE_DIR / "evidence_vault"


class ServerConfig(BaseModel):
    host: str = "0.0.0.0"
    port: int = 8000
    backend_api_url: str = os.getenv("VITE_API_BASE_URL", "http://localhost:3000")
    sos_endpoint: str = "/api/sos"
    mongodb_uri: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017/unimap")


class Settings(BaseModel):
    model: ModelConfig = ModelConfig()
    thresholds: ThresholdConfig = ThresholdConfig()
    cctv: CCTVConfig = CCTVConfig()
    server: ServerConfig = ServerConfig()


settings = Settings()
