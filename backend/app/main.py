from app.modules.auth.presentation.router import router as auth_router
from app.modules.agents.presentation.router import router as agents_router
from app.modules.workflows.presentation.router import router as workflows_router
from app.modules.executions.presentation.router import router as executions_router
from app.modules.analytics.presentation.router import router as analytics_router
from app.modules.audit.presentation.router import router as audit_router
from app.modules.organizations.presentation.router import router as organizations_router
import json
import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings

app = FastAPI(title="AgentCore AI", version="1.0.0")
app.add_middleware(
    CORSMiddleware, allow_origins=[settings().cors_origin], allow_methods=["*"], allow_headers=["*"]
)
logger = logging.getLogger("agentcore")
logging.basicConfig(level=logging.INFO)


@app.middleware("http")
async def log_request(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    logger.info(
        json.dumps(
            {
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": round((time.perf_counter() - start) * 1000),
            }
        )
    )
    return response


@app.exception_handler(ValueError)
async def value_error(request, exc):
    return JSONResponse(status_code=422, content={"detail": str(exc)})


@app.get("/health")
def health():
    return {"status": "ok", "execution_mode": settings().execution_mode}


app.include_router(auth_router)


app.include_router(agents_router)


app.include_router(workflows_router)


app.include_router(executions_router)


app.include_router(analytics_router)


app.include_router(audit_router)


app.include_router(organizations_router)
