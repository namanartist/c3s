"""
FastAPI Microservice for Real-Time CCTV Violence & Physical Aggression Detection.
"""

import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from typing import List, Dict, Any
import base64
import cv2
import numpy as np
import torch
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config.settings import settings
from config.categories import ViolenceCategory, CATEGORY_METADATA
from models.violence_detector import CCTVViolenceDetector
from preprocessing.frame_extractor import FrameExtractor
from preprocessing.optical_flow import DenseOpticalFlowExtractor
from tracking.person_tracker import PersonTracker
from inference.decision_engine import DecisionEngine
from api.schemas import DetectionRequest, DetectionResponse, ModelInfo, CameraStatus
from api.sos_bridge import SOSIncidentBridge

app = FastAPI(
    title="C3S CCTV Violence Detection Engine",
    description="Real-time deep learning engine for CCTV aggression detection using MobileNetV3 + Dense Optical Flow + BiLSTM.",
    version="1.0.0"
)

# CORS middleware for React frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global in-memory singletons
detector_model = CCTVViolenceDetector()
if settings.model.model_checkpoint_path.exists():
    try:
        ckpt = torch.load(str(settings.model.model_checkpoint_path), map_location="cpu")
        detector_model.load_state_dict(ckpt["model_state_dict"], strict=False)
        print(f"[Engine] Loaded trained weights from {settings.model.model_checkpoint_path}")
    except Exception as e:
        print(f"[Engine] Note: Running with initialized weights: {e}")

frame_extractor = FrameExtractor()
flow_extractor = DenseOpticalFlowExtractor()
person_tracker = PersonTracker()
sos_bridge = SOSIncidentBridge()

# Camera registry
cameras_db: Dict[str, Dict[str, Any]] = {
    "cam-08": {
        "camera_id": "cam-08",
        "name": "MITS Main Gate & Security Desk",
        "building": "Main Gate",
        "source_uri": "0",  # Live webcam index
        "status": "ONLINE",
        "location": {"lat": 26.2183, "lng": 78.1828}
    },
    "cam-01": {
        "camera_id": "cam-01",
        "name": "Administrative Corridor A",
        "building": "Admin Block",
        "source_uri": "rtsp://mock-cam-01/stream",
        "status": "ONLINE",
        "location": {"lat": 26.2185, "lng": 78.1830}
    }
}

decision_engines: Dict[str, DecisionEngine] = {}
incidents_vault: List[Dict[str, Any]] = []


def get_decision_engine(cam_id: str) -> DecisionEngine:
    if cam_id not in decision_engines:
        decision_engines[cam_id] = DecisionEngine(camera_id=cam_id)
    return decision_engines[cam_id]


@app.get("/api/v1/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "C3S Violence Detection Engine",
        "model_loaded": detector_model is not None,
        "device": "cuda" if torch.cuda.is_available() else "cpu"
    }


@app.get("/api/v1/model/info", response_model=ModelInfo)
def get_model_info():
    return ModelInfo(
        classes=[c.value for c in ViolenceCategory],
        weights_path=str(settings.model.model_checkpoint_path),
        onnx_available=settings.model.onnx_model_path.exists()
    )


@app.get("/api/v1/cameras", response_model=List[CameraStatus])
def list_cameras():
    return [CameraStatus(**c) for c in cameras_db.values()]


@app.get("/api/v1/incidents")
def list_incidents():
    return {"incidents": incidents_vault}


@app.post("/api/v1/detect", response_model=DetectionResponse)
async def detect_violence(
    camera_id: str = Form("cam-08"),
    video: UploadFile = File(None)
):
    """
    Receives an uploaded video clip (or extracts sequential frames)
    and processes it through the two-stream CNN-LSTM network with false-positive filtering.
    """
    frames = []
    if video is not None:
        contents = await video.read()
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        cap = cv2.VideoCapture(tmp_path)
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            frames.append(frame)
        cap.release()

    if len(frames) < 4:
        raise HTTPException(status_code=400, detail="Insufficient video frames provided for temporal inference.")

    # 1. Feature and Flow Extraction
    rgb_list, rgb_tensor = frame_extractor.extract_uniform_sequence(frames)
    flow_tensor, motion_metrics = flow_extractor.extract_sequence_flow(rgb_list)

    # 2. Deep Learning Inference
    raw_pred = detector_model.predict_window(rgb_tensor, flow_tensor)

    # 3. Proximity Analysis
    interaction_info = person_tracker.analyze_interaction(frames[-1])

    # 4. Illumination
    gray = cv2.cvtColor(frames[-1], cv2.COLOR_BGR2GRAY)
    luma = float(np.mean(gray))

    # 5. Intelligent Decision Filtering
    engine = get_decision_engine(camera_id)
    decision = engine.evaluate(raw_pred, motion_metrics, interaction_info, luma_level=luma)

    incident_id = None
    if decision.get("sos_trigger"):
        import time
        incident_id = f"SOS-C3S-{camera_id}-{int(time.time())}"
        cam_meta = cameras_db.get(camera_id, {})
        alert_payload = {
            "incident_id": incident_id,
            "camera_id": camera_id,
            "building": cam_meta.get("building", "Main Gate"),
            "location": cam_meta.get("location", {"lat": 26.2183, "lng": 78.1828}),
            "category": decision["final_category"],
            "severity": decision["severity"],
            "confidence": decision["calibrated_confidence"],
            "kinetic_breakdown": decision["kinetic_breakdown"],
            "proximity_breakdown": decision["proximity_breakdown"]
        }
        sos_bridge.dispatch_incident(alert_payload)
        incidents_vault.append(alert_payload)

    return DetectionResponse(
        camera_id=camera_id,
        category=decision["final_category"],
        severity=decision["severity"],
        confidence=decision["calibrated_confidence"],
        sos_triggered=decision["sos_trigger"],
        incident_id=incident_id,
        audit_reasons=decision["suppression_audit"],
        kinetic_breakdown=decision["kinetic_breakdown"],
        proximity_breakdown=decision["proximity_breakdown"],
        class_probabilities=raw_pred["class_probabilities"]
    )
