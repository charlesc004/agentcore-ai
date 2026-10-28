from fastapi import Depends, Query
from app.core.database import get_db
from app.core.security import current_user
from app.shared.models import (
    AuditEvent,
)
from app.shared.schemas import (
    AuditDTO,
)
from app.shared.repository import Repository
from fastapi import APIRouter

router = APIRouter()


@router.get("/api/activity", response_model=list[AuditDTO])
def activity(
    user=Depends(current_user),
    db=Depends(get_db),
    limit: int = Query(100, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    return [
        AuditDTO.model_validate(a)
        for a in Repository(db, AuditEvent, user.organization_id).list(limit, offset)
    ]
