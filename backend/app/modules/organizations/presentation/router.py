from fastapi import Depends
from sqlalchemy import select
from app.core.config import settings
from app.core.database import get_db
from app.core.security import current_user, admin
from app.shared.models import (
    OrganizationSettings,
    Organization,
)
from app.modules.executions.service import ExecutionService
from fastapi import APIRouter

router = APIRouter()


@router.get("/api/settings")
def get_settings(user=Depends(current_user), db=Depends(get_db)):
    record = db.scalar(
        select(OrganizationSettings).where(
            OrganizationSettings.organization_id == user.organization_id
        )
    )
    return {
        "organization": db.get(Organization, user.organization_id).name,
        "preferences": record.preferences if record else {},
        "execution_mode": settings().execution_mode,
        "provider": "demo",
        "tools": ["json_formatter", "email_draft", "document_parser", "delay"],
    }


@router.put("/api/settings")
def save_settings(body: dict, user=Depends(admin), db=Depends(get_db)):
    name = str(body.get("organization", "")).strip()
    if not 2 <= len(name) <= 120:
        raise ValueError("Organization name must contain 2 to 120 characters")
    db.get(Organization, user.organization_id).name = name
    record = db.scalar(
        select(OrganizationSettings).where(
            OrganizationSettings.organization_id == user.organization_id
        )
    )
    if not record:
        record = OrganizationSettings(organization_id=user.organization_id)
        db.add(record)
    record.preferences = {"notifications": bool(body.get("notifications", True))}
    ExecutionService(db).audit(user.organization_id, user.email, "settings.updated")
    db.commit()
    return {"ok": True}
