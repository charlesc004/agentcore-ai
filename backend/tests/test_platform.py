from copy import deepcopy
import pytest
from app.modules.workflows.validation import validate_graph
from app.modules.ai.providers import DemoProvider
from app.modules.tools.adapters import TOOLS
from app.modules.executions.service import ExecutionService
from app.shared.models import Agent, Workflow, Step
from app.shared.repository import Repository
from fastapi import HTTPException
from sqlalchemy import select


def graph(agent_id=None, approval=False, tool=None):
    def n(i, kind, **data):
        return {
            "id": i,
            "type": "core",
            "position": {"x": 0, "y": 0},
            "data": {"kind": kind, "label": i, **data},
        }

    nodes = [
        n("start", "trigger"),
        n("work", "agent", agent_id=agent_id) if not tool else n("work", "tool", tool=tool),
        n("out", "output"),
    ]
    if approval:
        nodes.insert(2, n("review", "approval"))
    edges = [
        {"id": str(i), "source": nodes[i]["id"], "target": nodes[i + 1]["id"]}
        for i in range(len(nodes) - 1)
    ]
    return nodes, edges


def setup_workflow(context, approval=False, tool=None):
    _, factory, (org, _) = context
    with factory() as db:
        agent = Agent(organization_id=org, name="Classifier", role="classify")
        db.add(agent)
        db.flush()
        nodes, edges = graph(agent.id, approval, tool)
        w = Workflow(
            organization_id=org, name="Test flow", status="active", nodes=nodes, edges=edges
        )
        db.add(w)
        db.commit()
        return w.id


def test_auth_and_refresh(context):
    client, _, _ = context
    assert (
        client.post(
            "/api/auth/login", json={"email": "admin@example.com", "password": "wrong"}
        ).status_code
        == 401
    )
    result = client.post(
        "/api/auth/login", json={"email": "admin@example.com", "password": "DemoPass123!"}
    ).json()
    assert (
        client.get(
            "/api/auth/me", headers={"Authorization": "Bearer " + result["access_token"]}
        ).json()["role"]
        == "admin"
    )
    refreshed = client.post("/api/auth/refresh", json={"refresh_token": result["refresh_token"]})
    assert refreshed.status_code == 200
    assert (
        client.post(
            "/api/auth/refresh", json={"refresh_token": result["refresh_token"]}
        ).status_code
        == 401
    )
    assert (
        client.post(
            "/api/auth/logout", json={"refresh_token": refreshed.json()["refresh_token"]}
        ).status_code
        == 200
    )
    assert (
        client.post(
            "/api/auth/refresh", json={"refresh_token": refreshed.json()["refresh_token"]}
        ).status_code
        == 401
    )


def test_permissions(context):
    client, _, _ = context
    token = client.post(
        "/api/auth/login", json={"email": "viewer@example.com", "password": "DemoPass123!"}
    ).json()["access_token"]
    headers = {"Authorization": "Bearer " + token}
    assert client.get("/api/agents", headers=headers).status_code == 200
    assert (
        client.post("/api/agents", json={"name": "Forbidden"}, headers=headers).status_code == 403
    )
    assert (
        client.put("/api/settings", json={"organization": "Forbidden"}, headers=headers).status_code
        == 403
    )


def test_isolation(context, auth):
    client, factory, (_, other) = context
    with factory() as db:
        a = Agent(organization_id=other, name="Private agent")
        db.add(a)
        db.commit()
        identifier = a.id
        with pytest.raises(HTTPException):
            Repository(db, Agent, context[2][0]).get(identifier)
    assert client.get("/api/agents", headers=auth).json() == []
    assert (
        client.put(
            "/api/agents/" + identifier, json={"name": "Access denied"}, headers=auth
        ).status_code
        == 404
    )


def test_agent_validation_and_workflow_crud(context, auth):
    client, _, _ = context
    assert (
        client.post("/api/agents", headers=auth, json={"name": "A", "role": "unknown"}).status_code
        == 422
    )
    agent = client.post(
        "/api/agents", headers=auth, json={"name": "Research agent", "role": "summarize"}
    ).json()
    nodes, edges = graph(agent["id"])
    response = client.post(
        "/api/workflows",
        headers=auth,
        json={"name": "Research pipeline", "status": "active", "nodes": nodes, "edges": edges},
    )
    assert response.status_code == 200
    identifier = response.json()["id"]
    assert client.post("/api/workflows/" + identifier + "/validate", headers=auth).json()["valid"]
    assert (
        client.get("/api/workflows/" + identifier, headers=auth).json()["name"]
        == "Research pipeline"
    )


