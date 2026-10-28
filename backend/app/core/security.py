import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.database import get_db
from app.core.config import settings
from app.shared.models import User

bearer = HTTPBearer()


def current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer), db=Depends(get_db)):
    try:
        payload = jwt.decode(credentials.credentials, settings().jwt_secret, algorithms=["HS256"])
        if payload.get("type") != "access":
            raise ValueError()
        user = db.get(User, payload["sub"])
        if not user:
            raise ValueError()
        return user
    except (jwt.InvalidTokenError, ValueError, KeyError):
        raise HTTPException(401, "Invalid or expired session") from None


def builder(user=Depends(current_user)):
    if user.role not in ("admin", "builder"):
        raise HTTPException(403, "Builder access required")
    return user


def admin(user=Depends(current_user)):
    if user.role != "admin":
        raise HTTPException(403, "Admin access required")
    return user
