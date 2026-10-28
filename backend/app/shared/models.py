from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import String, ForeignKey, JSON, DateTime, UniqueConstraint, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


def now():
    return datetime.now(timezone.utc)


class Record:
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, index=True)


class Organization(Record, Base):
    __tablename__ = "organizations"
    name: Mapped[str] = mapped_column(String(120))


class Scoped(Record):
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), index=True)


class User(Scoped, Base):
    __tablename__ = "users"
    email: Mapped[str] = mapped_column(String(254), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str] = mapped_column(Text)
    role: Mapped[str] = mapped_column(String(20), default="viewer")


class RefreshToken(Record, Base):
    __tablename__ = "refresh_tokens"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    digest: Mapped[str] = mapped_column(String(64), unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Agent(Scoped, Base):
    __tablename__ = "agents"
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text, default="")
    role: Mapped[str] = mapped_column(String(60), default="summarize")
    provider: Mapped[str] = mapped_column(String(40), default="demo")
    model: Mapped[str] = mapped_column(String(80), default="deterministic-v1")
    instructions: Mapped[str] = mapped_column(Text, default="")
    tools: Mapped[list] = mapped_column(JSON, default=list)
    enabled: Mapped[bool] = mapped_column(default=True)


class Workflow(Scoped, Base):
    __tablename__ = "workflows"
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(30), default="draft")
    nodes: Mapped[list] = mapped_column(JSON, default=list)
    edges: Mapped[list] = mapped_column(JSON, default=list)


class Execution(Scoped, Base):
    __tablename__ = "executions"
    __table_args__ = (UniqueConstraint("organization_id", "idempotency_key"),)
    workflow_id: Mapped[str] = mapped_column(ForeignKey("workflows.id"), index=True)
    workflow_name: Mapped[str] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(30), default="queued", index=True)
    input: Mapped[dict] = mapped_column(JSON, default=dict)
    output: Mapped[dict] = mapped_column(JSON, default=dict)
    graph: Mapped[dict] = mapped_column(JSON)
    duration_ms: Mapped[int] = mapped_column(default=0)
    idempotency_key: Mapped[str | None] = mapped_column(String(100), nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)


class Step(Record, Base):
    __tablename__ = "execution_steps"
    execution_id: Mapped[str] = mapped_column(ForeignKey("executions.id"), index=True)
    node_id: Mapped[str] = mapped_column(String(80))
    label: Mapped[str] = mapped_column(String(120))
    kind: Mapped[str] = mapped_column(String(30))
    status: Mapped[str] = mapped_column(String(30))
    input: Mapped[dict] = mapped_column(JSON, default=dict)
    output: Mapped[dict] = mapped_column(JSON, default=dict)
    duration_ms: Mapped[int] = mapped_column(default=0)
    attempts: Mapped[int] = mapped_column(default=0)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)


class AuditEvent(Scoped, Base):
    __tablename__ = "audit_events"
    actor: Mapped[str] = mapped_column(String(254))
    action: Mapped[str] = mapped_column(String(120))
    detail: Mapped[str] = mapped_column(Text, default="")


class OrganizationSettings(Scoped, Base):
    __tablename__ = "organization_settings"
    __table_args__ = (UniqueConstraint("organization_id"),)
    preferences: Mapped[dict] = mapped_column(JSON, default=dict)
