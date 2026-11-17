"""
Pydantic Schemas for FastAPI C3S Violence Detection Service.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class DetectionRequest(BaseModel):
    camera_id: str = Field(...)
    building: str = Field(default="Main Gate")
    location: Optional[Dict[str, float]] = Field(default_factory=lambda: {"lat": 26.2183, "lng": 78.1828})
    frames_b64: Optional[List[str]] = Field(default=None, description="List of base64-encoded JPEG/PNG frames")


class KineticBreakdown(BaseModel):
    mean_velocity: float
    peak_velocity: float
    motion_disorder: float
    is_chaotic: bool


class ProximityBreakdown(BaseModel):
    num_persons: int
    has_interaction: bool
    max_proximity_iou: float


class DetectionResponse(BaseModel):
    camera_id: str
    category: str
    severity: str
    confidence: float
    sos_triggered: bool
    incident_id: Optional[str] = None
    audit_reasons: List[str]
    kinetic_breakdown: KineticBreakdown
    proximity_breakdown: ProximityBreakdown
    class_probabilities: Dict[str, float]


class CameraStatus(BaseModel):
    camera_id: str
    name: str
    building: str
    source_uri: str
    status: str
    location: Dict[str, float]


class ModelInfo(BaseModel):
    model_name: str = "C3S MobileNetV3-LSTM Dual Stream"
    input_resolution: str = "224x224"
    temporal_window: int = 16
    optical_flow: str = "Farneback Dense Flow"
    classes: List[str]
    weights_path: str
    onnx_available: bool
