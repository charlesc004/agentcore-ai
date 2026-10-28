from celery import Celery
from app.core.config import settings
from app.core.database import Session
from app.modules.executions.service import ExecutionService

celery = Celery("agentcore", broker=settings().redis_url)
celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    enable_utc=True,
    timezone="UTC",
    broker_connection_retry_on_startup=True,
)


@celery.task(name="execute_workflow")
def execute_workflow(identifier):
    with Session() as db:
        ExecutionService(db).execute(identifier)
