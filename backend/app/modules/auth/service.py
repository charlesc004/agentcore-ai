from datetime import timedelta
import hashlib
import secrets
import jwt
from pwdlib import PasswordHash
from fastapi import HTTPException
from sqlalchemy import select
from app.core.config import settings
from app.shared.models import User, RefreshToken, now

passwords = PasswordHash.recommended()


class AuthService:
    def __init__(self, db):
        self.db = db

    def login(self, email, password):
        user = self.db.scalar(select(User).where(User.email == email.lower()))
        if not user or not passwords.verify(password, user.password_hash):
            raise HTTPException(401, "Invalid email or password")
        return self.issue(user)

    def issue(self, user):
        token = secrets.token_urlsafe(48)
        self.db.add(
            RefreshToken(
                user_id=user.id,
                digest=hashlib.sha256(token.encode()).hexdigest(),
                expires_at=now() + timedelta(days=7),
            )
        )
        access = jwt.encode(
            {"sub": user.id, "exp": now() + timedelta(minutes=30), "type": "access"},
            settings().jwt_secret,
            algorithm="HS256",
        )
        self.db.commit()
        return {"access_token": access, "refresh_token": token, "token_type": "bearer"}

    def rotate(self, token):
        record = self.db.scalar(
            select(RefreshToken)
            .where(RefreshToken.digest == hashlib.sha256(token.encode()).hexdigest())
            .with_for_update()
        )
        if not record or record.expires_at.replace(tzinfo=now().tzinfo) < now():
            raise HTTPException(401, "Refresh token expired")
        user = self.db.get(User, record.user_id)
        self.db.delete(record)
        return self.issue(user)
