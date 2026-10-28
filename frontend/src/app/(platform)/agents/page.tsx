"use client";
import { usePermissions } from "@/hooks/use-permissions";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Plus, ArrowUpRight, Search, Blocks } from "lucide-react";
import { toast } from "sonner";
import { api, write } from "@/services/api";
import type { Agent } from "@/types";
import AgentForm from "@/features/agents/agent-form";
import { Badge, Failure, Loading, Empty } from "@/components/shared";
export default function Page() {
  const { canEdit } = usePermissions();
  const client = useQueryClient();
  const [editing, setEditing] = useState<Agent | null | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [pending, setPending] = useState<string | null>(null);
  const { data, error } = useQuery({
    queryKey: ["agents"],
    queryFn: () => api<Agent[]>("/agents"),
  });
  async function save(values: unknown) {
    try {
      await write(
        "/agents" + (editing ? "/" + editing.id : ""),
        values,
        editing ? "PUT" : "POST",
      );
      await client.invalidateQueries({ queryKey: ["agents"] });
      setEditing(undefined);
      toast.success("Agent configuration saved");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  async function toggle(agent: Agent) {
    setPending(agent.id);
    try {
      await write(
        "/agents/" + agent.id,
        { ...agent, enabled: !agent.enabled },
        "PUT",
      );
      await client.invalidateQueries({ queryKey: ["agents"] });
      toast.success(agent.enabled ? "Agent disabled" : "Agent enabled");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setPending(null);
    }
  }
  const visible =
    data?.filter(
      (agent) =>
        agent.name.toLowerCase().includes(search.toLowerCase()) &&
        (filter === "all" ||
          (filter === "active" ? agent.enabled : !agent.enabled)),
    ) ?? [];
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">SPECIALIZED MINDS. SHARED PURPOSE.</div>
          <h1>
            Your agent team
            <span className="title-dot" />
          </h1>
          <p>Give every agent a purpose. Give your team a superpower.</p>
        </div>
        <button
          className="btn btn-primary"
          disabled={!canEdit}
          onClick={() => setEditing(null)}
        >
          <Plus size={17} />
          Create agent
        </button>
      </div>
      <div className="filter-bar">
        <div className="tabs">
          {["all", "active", "inactive"].map((f) => (
            <button
              key={f}
              className={filter === f ? "selected" : ""}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="filter-search">
          <Search size={17} />
          <input
            aria-label="Search agents"
            placeholder="Search your agents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span>{data?.length || 0} agents in your workspace</span>
      </div>
      {error ? (
        <Failure error={error} />
      ) : !data ? (
        <Loading />
      ) : (
        <div className="agent-grid">
          {visible.map((a, i) => (
            <article className="agent-card" key={a.id}>
              <div className="agent-card-top">
                <span className={"agent-icon large color-" + (i % 4)}>
                  <Bot size={25} />
                </span>
                <div className="agent-availability">
                  <Badge status={a.enabled ? "active" : "disabled"} />
                  <button
                    className="agent-switch"
                    role="switch"
                    aria-checked={a.enabled}
                    aria-label={"Enable " + a.name}
                    disabled={!canEdit || pending === a.id}
                    onClick={() => toggle(a)}
                  >
                    <i />
                  </button>
                </div>
              </div>
              <h3>{a.name}</h3>
              <p>{a.description}</p>
              <div className="agent-tags">
                <span>{a.role}</span>
                <span>{a.provider}</span>
                <span>{a.model}</span>
              </div>
              <div className="agent-card-bottom">
                <span>
                  <Blocks size={14} />
                  {a.tools.length} tools attached
                </span>
                <button
                  className="text-link"
                  disabled={!canEdit}
                  onClick={() => setEditing(a)}
                >
                  Configure <ArrowUpRight size={15} />
                </button>
              </div>
            </article>
          ))}
          {visible.length === 0 && (
            <Empty
              text={
                data.length
                  ? "No agents match your filters"
                  : "Your team starts with one agent"
              }
            />
          )}
        </div>
      )}
      {editing !== undefined && (
        <AgentForm
          agent={editing || undefined}
          onClose={() => setEditing(undefined)}
          onSave={save}
        />
      )}
    </div>
  );
}