def test_graph_rules():
    nodes, edges = graph("demo")
    assert validate_graph(nodes, edges) == ["start", "work", "out"]
    with pytest.raises(ValueError):
        validate_graph(nodes, edges + [{"source": "out", "target": "work"}])
    with pytest.raises(ValueError):
        validate_graph(nodes, [])
    with pytest.raises(ValueError):
        validate_graph(nodes, edges + [{"source": "missing", "target": "out"}])
    with pytest.raises(ValueError):
        validate_graph(nodes + [nodes[0]], edges)


def test_demo_and_tools():
    provider = DemoProvider()
    assert provider.execute("classify", "", "Urgent refund")["category"] == "urgent"
    assert provider.execute("classify", "", "Hello")["category"] == "general"
    assert provider.execute("draft", "", "Hi") == provider.execute("draft", "", "Hi")
    assert TOOLS["document_parser"].execute({"text": "One two three"}, {})["words"] == 3
    assert TOOLS["json_formatter"].execute({"a": 1}, {})["data"] == {"a": 1}
    assert TOOLS["email_draft"].execute({"text": "Hello"}, {})["status"] == "draft"


def test_end_to_end_execution(context, auth):
    client, factory, _ = context
    identifier = setup_workflow(context)
    response = client.post(
        "/api/workflows/" + identifier + "/runs",
        headers=auth,
        json={"input": {"text": "Urgent refund"}, "idempotency_key": "unique-run"},
    )
    assert response.status_code == 200
    run_id = response.json()["id"]
    assert (
        client.post(
            "/api/workflows/" + identifier + "/runs",
            headers=auth,
            json={"input": {}, "idempotency_key": "unique-run"},
        ).json()["id"]
        == run_id
    )
    with factory() as db:
        ExecutionService(db).execute(run_id)
        ExecutionService(db).execute(run_id)
    result = client.get("/api/runs/" + run_id, headers=auth).json()
    assert result["status"] == "succeeded"
    assert result["output"]["out"]["category"] == "urgent"
    assert len(result["steps"]) == 3
    stats = client.get("/api/analytics", headers=auth).json()
    assert stats["runs"] == 1 and stats["success_rate"] == 100
    assert client.get("/api/activity", headers=auth).json()


def test_approval_and_resume(context, auth):
    client, factory, _ = context
    identifier = setup_workflow(context, approval=True)
    run_id = client.post(
        "/api/workflows/" + identifier + "/runs", headers=auth, json={"input": {"text": "hello"}}
    ).json()["id"]
    with factory() as db:
        ExecutionService(db).execute(run_id)
    assert client.get("/api/runs/" + run_id, headers=auth).json()["status"] == "waiting_approval"
    assert client.post("/api/runs/" + run_id + "/approve", headers=auth).status_code == 200
    with factory() as db:
        ExecutionService(db).execute(run_id)
    assert client.get("/api/runs/" + run_id, headers=auth).json()["status"] == "succeeded"


def test_failure_retry_and_cancel(context, auth):
    client, factory, _ = context
    identifier = setup_workflow(context, tool="unavailable")
    with factory() as db:
        w = db.get(Workflow, identifier)
        nodes = deepcopy(w.nodes)
        nodes[1]["data"]["retries"] = 2
        w.nodes = nodes
        db.commit()
    run_id = client.post(
        "/api/workflows/" + identifier + "/runs", headers=auth, json={"input": {}}
    ).json()["id"]
    with factory() as db:
        ExecutionService(db).execute(run_id)
    detail = client.get("/api/runs/" + run_id, headers=auth).json()
    assert detail["status"] == "failed"
    assert next(s for s in detail["steps"] if s["node_id"] == "work")["attempts"] == 3
    retry = client.post("/api/runs/" + run_id + "/retry", headers=auth)
    assert retry.status_code == 200 and retry.json()["id"] != run_id
    assert (
        client.post("/api/runs/" + retry.json()["id"] + "/cancel", headers=auth).json()["status"]
        == "cancelled"
    )


