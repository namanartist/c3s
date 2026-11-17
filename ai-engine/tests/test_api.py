"""
Unit Tests for FastAPI Endpoints.
"""

from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["service"] == "C3S Violence Detection Engine"


def test_model_info_endpoint():
    response = client.get("/api/v1/model/info")
    assert response.status_code == 200
    data = response.json()
    assert "NORMAL" in data["classes"]
    assert "CONFIRMED_FIGHT" in data["classes"]


def test_cameras_endpoint():
    response = client.get("/api/v1/cameras")
    assert response.status_code == 200
    cameras = response.json()
    assert isinstance(cameras, list)
    assert any(c["camera_id"] == "cam-08" for c in cameras)
