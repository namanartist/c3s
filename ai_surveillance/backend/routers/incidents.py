"""
ai_surveillance/backend/routers/incidents.py
REST endpoints for Incident Management:
View, review evidence, confirm, mark false positive, resolve, and export forensic report.
"""

from datetime import datetime
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from ai_surveillance.backend.database.connection import get_db
from ai_surveillance.backend.database.models import IncidentModel, EvidenceRecordModel, IncidentAuditLogModel
from ai_surveillance.backend.services.audit_service import AuditTrailService

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


class ReviewIncidentRequest(BaseModel):
    actor_id: str = "PROCTOR-ADMIN-01"
    actor_role: str = "PROCTOR"
    notes: Optional[str] = None


class ResolveIncidentRequest(BaseModel):
    actor_id: str = "PROCTOR-ADMIN-01"
    actor_role: str = "PROCTOR"
    resolution_notes: str


@router.get("/")
async def list_incidents(
    status_filter: Optional[str] = Query(None, alias="status"),
    severity_filter: Optional[str] = Query(None, alias="severity"),
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """Lists incidents with optional status and severity filtering."""
    query = select(IncidentModel).order_by(desc(IncidentModel.created_at))
    if status_filter:
        query = query.where(IncidentModel.status == status_filter)
    if severity_filter:
        query = query.where(IncidentModel.severity == severity_filter)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    incidents = result.scalars().all()
    return {"total": len(incidents), "data": incidents}


@router.get("/{incident_id}")
async def get_incident(incident_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves single incident with its evidence media and audit chain of custody."""
    result = await db.execute(select(IncidentModel).where(IncidentModel.id == incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    ev_result = await db.execute(select(EvidenceRecordModel).where(EvidenceRecordModel.incident_id == incident_id))
    evidence = ev_result.scalars().all()

    audit_result = await db.execute(select(IncidentAuditLogModel).where(IncidentAuditLogModel.incident_id == incident_id).order_by(IncidentAuditLogModel.created_at))
    audit_logs = audit_result.scalars().all()

    return {
        "incident": incident,
        "evidence": evidence,
        "audit_trail": audit_logs
    }


@router.post("/{incident_id}/confirm")
async def confirm_incident(
    incident_id: str,
    payload: ReviewIncidentRequest,
    db: AsyncSession = Depends(get_db)
):
    """Operator confirms the detected altercation is genuine."""
    result = await db.execute(select(IncidentModel).where(IncidentModel.id == incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.status = "CONFIRMED"
    if payload.notes:
        incident.notes = f"{incident.notes or ''} [Confirmed: {payload.notes}]"

    await AuditTrailService.log_action(
        db, incident_id, payload.actor_id, payload.actor_role,
        "CONFIRMED", {"notes": payload.notes}
    )
    await db.commit()
    return {"message": "Incident confirmed successfully", "incident_id": incident_id, "status": "CONFIRMED"}


@router.post("/{incident_id}/false-positive")
async def mark_false_positive(
    incident_id: str,
    payload: ReviewIncidentRequest,
    db: AsyncSession = Depends(get_db)
):
    """Operator flags the incident as a false alarm (e.g. sports or friendly play)."""
    result = await db.execute(select(IncidentModel).where(IncidentModel.id == incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.status = "FALSE_POSITIVE"
    incident.notes = f"{incident.notes or ''} [False Positive: {payload.notes or 'No reason provided'}]"

    await AuditTrailService.log_action(
        db, incident_id, payload.actor_id, payload.actor_role,
        "FALSE_POSITIVE_MARKED", {"notes": payload.notes}
    )
    await db.commit()
    return {"message": "Incident marked as false positive", "incident_id": incident_id, "status": "FALSE_POSITIVE"}


@router.post("/{incident_id}/resolve")
async def resolve_incident(
    incident_id: str,
    payload: ResolveIncidentRequest,
    db: AsyncSession = Depends(get_db)
):
    """Resolves incident following intervention by security personnel."""
    result = await db.execute(select(IncidentModel).where(IncidentModel.id == incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.status = "RESOLVED"
    incident.resolved_by = payload.actor_id
    incident.resolved_at = datetime.utcnow()
    incident.notes = f"{incident.notes or ''} [Resolved: {payload.resolution_notes}]"

    await AuditTrailService.log_action(
        db, incident_id, payload.actor_id, payload.actor_role,
        "RESOLVED", {"notes": payload.resolution_notes}
    )
    await db.commit()
    return {"message": "Incident resolved successfully", "incident_id": incident_id, "status": "RESOLVED"}


@router.get("/{incident_id}/report")
async def export_incident_report(incident_id: str, db: AsyncSession = Depends(get_db)):
    """Exports structured evidentiary report for administrative or disciplinary review."""
    result = await db.execute(select(IncidentModel).where(IncidentModel.id == incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    ev_result = await db.execute(select(EvidenceRecordModel).where(EvidenceRecordModel.incident_id == incident_id))
    evidence = ev_result.scalars().all()

    audit_result = await db.execute(select(IncidentAuditLogModel).where(IncidentAuditLogModel.incident_id == incident_id))
    audit_logs = audit_result.scalars().all()

    report = {
        "report_generated_at": datetime.utcnow().isoformat(),
        "incident_id": incident.id,
        "camera_id": incident.camera_id,
        "location": incident.location,
        "category": incident.category,
        "severity": incident.severity,
        "confidence": incident.confidence,
        "status": incident.status,
        "duration_seconds": incident.duration_seconds,
        "evidence_files": [
            {
                "type": e.media_type,
                "file_path": e.file_path,
                "sha256": e.sha256_hash,
                "tamper_verified": e.is_tamper_verified
            } for e in evidence
        ],
        "audit_chain_of_custody": [
            {
                "actor": log.actor_id,
                "role": log.actor_role,
                "action": log.action,
                "timestamp": log.created_at.isoformat(),
                "details": log.details
            } for log in audit_logs
        ]
    }
    return report