def test_condition_routing(context):
    _, factory, (org, _) = context
    nodes = [
        {"id": i, "data": {"kind": kind, "label": i, **extra}}
        for i, kind, extra in [
            ("start", "trigger", {}),
            ("check", "condition", {"field": "text", "contains": "urgent"}),
            ("yes", "output", {}),
            ("no", "output", {}),
        ]
    ]
    edges = [
        {"source": "start", "target": "check"},
        {"source": "check", "target": "yes", "sourceHandle": "true"},
        {"source": "check", "target": "no", "sourceHandle": "false"},
    ]
    with factory() as db:
        w = Workflow(organization_id=org, name="Branch", nodes=nodes, edges=edges)
        db.add(w)
        db.commit()
        run = ExecutionService(db).create(w, {"text": "Urgent issue"})
        ExecutionService(db).execute(run.id)
        assert "yes" in run.output and "no" not in run.output
        assert (
            db.scalar(select(Step).where(Step.execution_id == run.id, Step.node_id == "no")).status
            == "skipped"
        )


@pytest.mark.parametrize("fail", [False, True])
def test_running_step_is_visible_and_cancellation_survives(context, monkeypatch, fail):
    from app.shared.models import Execution

    _, factory, _ = context
    identifier = setup_workflow(context, tool="json_formatter")
    original = ExecutionService.execute_node

    def cancel_during_tool(service, kind, config, data, org):
        if kind != "tool":
            return original(service, kind, config, data, org)
        with factory() as observer:
            step = observer.scalar(select(Step).where(Step.kind == "tool"))
            assert step.status == "running" and step.attempts == 1
            run = observer.get(Execution, step.execution_id)
            run.status = "cancelled"
            observer.commit()
        if fail:
            raise ValueError("Interrupted tool")
        return data

    monkeypatch.setattr(ExecutionService, "execute_node", cancel_during_tool)
    with factory() as db:
        service = ExecutionService(db)
        run = service.create(db.get(Workflow, identifier), {"text": "hello"})
        service.execute(run.id)
        db.refresh(run)
        assert run.status == "cancelled"
        step = db.scalar(select(Step).where(Step.execution_id == run.id, Step.kind == "tool"))
        assert step.status == "cancelled"
        assert (
            db.scalar(select(Step).where(Step.execution_id == run.id, Step.kind == "output"))
            is None
        )


@pytest.mark.parametrize("approval", [False, True])
def test_duration_is_recorded_before_approval_or_failure(context, monkeypatch, approval):
    from itertools import count

    clock = count()
    monkeypatch.setattr("app.modules.executions.service.perf_counter", lambda: next(clock))
    identifier = setup_workflow(
        context, approval=approval, tool=None if approval else "unavailable"
    )
    with context[1]() as db:
        service = ExecutionService(db)
        run = service.create(db.get(Workflow, identifier), {"text": "hello"})
        service.execute(run.id)
        db.refresh(run)
        assert run.status == ("waiting_approval" if approval else "failed")
        assert run.duration_ms > 0
        if not approval:
            step = db.scalar(
                select(Step).where(Step.execution_id == run.id, Step.status == "failed")
            )
            assert step.duration_ms > 0


def test_invalid_connection_semantics_are_rejected():
    nodes, edges = graph("demo")
    with pytest.raises(ValueError, match="Output nodes"):
        validate_graph(nodes, edges + [{"source": "out", "target": "work"}])
    with pytest.raises(ValueError, match="identifiers"):
        validate_graph(nodes, [edges[0], {**edges[1], "id": edges[0]["id"]}])
    with pytest.raises(ValueError, match="Branch handles"):
        validate_graph(nodes, [{**edges[0], "sourceHandle": "false"}, edges[1]])


def test_settings_validation_and_persistence(context, auth):
    client = context[0]
    assert client.put("/api/settings", headers=auth, json={"organization": " "}).status_code == 422
    result = client.put(
        "/api/settings",
        headers=auth,
        json={"organization": "Global Research", "notifications": False},
    )
    assert result.status_code == 200
    saved = client.get("/api/settings", headers=auth).json()
    assert saved["organization"] == "Global Research"
    assert saved["preferences"]["notifications"] is False
