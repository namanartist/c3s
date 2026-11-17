# C3S Advanced AI-Powered CCTV Violence & Fight Detection Engine

Production-grade, real-time CCTV violence, brawl, and physical aggression detection system designed for institutional campus surveillance at **MITS Gwalior** (Project C3S).

---

## 1. Architectural Highlights

- **No YOLO for Violence Classification**: Utilizes a deep-learning two-stream architecture combining spatial feature representation (**MobileNetV3**) and motion vector fields (**Farneback Dense Optical Flow**) feeding into a temporal sequence aggregator (**Bidirectional LSTM with Attention**).
- **Intelligent False-Positive Prevention**:
  - **Temporal Consistency & Smoothing**: Requires consecutive high-confidence temporal windows before triggering alarms.
  - **Kinetic Disorder Gate**: Differentiates uniform human motion (walking, jogging) from chaotic multi-directional fighting scuffles via circular variance $S = 1 - \bar{R}$.
  - **Person Proximity Gate**: Suppresses solitary runners, solo dancing, or solitary waving gestures.
  - **Per-Camera Cooldown & Hysteresis**: Prevents repeated alert flooding from the same camera.
  - **Low-Light / Occlusion Compensation**: Automatically adjusts confidence thresholds based on scene luminance.
- **Forensic Video Buffer**: Maintains a rolling ring buffer of **30 seconds pre-event** and **60 seconds post-event** footage saved automatically to MP4 when an incident occurs.
- **C3S SOS Integration**: Seamless REST and MongoDB bridge pushing verified incidents directly to the C3S Security Operations Center.

---

## 2. Directory Structure

```
ai-engine/
├── api/
│   ├── main.py               # FastAPI server
│   ├── schemas.py            # Pydantic request/response schemas
│   └── sos_bridge.py         # MongoDB & HTTP SOS dispatcher
├── config/
│   ├── categories.py         # Classification taxonomy (4 classes)
│   └── settings.py           # Hyperparameters & thresholds
├── datasets/
│   ├── dataset_loader.py     # Unified RWF-2000, UCF-Crime, RLVS loader
│   └── hard_negatives.py     # Hard-negative generator (walking, gestures)
├── evaluation/
│   └── evaluate.py           # Precision, Recall, F1, Confusion Matrix
├── inference/
│   ├── decision_engine.py    # Temporal smoothing, hysteresis, cooldown
│   ├── frame_buffer.py       # Rolling 30s pre / 60s post buffer
│   └── realtime_cctv.py      # Multi-camera async stream reader
├── models/
│   ├── mobilenet_extractor.py# MobileNetV3 spatial stream
│   ├── optical_flow_net.py   # Farneback motion stream
│   ├── temporal_lstm.py      # BiLSTM sequence aggregator
│   ├── violence_detector.py  # Composite two-stream network
│   └── export_onnx.py        # ONNX export utility
├── preprocessing/
│   ├── augmentations.py      # Spatial & photometric augmentations
│   ├── frame_extractor.py    # 16-frame uniform sampling
│   └── optical_flow.py       # Dense Farneback optical flow (dx, dy)
├── tests/
│   ├── test_api.py           # Endpoint validation
│   ├── test_false_positives.py # Zero-false-alarm benchmarks
│   └── test_pipeline.py      # End-to-end tensor verification
├── training/
│   ├── loss.py               # Multi-class Focal Loss
│   ├── trainer.py            # Training & validation loop
│   └── train.py              # Main training execution script
├── requirements.txt
└── README.md
```

---

## 3. Four-Class Taxonomy

| Class Index | Category | Severity | SOS Trigger | Description |
|---|---|---|---|---|
| `0` | `NORMAL` | LOW | No | Walking, jogging, standing, routine transit |
| `1` | `SUSPICIOUS_INTERACTION` | MEDIUM | No | Confrontational posturing, agitated gathering |
| `2` | `PHYSICAL_AGGRESSION` | HIGH | No | Shoving, grabbing, aggressive physical contact |
| `3` | `CONFIRMED_FIGHT` | CRITICAL | **Yes** | Multi-frame verified punches, kicks, grapple |

---

## 4. Quickstart

### 1. Install Dependencies
```bash
pip install -r ai-engine/requirements.txt
```

### 2. Run Tests
```bash
python -m pytest ai-engine/tests -v
```

### 3. Start the FastAPI Detection Microservice
```bash
uvicorn ai-engine.api.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive Swagger documentation is available at `http://localhost:8000/docs`.

### 4. Train / Benchmark the Model
```bash
python -m ai-engine.training.train --epochs 5 --batch-size 2
```
