"use client";
import { usePermissions } from "@/hooks/use-permissions";
import { NodeInspector } from "./builder/panels/node-inspector";
import { presentGraph } from "./builder/lib/presentation";
import { CoreNode } from "./builder/nodes/core-node";
import { NodeLibrary } from "./builder/panels/node-library";
import { useGraphHistory } from "./builder/hooks/use-graph-history";
import { Undo2, Redo2, CheckCircle2, AlertCircle, Monitor } from "lucide-react";

import { useCallback, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type ReactFlowInstance,
} from "@xyflow/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Play, Check, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { api, write } from "@/services/api";
import type { Workflow, Agent, Run, NodeData } from "@/types";
import { Badge, Loading, Failure } from "@/components/shared";
const nodeTypes = { core: CoreNode };
export default function Builder({ identifier }: { identifier: string }) {
  const { data, error } = useQuery({
    queryKey: ["workflow", identifier],
    queryFn: () => api<Workflow>("/workflows/" + identifier),
  });
  if (error) return <Failure error={error} />;
  if (!data) return <Loading />;
  return <Editor key={identifier} workflow={data} />;
}
function Editor({ workflow }: { workflow: Workflow }) {
  const { canEdit } = usePermissions();
  const client = useQueryClient();
  const router = useRouter();
  const [flow, setFlow] = useState<ReactFlowInstance<Node<NodeData>> | null>(
    null,
  );
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>(
    workflow.nodes,
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow.edges);
  const [name, setName] = useState(workflow.name);
  const [selected, setSelected] = useState<string | null>(null),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(workflow.status),
    [input, setInput] = useState(
      "Urgent: our customer portal is broken and we need help.",
    );
  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: () => api<Agent[]>("/agents"),
  });
  const [validation, setValidation] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const readOnly = mobile || !canEdit;
  const locked = readOnly || busy;
  const { data: execution } = useQuery({
    queryKey: ["builder-run", runId],
    queryFn: () =>
      api<Run & { steps: import("@/types").Step[] }>("/runs/" + runId),
    enabled: !!runId,
    refetchInterval: (query) =>
      ["succeeded", "failed", "cancelled"].includes(
        query.state.data?.status || "",
      )
        ? false
        : 1200,
  });
  const history = useGraphHistory(nodes, edges, (next) => {
    setNodes(next.nodes);
    setEdges(next.edges);
    setDirty(true);
  });
  const renderedGraph = useMemo(
    () => presentGraph(nodes, edges, execution?.steps, readOnly),
    [nodes, edges, execution, readOnly],
  );
  const current = nodes.find((n) => n.id === selected);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  const connect = useCallback(
    (connection: Connection) => {
      if (locked) return;
      history.checkpoint();
      setEdges((e) => addEdge({ ...connection, type: "smoothstep" }, e));
      setDirty(true);
    },
    [setEdges, history, locked],
  );
  function add(
    kind: string,
    position?: {
      x: number;
      y: number;
    },
  ) {
    if (locked) return;
    history.checkpoint();
    const id = crypto.randomUUID();
    setNodes((n) => [
      ...n,
      {
        id,
        type: "core",
        position: position || {
          x: 100 + n.length * 80,
          y: 100 + (n.length % 3) * 160,
        },
        data: {
          kind,
          label: kind.charAt(0).toUpperCase() + kind.slice(1) + " step",
          ...(kind === "agent"
            ? { agent_id: agents.find((agent) => agent.enabled)?.id }
            : {}),
          ...(kind === "tool" ? { tool: "json_formatter" } : {}),
        },
      },
    ]);
    setSelected(id);
    setDirty(true);
  }
  function update(values: Partial<NodeData>) {
    if (locked) return;
    history.checkpoint();
    setNodes((ns) =>
      ns.map((n) =>
        n.id === selected ? { ...n, data: { ...n.data, ...values } } : n,
      ),
    );
    setDirty(true);
  }
  async function save(nextStatus = status) {
    const saved = await write<Workflow>(
      "/workflows/" + workflow.id,
      {
        name,
        description: workflow.description,
        status: nextStatus,
        nodes,
        edges,
      },
      "PUT",
    );
    client.setQueryData(["workflow", workflow.id], saved);
    setStatus(saved.status);
    setDirty(false);
    client.invalidateQueries({ queryKey: ["workflows"] });
    return saved;
  }
  async function action(kind: "save" | "validate" | "publish" | "run") {
    if (busy || !canEdit) return;
    setBusy(true);
    setValidation(null);
    try {
      await save(kind === "publish" ? "active" : status);
      if (kind === "validate" || kind === "publish") {
        await write("/workflows/" + workflow.id + "/validate", {});
        setValidation("Graph validated. All nodes are connected and ready.");
        toast.success(
          kind === "publish"
            ? "Workflow published"
            : "Graph is valid and ready to run",
        );
      } else if (kind === "run") {
        const run = await write<Run>("/workflows/" + workflow.id + "/runs", {
          input: { text: input },
          idempotency_key: crypto.randomUUID(),
        });
        setRunId(run.id);
        toast.success("Execution queued", {
          action: {
            label: "View run",
            onClick: () => router.push("/runs?run=" + run.id),
          },
        });
        client.invalidateQueries({ queryKey: ["runs"] });
      } else toast.success("Workflow saved");
    } catch (e) {
      setValidation((e as Error).message);
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="builder-page">
      <div className="builder-top">
        <div>
          <Link href="/workflows" aria-label="Back to workflows">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <input
              aria-label="Workflow name"
              className="workflow-name"
              disabled={locked}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setDirty(true);
              }}
            />
            <span className="builder-subtitle">
              <Badge status={status} />
              {dirty ? "Unsaved changes" : "All changes saved"}
            </span>
          </div>
        </div>
        <div className="builder-actions">
          <button
            className="btn btn-ghost"
            title="Undo graph change"
            aria-label="Undo graph change"
            disabled={!history.canUndo || locked}
            onClick={history.undo}
          >
            <Undo2 size={16} />
          </button>
          <button
            className="btn btn-ghost"
            title="Redo graph change"
            aria-label="Redo graph change"
            disabled={!history.canRedo || locked}
            onClick={history.redo}
          >
            <Redo2 size={16} />
          </button>
          <button
            disabled={busy || !canEdit}
            className="btn btn-outline"
            onClick={() => action("validate")}
          >
            <Check size={15} />
            Validate
          </button>
          <button
            disabled={busy || !canEdit}
            className="btn btn-outline"
            onClick={() => action("save")}
          >
            <Save size={15} />
            Save
          </button>
          <button
            disabled={busy || !canEdit}
            className="btn btn-outline"
            onClick={() => action("publish")}
          >
            Publish
          </button>
          <button
            disabled={busy || !canEdit}
            className="btn btn-primary"
            onClick={() => action("run")}
          >
            <Play size={15} />
            Test run
          </button>
        </div>
      </div>
      {validation && (
        <div className="builder-feedback" role="status">
          <AlertCircle size={15} />
          {validation}
          <button
            aria-label="Dismiss feedback"
            onClick={() => setValidation(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      {execution && (
        <div className="execution-strip">
          <CheckCircle2 size={15} />
          <strong>Test execution</strong>
          <Badge status={execution.status} />
          <span>
            {execution.steps.filter((s) => s.status === "succeeded").length} /{" "}
            {nodes.length} steps completed
          </span>
          <Link href={"/runs?run=" + execution.id}>
            Inspect run <ArrowUpRight size={14} />
          </Link>
        </div>
      )}
      {!canEdit && (
        <p className="builder-feedback">
          Read-only access. A builder or administrator can edit and run
          workflows.
        </p>
      )}
      <div className="mobile-builder-note">
        <Monitor size={17} />
        <span>
          Workflow inspection mode. Use a desktop or tablet to edit the graph.
        </span>
      </div>
      <div className="builder-layout">
        <NodeLibrary onAdd={add} disabled={locked} />
        <div className="flow-canvas">
          <div className="canvas-label">
            <span className="tiny-dot" />
            WORKFLOW STUDIO
            <span>
              {nodes.length} nodes · {edges.length} connections
            </span>
          </div>
          <div className="mobile-node-list">
            {nodes.map((node, index) => (
              <button key={node.id} onClick={() => setSelected(node.id)}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {node.data.label}
                <small>{node.data.kind}</small>
              </button>
            ))}
          </div>
          <ReactFlow
            onInit={setFlow}
            nodesDraggable={!locked}
            nodesConnectable={!locked}
            onNodeDragStart={() => history.checkpoint()}
            onBeforeDelete={async ({ nodes: removed }) => {
              if (locked) return false;
              if (
                removed.length &&
                !window.confirm(
                  "Remove the selected nodes and their connections?",
                )
              )
                return false;
              history.checkpoint();
              return true;
            }}
            nodes={renderedGraph.nodes}
            edges={renderedGraph.edges}
            nodeTypes={nodeTypes}
            onNodesChange={(changes) => {
              onNodesChange(
                locked
                  ? changes.filter(
                      (change) =>
                        change.type === "select" ||
                        change.type === "dimensions",
                    )
                  : changes,
              );
              if (
                !locked &&
                changes.some(
                  (c) => c.type !== "select" && c.type !== "dimensions",
                )
              )
                setDirty(true);
            }}
            onEdgesChange={(changes) => {
              onEdgesChange(
                locked
                  ? changes.filter((change) => change.type === "select")
                  : changes,
              );
              if (!locked && changes.some((c) => c.type !== "select"))
                setDirty(true);
            }}
            onConnect={connect}
            onNodeClick={(_, node) => setSelected(node.id)}
            onPaneClick={() => setSelected(null)}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
              e.preventDefault();
              const kind = e.dataTransfer.getData("application/agentcore");
              if (
                [
                  "trigger",
                  "agent",
                  "tool",
                  "condition",
                  "delay",
                  "approval",
                  "output",
                ].includes(kind)
              )
                add(
                  kind,
                  flow?.screenToFlowPosition({ x: e.clientX, y: e.clientY }),
                );
            }}
            minZoom={0.25}
            defaultViewport={{ x: 40, y: 100, zoom: 0.75 }}
            colorMode="dark"
            deleteKeyCode={locked ? null : ["Backspace", "Delete"]}
          >
            <Background gap={20} size={1} color="#23435f" />
            <Controls showInteractive={!readOnly} />
            <MiniMap
              nodeColor={(node) =>
                ({
                  trigger: "#34d399",
                  agent: "#a78bfa",
                  tool: "#3b82f6",
                  condition: "#fbbf24",
                  delay: "#fb7185",
                  approval: "#f472b6",
                  output: "#22d3ee",
                })[String(node.data.kind)] || "#64748b"
              }
              maskColor="#060b18cc"
            />
          </ReactFlow>
          <div className="canvas-hint">
            Drag to explore · Scroll to zoom · Select a node to configure
          </div>
        </div>
        <NodeInspector
          current={current}
          agents={agents}
          disabled={locked}
          input={input}
          setInput={setInput}
          update={update}
          onRemove={() => {
            if (
              locked ||
              !window.confirm("Remove this node and its connections?")
            )
              return;
            history.checkpoint();
            setNodes((ns) => ns.filter((node) => node.id !== selected));
            setEdges((es) =>
              es.filter(
                (edge) => edge.source !== selected && edge.target !== selected,
              ),
            );
            setSelected(null);
            setDirty(true);
          }}
        />
      </div>
    </div>
  );
}
