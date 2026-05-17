from datetime import datetime

from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: int
    user_id: int | None
    username: str
    action: str
    resource_type: str
    resource_id: str | None
    metadata: dict
    created_at: datetime

