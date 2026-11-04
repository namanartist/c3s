"""
ai_surveillance/backend/database/models.py
SQLAlchemy ORM models for cameras, incidents, evidence, and audit logs.
"""

from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text,
    DateTime, ForeignKey, BigInteger, JSON
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class CameraModel(Base):
    __tablename__ = "cameras"

    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    stream_url = Column(String(512), nullable=False)
    location = Column(String(256), nullable=False)
    campus_zone = Column(String(64), default="Academic Sector")
    latitude = Column(Float, default=26.23185102)
    longitude = Column(Float, default=78.20636481)
    floor_level = Column(Integer, default=0)
    status = Column(String(32), default="ONLINE")
    fps = Column(Float, default=30.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    incidents = relationship("IncidentModel", back_populates="camera")


class IncidentModel(Base):
    __tablename__ = "incidents"

    id = Column(String(64), primary_key=True)
    camera_id = Column(String(64), ForeignKey("cameras.id", ondelete="SET NULL"), nullable=True)
    category = Column(String(64), nullable=False)
    severity = Column(String(32), nullable=False)
    confidence = Column(Float, nullable=False)
    location = Column(String(256), nullable=False)
    duration_seconds = Column(Float, default=0.0)
    status = Column(String(32), default="ALERT_SENT")
    reported_by = Column(String(128), default="AI Kaggle RWF-2000 Temporal Classifier")
    notes = Column(Text, nullable=True)
    resolved_by = Column(String(128), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    camera = relationship("CameraModel", back_populates="incidents")
    evidence = relationship("EvidenceRecordModel", back_populates="incident", cascade="all, delete-orphan")
    audit_logs = relationship("IncidentAuditLogModel", back_populates="incident", cascade="all, delete-orphan")


class EvidenceRecordModel(Base):
    __tablename__ = "evidence_records"

    id = Column(String(64), primary_key=True)
    incident_id = Column(String(64), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    media_type = Column(String(32), nullable=False)  # ORIGINAL_SNAPSHOT, ANNOTATED_SNAPSHOT, VIDEO_CLIP
    file_path = Column(String(512), nullable=False)
    file_size_bytes = Column(BigInteger, nullable=False)
    sha256_hash = Column(String(64), nullable=False)
    pre_buffer_seconds = Column(Integer, default=10)
    post_buffer_seconds = Column(Integer, default=25)
    is_tamper_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    incident = relationship("IncidentModel", back_populates="evidence")


class IncidentAuditLogModel(Base):
    __tablename__ = "incident_audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(64), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    actor_id = Column(String(64), nullable=False)
    actor_role = Column(String(64), nullable=False)
    action = Column(String(64), nullable=False)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    incident = relationship("IncidentModel", back_populates="audit_logs")

