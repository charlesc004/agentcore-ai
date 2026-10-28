from fastapi import Depends, Query
from app.core.database import get_db
from app.core.security import current_user, builder
from app.shared.models import (
    Agent,
)
from app.shared.schemas import (
    AgentWrite,
    AgentDTO,
)
from app.shared.repository import Repository
from app.shared.catalog import CatalogService
from fastapi import APIRouter

router = APIRouter()


@router.get("/api/agents", response_model=list[AgentDTO])
def agents(
    user=Depends(current_user),
    db=Depends(get_db),
    limit: int = Query(100, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    return [
        AgentDTO.model_validate(a)
        for a in Repository(db, Agent, user.organization_id).list(limit, offset)
    ]


@router.post("/api/agents", response_model=AgentDTO)
def create_agent(body: AgentWrite, user=Depends(builder), db=Depends(get_db)):
    return AgentDTO.model_validate(CatalogService(db, user).save(Agent, body.model_dump()))


@router.put("/api/agents/{identifier}", response_model=AgentDTO)
def update_agent(identifier: str, body: AgentWrite, user=Depends(builder), db=Depends(get_db)):
    return AgentDTO.model_validate(
        CatalogService(db, user).save(Agent, body.model_dump(), identifier)
    )
