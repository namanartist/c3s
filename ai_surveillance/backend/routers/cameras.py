"""
ai_surveillance/backend/routers/cameras.py
REST endpoints for camera feed monitoring, stream health, and RTSP management.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ai_surveillance.backend.database.connection import get_db
from ai_surveillance.backend.database.models import CameraModel

router = APIRouter(prefix="/api/cameras", tags=["Cameras"])


class CameraCreateRequest(BaseModel):
    id: str
    name: str
    stream_url: str
    location: str
    campus_zone: str = "Academic Sector"
    latitude: float = 26.23185102
    longitude: float = 78.20636481
    floor_level: int = 0


@router.get("/")
async def list_cameras(db: AsyncSession = Depends(get_db)):
    """Returns all configured cameras and their real-time operational status."""
    result = await db.execute(select(CameraModel))
    cameras = result.scalars().all()
    return {"total": len(cameras), "cameras": cameras}


@router.get("/{camera_id}")
async def get_camera(camera_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves single camera metadata and connection parameters."""
    result = await db.execute(select(CameraModel).where(CameraModel.id == camera_id))
    cam = result.scalar_one_or_none()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    return cam


@router.post("/")
async def create_camera(payload: CameraCreateRequest, db: AsyncSession = Depends(get_db)):
    """Registers a new camera or authorized CCTV stream."""
    existing = await db.execute(select(CameraModel).where(CameraModel.id == payload.id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Camera ID already exists")

    new_cam = CameraModel(
        id=payload.id,
        name=payload.name,
        stream_url=payload.stream_url,
        location=payload.location,
        campus_zone=payload.campus_zone,
        latitude=payload.latitude,
        longitude=payload.longitude,
        floor_level=payload.floor_level
    )
    db.add(new_cam)
    await db.commit()
    await db.refresh(new_cam)
    return {"message": "Camera registered successfully", "camera": new_cam}

