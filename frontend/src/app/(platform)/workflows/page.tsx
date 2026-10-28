"use client";
import { usePermissions } from "@/hooks/use-permissions";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Workflow as WorkflowIcon,
  ArrowUpRight,
  Copy,
  Play,
  Archive,
  GitBranch,
} from "lucide-react";
import { toast } from "sonner";
import type { Workflow } from "@/types";
import { api, write } from "@/services/api";
import { Badge, Loading, Failure, Empty } from "@/components/shared";
export default function Page() {
  const { canEdit } = usePermissions();
  const router = useRouter(),
    client = useQueryClient();
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all");
  const { data, error } = useQuery({
    queryKey: ["workflows"],
    queryFn: () => api<Workflow[]>("/workflows"),
  });
  async function create(source?: Workflow) {
    try {
      const w = await write<Workflow>(
        "/workflows",
        source
          ? { ...source, name: source.name + " copy", status: "draft" }
          : {
              name: "Untitled workflow",
              description: "",
              nodes: [
                {
                  id: "trigger",
                  type: "core",
                  position: { x: 100, y: 150 },
                  data: { kind: "trigger", label: "Manual trigger" },
                },
                {
                  id: "output",
                  type: "core",
                  position: { x: 450, y: 150 },
                  data: { kind: "output", label: "Workflow output" },
                },
              ],
              edges: [{ id: "start-end", source: "trigger", target: "output" }],
            },
      );
      client.invalidateQueries({ queryKey: ["workflows"] });
      router.push("/workflows/" + w.id);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  async function archive(w: Workflow) {
    try {
      await write(
        "/workflows/" + w.id,
        { ...w, status: w.status === "archived" ? "draft" : "archived" },
        "PUT",
      );
      client.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow status updated");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  const visible =
    data?.filter(
      (w) =>
        (filter === "all" || filter === w.status) &&
        w.name.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">IDEAS INTO INTELLIGENT ACTION</div>
          <h1>
            Make work flow
            <span className="title-dot" />
          </h1>
          <p>A connected system of agents, tools, and possibilities.</p>
        </div>
        <button
          className="btn btn-primary"
          disabled={!canEdit}
          onClick={() => create()}
        >
          <Plus size={17} />
          Create workflow
        </button>
      </div>
      <div className="filter-bar">
        <div className="tabs">
          {["all", "active", "draft", "archived"].map((t) => (
            <button
              className={t === filter ? "selected" : ""}
              key={t}
              onClick={() => setFilter(t)}
            >
              {t === "all" ? "All workflows" : t}
            </button>
          ))}
        </div>
        <div className="filter-search">
          <Search size={16} />
          <input
            placeholder="Find a workflow…"
            aria-label="Search workflows"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      {error ? (
        <Failure error={error} />
      ) : !data ? (
        <Loading />
      ) : (
        <div className="workflow-grid">
          {visible.map((w, i) => (
            <article className="workflow-card" key={w.id}>
              <Link
                className={"workflow-preview preview-" + (i % 3)}
                href={"/workflows/" + w.id}
              >
                <div className="preview-grid" />
                <div className="preview-node">
                  <Play size={17} />
                </div>
                <div className="preview-wire" />
                <div className="preview-node middle">
                  <WorkflowIcon size={22} />
                </div>
                <div className="preview-wire" />
                <div className="preview-node">
                  <GitBranch size={19} />
                </div>
                <span className="preview-label">
                  <WorkflowIcon size={12} />
                  AGENT WORKFLOW
                </span>
                <span className="preview-open">
                  <ArrowUpRight size={17} />
                </span>
              </Link>
              <div className="workflow-card-content">
                <div className="workflow-title">
                  <h3>
                    <Link href={"/workflows/" + w.id}>{w.name}</Link>
                  </h3>
                  <Badge status={w.status} />
                </div>
                <p>{w.description || "A new idea, ready to take shape."}</p>
                <div className="workflow-card-bottom">
                  <span>
                    <GitBranch size={14} />
                    {w.nodes.length} nodes · {w.edges.length} connections
                  </span>
                  <div>
                    <button
                      title="Duplicate workflow"
                      disabled={!canEdit}
                      onClick={() => create(w)}
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      title={
                        w.status === "archived"
                          ? "Restore draft"
                          : "Archive workflow"
                      }
                      disabled={!canEdit}
                      onClick={() => archive(w)}
                    >
                      <Archive size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
          {visible.length === 0 && (
            <Empty
              text={
                data.length
                  ? "No workflows match your filters"
                  : "Build your first workflow"
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
