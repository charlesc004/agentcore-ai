from app.modules.analytics.service import summarize
from fastapi import Depends
from app.core.database import get_db
from app.core.security import current_user
from fastapi import APIRouter

router = APIRouter()


@router.get("/api/analytics")
def analytics(user=Depends(current_user), db=Depends(get_db)):
    return summarize(db, user.organization_id)
