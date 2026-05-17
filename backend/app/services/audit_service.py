import json
from typing import Any

from sqlalchemy.orm import Session

from app.models import AuditLog, User


def write_audit_log(
    db: Session,
    user: User | None,
    action: str,
    resource_type: str,
    resource_id: str | int | None = None,
    metadata: dict[str, Any] | None = None,
) -> AuditLog:
    log = AuditLog(
        user_id=user.id if user else None,
        username=user.username if user else "system",
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id is not None else None,
        metadata_json=json.dumps(metadata or {}),
    )
    db.add(log)
    return log

