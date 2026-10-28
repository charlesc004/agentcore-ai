from datetime import datetime
from typing import Literal, Any
from pydantic import BaseModel, ConfigDict, Field


class DTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Login(BaseModel):
    email: str = Field(max_length=254)
    password: str = Field(min_length=1, max_length=200)


class Refresh(BaseModel):
    refresh_token: str


class UserDTO(DTO):
    id: str
    name: str
    email: str
    role: str
    organization_id: str


class AgentWrite(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str = Field(default="", max_length=2000)
    role: Literal["summarize", "classify", "draft", "route", "transform"] = "summarize"
    provider: Literal["demo", "openai"] = "demo"
    model: str = Field(default="deterministic-v1", max_length=80)
    instructions: str = Field(default="", max_length=8000)
    tools: list[Literal["json_formatter", "email_draft", "document_parser", "delay"]] = Field(
        default_factory=list, max_length=4
    )
    enabled: bool = True


class AgentDTO(AgentWrite, DTO):
    id: str
    created_at: datetime


class NodeData(BaseModel):
    model_config = ConfigDict(extra="allow")
    kind: Literal["trigger", "agent", "tool", "condition", "output", "delay", "approval"]
    label: str = Field(min_length=1, max_length=120)
    retries: int = Field(default=0, ge=0, le=3)


class Node(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    type: str = "core"
    position: dict[str, float]
    data: NodeData


class Edge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: str | None = None
    targetHandle: str | None = None


class WorkflowWrite(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str = Field(default="", max_length=2000)
    status: Literal["draft", "active", "archived"] = "draft"
    nodes: list[Node] = Field(default_factory=list, max_length=100)
    edges: list[Edge] = Field(default_factory=list, max_length=300)


class WorkflowDTO(WorkflowWrite, DTO):
    id: str
    created_at: datetime


class RunWrite(BaseModel):
    input: dict[str, Any] = Field(default_factory=dict)
    idempotency_key: str | None = Field(default=None, max_length=100)


class ExecutionDTO(DTO):
    id: str
    workflow_id: str
    workflow_name: str
    status: str
    input: dict
    output: dict
    duration_ms: int
    error: str | None
    created_at: datetime


class StepDTO(DTO):
    id: str
    node_id: str
    label: str
    kind: str
    status: str
    input: dict
    output: dict
    attempts: int
    duration_ms: int
    error: str | None


class AuditDTO(DTO):
    id: str
    actor: str
    action: str
    detail: str
    created_at: datetime
