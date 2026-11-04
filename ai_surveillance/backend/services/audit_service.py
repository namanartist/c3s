"""
ai_surveillance/backend/services/audit_service.py
Evidentiary chain-of-custody audit logging service.
"""

from datetime import datetime
from typing import Optional
from ai_surveillance.backend.database.models import IncidentAuditLogModel


class AuditTrailService:
    @staticmethod
    async def log_action(
        db,
        incident_id: str,
        actor_id: str,
        actor_role: str,
        action: str,
        details: Optional[dict] = None
    ) -> IncidentAuditLogModel:
        """
        Records an immutable audit event for an incident.
        """
        audit_entry = IncidentAuditLogModel(
            incident_id=incident_id,
            actor_id=actor_id,
            actor_role=actor_role,
            action=action,
            details=details or {},
            created_at=datetime.utcnow()
        )
        db.add(audit_entry)
        await db.commit()
        await db.refresh(audit_entry)
        return audit_entry

