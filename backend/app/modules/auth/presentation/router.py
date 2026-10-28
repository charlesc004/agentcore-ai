from collections import defaultdict
import hashlib
import time
from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import current_user
from app.shared.models import (
    RefreshToken,
    User,
)
from app.shared.schemas import (
    Login,
    Refresh,
    UserDTO,
)
from app.modules.auth.service import AuthService
from app.modules.executions.service import ExecutionService
from fastapi import APIRouter

router = APIRouter()
login_attempts = defaultdict(list)


@router.post("/api/auth/login")
def login(body: Login, request: Request, db=Depends(get_db)):
    address = request.client.host
    login_attempts[address] = [t for t in login_attempts[address] if t > time.monotonic() - 60]
    if len(login_attempts[address]) >= 15:
        raise HTTPException(429, "Too many attempts. Try again in one minute.")
    login_attempts[address].append(time.monotonic())
    result = AuthService(db).login(body.email, body.password)
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    ExecutionService(db).audit(user.organization_id, user.email, "auth.login")
    db.commit()
    return result


@router.post("/api/auth/refresh")
def refresh(body: Refresh, db=Depends(get_db)):
    return AuthService(db).rotate(body.refresh_token)


@router.post("/api/auth/logout")
def logout(body: Refresh, db=Depends(get_db)):
    token = db.scalar(
        select(RefreshToken).where(
            RefreshToken.digest == hashlib.sha256(body.refresh_token.encode()).hexdigest()
        )
    )
    if token:
        db.delete(token)
        db.commit()
    return {"ok": True}


@router.get("/api/auth/me", response_model=UserDTO)
def me(user=Depends(current_user)):
    return UserDTO.model_validate(user)
