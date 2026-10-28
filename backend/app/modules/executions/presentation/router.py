from fastapi import Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy import select
from app.core.config import settings
from app.core.database import get_db
from app.core.security import current_user, builder
from app.shared.models import (
    Workflow,
    Execution,
    Step,
)
from app.shared.schemas import (
    RunWrite,
    ExecutionDTO,
    StepDTO,
)
from app.shared.repository import Repository
from app.modules.executions.service import ExecutionService
from app.workers.tasks import execute_workflow
from fastapi import APIRouter

router = APIRouter()


def dispatch(background, identifier):
    if settings().execution_mode == "celery":
        execute_workflow.delay(identifier)
    else:
        background.add_task(execute_workflow.run, identifier)


@router.post("/api/workflows/{identifier}/runs", response_model=ExecutionDTO)
def run(
    identifier: str,
    body: RunWrite,
    background: BackgroundTasks,
    user=Depends(builder),
    db=Depends(get_db),
):
    workflow = Repository(db, Workflow, user.organization_id).get(identifier)
    if workflow.status == "archived":
        raise HTTPException(409, "Archived workflows cannot run")
    execution = ExecutionService(db).create(workflow, body.input, body.idempotency_key)
    dto = ExecutionDTO.model_validate(execution)
    dispatch(background, execution.id)
    return dto


@router.get("/api/runs", response_model=list[ExecutionDTO])
def runs(
    user=Depends(current_user),
    db=Depends(get_db),
    status: str | None = None,
    workflow_id: str | None = None,
    limit: int = Query(100, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    query = Repository(db, Execution, user.organization_id).query()
    if status:
        query = query.where(Execution.status == status)
    if workflow_id:
        query = query.where(Execution.workflow_id == workflow_id)
    return [
        ExecutionDTO.model_validate(r)
        for r in db.scalars(query.order_by(Execution.created_at.desc()).limit(limit).offset(offset))
    ]


@router.get("/api/runs/{identifier}")
def run_detail(identifier: str, user=Depends(current_user), db=Depends(get_db)):
    run = Repository(db, Execution, user.organization_id).get(identifier)
    return {
        **ExecutionDTO.model_validate(run).model_dump(),
        "steps": [
            StepDTO.model_validate(s).model_dump()
            for s in db.scalars(
                select(Step).where(Step.execution_id == run.id).order_by(Step.created_at)
            )
        ],
    }


@router.post("/api/runs/{identifier}/{action}")
def run_action(
    identifier: str,
    action: str,
    background: BackgroundTasks,
    user=Depends(builder),
    db=Depends(get_db),
):
    run = Repository(db, Execution, user.organization_id).get(identifier)
    service = ExecutionService(db)
    if action == "approve":
        service.approve(run, user.email)
        dispatch(background, run.id)
    elif action == "retry" and run.status == "failed":
        workflow = Repository(db, Workflow, user.organization_id).get(run.workflow_id)
        run = service.create(workflow, run.input)
        dispatch(background, run.id)
    elif action == "cancel" and run.status in ("queued", "running", "waiting_approval"):
        run.status = "cancelled"
        service.audit(user.organization_id, user.email, "execution.cancelled", run.workflow_name)
        db.commit()
    else:
        raise HTTPException(409, "Action is not valid for this run")
    return {"id": run.id, "status": run.status}
