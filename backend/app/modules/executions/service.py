from time import perf_counter
from sqlalchemy import select, update
from fastapi import HTTPException
from app.shared.models import Execution, Step, Agent, AuditEvent
from app.modules.workflows.validation import validate_graph
from app.modules.ai.providers import DemoProvider, OpenAICompatibleProvider
from app.modules.tools.adapters import TOOLS


class ExecutionService:
    def __init__(self, db):
        self.db = db

    def audit(self, org, actor, action, detail=""):
        self.db.add(AuditEvent(organization_id=org, actor=actor, action=action, detail=detail))

    def create(self, workflow, data, key=None):
        validate_graph(workflow.nodes, workflow.edges)
        if key:
            existing = self.db.scalar(
                select(Execution).where(
                    Execution.organization_id == workflow.organization_id,
                    Execution.idempotency_key == key,
                )
            )
            if existing:
                return existing
        run = Execution(
            organization_id=workflow.organization_id,
            workflow_id=workflow.id,
            workflow_name=workflow.name,
            input=data,
            graph={"nodes": workflow.nodes, "edges": workflow.edges},
            idempotency_key=key,
        )
        self.db.add(run)
        self.db.flush()
        self.audit(run.organization_id, "system", "execution.queued", workflow.name)
        self.db.commit()
        return run

    def execute(self, identifier):
        claimed = self.db.execute(
            update(Execution)
            .where(Execution.id == identifier, Execution.status == "queued")
            .values(status="running")
        )
        self.db.commit()
        if not claimed.rowcount:
            return
        run = self.db.get(Execution, identifier)
        start = perf_counter()
        try:
            order = validate_graph(run.graph["nodes"], run.graph["edges"])
            previous = {
                s.node_id: s
                for s in self.db.scalars(select(Step).where(Step.execution_id == run.id))
            }
            outputs = {i: s.output for i, s in previous.items() if s.status == "succeeded"}
            skipped = {i for i, s in previous.items() if s.status == "skipped"}
            for identifier in order:
                self.db.refresh(run)
                if run.status == "cancelled":
                    return
                node = next(n for n in run.graph["nodes"] if n["id"] == identifier)
                config = node["data"]
                kind = config["kind"]
                if identifier in outputs or identifier in skipped:
                    continue
                parents = [e for e in run.graph["edges"] if e["target"] == identifier]
                active = [
                    e
                    for e in parents
                    if e["source"] in outputs
                    and (
                        e.get("sourceHandle") not in ("true", "false")
                        or outputs[e["source"]].get("branch") == (e["sourceHandle"] == "true")
                    )
                ]
                data = (
                    dict(run.input)
                    if not parents
                    else {k: v for e in active for k, v in outputs[e["source"]].items()}
                )
                step = previous.get(identifier) or Step(
                    execution_id=run.id,
                    node_id=identifier,
                    label=config.get("label", kind),
                    kind=kind,
                    status="running",
                    input=data,
                )
                self.db.add(step)
                if parents and not active:
                    step.status = "skipped"
                    skipped.add(identifier)
                    self.db.commit()
                    continue
                if kind == "approval":
                    step.status = "waiting"
                    run.status = "waiting_approval"
                    self.audit(
                        run.organization_id,
                        "system",
                        "execution.awaiting_approval",
                        run.workflow_name,
                    )
                    run.duration_ms += int((perf_counter() - start) * 1000)
                    self.db.commit()
                    return
                step_start = perf_counter()
                retries = min(max(int(config.get("retries", 0)), 0), 3)
                for attempt in range(retries + 1):
                    step.attempts = attempt + 1
                    self.db.commit()
                    try:
                        result = self.execute_node(kind, config, data, run.organization_id)
                        self.db.refresh(run)
                        if run.status == "cancelled":
                            self.finish_cancelled_step(run, step, step_start, start)
                            return
                        step.output, step.status = result, "succeeded"
                        outputs[identifier] = result
                        break
                    except Exception as exc:
                        self.db.refresh(run)
                        if run.status == "cancelled":
                            self.finish_cancelled_step(run, step, step_start, start)
                            return
                        if attempt == retries:
                            step.duration_ms = int((perf_counter() - step_start) * 1000)
                            step.status, step.error = "failed", str(exc)[:500]
                            self.db.commit()
                            raise
                step.duration_ms = int((perf_counter() - step_start) * 1000)
                self.db.commit()
            self.db.refresh(run)
            if run.status == "cancelled":
                return
            run.output = {
                i: outputs[i]
                for i in order
                if i in outputs
                and next(n for n in run.graph["nodes"] if n["id"] == i)["data"]["kind"] == "output"
            }
            run.status = "succeeded"
        except Exception as exc:
            self.db.refresh(run)
            if run.status != "cancelled":
                run.status, run.error = "failed", str(exc)[:500]
        run.duration_ms += int((perf_counter() - start) * 1000)
        self.audit(run.organization_id, "system", "execution." + run.status, run.workflow_name)
        self.db.commit()

    def finish_cancelled_step(self, run, step, step_start, start):
        step.status = "cancelled"
        step.duration_ms = int((perf_counter() - step_start) * 1000)
        run.duration_ms += int((perf_counter() - start) * 1000)
        self.db.commit()

    def execute_node(self, kind, config, data, org):
        if kind in ("trigger", "output"):
            return data
        if kind == "condition":
            return {
                **data,
                "branch": str(config.get("contains", "urgent")).lower()
                in str(data.get(config.get("field", "text"), "")).lower(),
            }
        if kind == "delay":
            return TOOLS["delay"].execute(data, config)
        if kind == "tool":
            name = config.get("tool", "json_formatter")
            if name not in TOOLS:
                raise ValueError("Tool is not available")
            return TOOLS[name].execute(data, config)
        if kind == "agent":
            agent = self.db.scalar(
                select(Agent).where(
                    Agent.id == config.get("agent_id"),
                    Agent.organization_id == org,
                    Agent.enabled.is_(True),
                )
            )
            if not agent:
                raise ValueError("Select an enabled agent from this organization")
            provider = DemoProvider() if agent.provider == "demo" else OpenAICompatibleProvider()
            return provider.execute(
                agent.role, agent.instructions, data.get("text", data), agent.model
            )
        raise ValueError("Unsupported node")

    def approve(self, run, actor):
        if run.status != "waiting_approval":
            raise HTTPException(409, "Run is not waiting for approval")
        step = self.db.scalar(
            select(Step).where(Step.execution_id == run.id, Step.status == "waiting")
        )
        step.status, step.output = "succeeded", {**step.input, "approved_by": actor}
        run.status = "queued"
        self.audit(run.organization_id, actor, "execution.approved", run.workflow_name)
        self.db.commit()
