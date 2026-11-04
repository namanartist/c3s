"""
ai_surveillance/engine/__init__.py
"""
from ai_surveillance.engine.decision_engine import SosDecisionEngine

try:
    from ai_surveillance.engine.stream_engine import CameraStreamProcessor
    __all__ = ["SosDecisionEngine", "CameraStreamProcessor"]
except ImportError:
    __all__ = ["SosDecisionEngine"]
