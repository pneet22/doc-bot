import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models import AuditLog, User
from app.schemas.audit import AuditLogOut


router = APIRouter(prefix="/audit-logs", tags=["audit logs"])


@router.get("", response_model=list[AuditLogOut])
def list_audit_logs(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin")),
) -> list[AuditLogOut]:
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(200).all()
    return [
        AuditLogOut(
            id=log.id,
            user_id=log.user_id,
            username=log.username,
            action=log.action,
            resource_type=log.resource_type,
            resource_id=log.resource_id,
            metadata=json.loads(log.metadata_json or "{}"),
            created_at=log.created_at,
        )
        for log in logs
    ]

