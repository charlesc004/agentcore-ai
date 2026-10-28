import os

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["JWT_SECRET"] = "test-only-secret-with-at-least-thirty-two-characters"
import pytest
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.core.database import Base, get_db
from app.shared.models import Organization, User
from app.modules.auth.service import passwords
from app.main import app
from app.modules.auth.presentation.router import login_attempts


@pytest.fixture()
def context(monkeypatch):
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(engine, expire_on_commit=False)

    def override():
        with factory() as db:
            yield db

    app.dependency_overrides[get_db] = override
    monkeypatch.setattr(
        "app.modules.executions.presentation.router.dispatch", lambda background, identifier: None
    )
    login_attempts.clear()
    with factory() as db:
        org = Organization(name="Test workspace")
        other = Organization(name="Other workspace")
        db.add_all([org, other])
        db.flush()
        for role in ("admin", "builder", "viewer"):
            db.add(
                User(
                    organization_id=org.id,
                    email=role + "@example.com",
                    name="Test User",
                    role=role,
                    password_hash=passwords.hash("DemoPass123!"),
                )
            )
        db.commit()
        ids = org.id, other.id
    with TestClient(app) as client:
        yield client, factory, ids
    app.dependency_overrides.clear()
    engine.dispose()


@pytest.fixture()
def auth(context):
    client, _, _ = context
    token = client.post(
        "/api/auth/login", json={"email": "admin@example.com", "password": "DemoPass123!"}
    ).json()["access_token"]
    return {"Authorization": "Bearer " + token}
