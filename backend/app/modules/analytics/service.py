from collections import Counter
from datetime import timedelta
from sqlalchemy import select
from app.shared.models import Execution, Workflow, Agent, Step, now


def summarize(db, organization_id):
    org = organization_id
    runs = list(db.scalars(select(Execution).where(Execution.organization_id == org)))
    workflows = list(db.scalars(select(Workflow).where(Workflow.organization_id == org)))
    agents = list(db.scalars(select(Agent).where(Agent.organization_id == org)))
    steps = list(db.scalars(select(Step).join(Execution).where(Execution.organization_id == org)))
    trend = []
    for ago in reversed(range(14)):
        date = (now() - timedelta(days=ago)).date()
        daily = [r for r in runs if r.created_at.date() == date]
        trend.append(
            {
                "date": date.isoformat(),
                "runs": len(daily),
                "succeeded": sum(r.status == "succeeded" for r in daily),
                "failed": sum(r.status == "failed" for r in daily),
            }
        )
    succeeded = sum(r.status == "succeeded" for r in runs)
    return {
        "workflows": len(workflows),
        "active_workflows": sum(w.status == "active" for w in workflows),
        "agents": len(agents),
        "runs": len(runs),
        "succeeded": succeeded,
        "failed": sum(r.status == "failed" for r in runs),
        "success_rate": round(succeeded / len(runs) * 100, 1) if runs else 0,
        "average_duration_ms": round(sum(r.duration_ms for r in runs) / len(runs)) if runs else 0,
        "trend": trend,
        "node_usage": [{"name": k, "value": v} for k, v in Counter(s.kind for s in steps).items()],
        "agent_usage": [
            {"name": k, "value": v}
            for k, v in Counter(s.label for s in steps if s.kind == "agent").items()
        ],
    }
