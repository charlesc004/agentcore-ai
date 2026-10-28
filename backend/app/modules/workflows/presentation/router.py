from fastapi import Depends, Query
from app.core.database import get_db
from app.core.security import current_user, builder
from app.shared.models import (
    Workflow,
)
from app.shared.schemas import (
    WorkflowWrite,
    WorkflowDTO,
)
from app.shared.repository import Repository
from app.shared.catalog import CatalogService
from app.modules.workflows.validation import validate_graph
from fastapi import APIRouter

router = APIRouter()


@router.get("/api/workflows", response_model=list[WorkflowDTO])
def workflows(
    user=Depends(current_user),
    db=Depends(get_db),
    limit: int = Query(100, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    return [
        WorkflowDTO.model_validate(w)
        for w in Repository(db, Workflow, user.organization_id).list(limit, offset)
    ]


@router.get("/api/workflows/{identifier}", response_model=WorkflowDTO)
def workflow(identifier: str, user=Depends(current_user), db=Depends(get_db)):
    return WorkflowDTO.model_validate(
        Repository(db, Workflow, user.organization_id).get(identifier)
    )


@router.post("/api/workflows", response_model=WorkflowDTO)
def create_workflow(body: WorkflowWrite, user=Depends(builder), db=Depends(get_db)):
    return WorkflowDTO.model_validate(CatalogService(db, user).save(Workflow, body.model_dump()))


@router.put("/api/workflows/{identifier}", response_model=WorkflowDTO)
def update_workflow(
    identifier: str, body: WorkflowWrite, user=Depends(builder), db=Depends(get_db)
):
    return WorkflowDTO.model_validate(
        CatalogService(db, user).save(Workflow, body.model_dump(), identifier)
    )


@router.post("/api/workflows/{identifier}/validate")
def validate(identifier: str, user=Depends(builder), db=Depends(get_db)):
    workflow = Repository(db, Workflow, user.organization_id).get(identifier)
    return {"valid": True, "order": validate_graph(workflow.nodes, workflow.edges)}
