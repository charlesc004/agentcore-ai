"use client";
import { usePermissions } from "@/hooks/use-permissions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { X, RotateCcw, ShieldCheck, Search } from "lucide-react";
import { RunInspection } from "./run-inspection";
import { useDialog } from "@/components/shared/use-dialog";
import { toast } from "sonner";
import { api, write } from "@/services/api";
import type { Run, Step } from "@/types";
import { Badge, RunTable, Loading, Failure } from "@/components/shared";
export default function Monitor() {
  const [selected, setSelected] = useState<string | null>(null),
    [filter, setFilter] = useState("all"),
    [search, setSearch] = useState("");
  useEffect(
    () => setSelected(new URLSearchParams(window.location.search).get("run")),
    [],
  );
  const { data, error } = useQuery({
    queryKey: ["runs", filter],
    queryFn: () =>
      api<Run[]>("/runs" + (filter === "all" ? "" : "?status=" + filter)),
    refetchInterval: 3000,
  });
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">EVERY STEP. FULL VISIBILITY.</div>
          <h1>
            Intelligence in action
            <span className="title-dot" />
          </h1>
          <p>Follow the work. Inspect the details. Stay in control.</p>
        </div>
        <span className="live-label">
          <i />
          Live updates
        </span>
      </div>
      <div className="filter-bar">
        <div className="tabs">
          {["all", "succeeded", "failed", "waiting_approval", "running"].map(
            (t) => (
              <button
                className={filter === t ? "selected" : ""}
                key={t}
                onClick={() => setFilter(t)}
              >
                {t.replaceAll("_", " ")}
              </button>
            ),
          )}
        </div>
        <div className="filter-search">
          <Search size={16} />
          <input
            placeholder="Search executions…"
            aria-label="Search runs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <section className="panel">
        {error ? (
          <Failure error={error} />
        ) : !data ? (
          <Loading />
        ) : (
          <RunTable
            runs={data.filter((r) =>
              (r.workflow_name + r.id)
                .toLowerCase()
                .includes(search.toLowerCase()),
            )}
            onSelect={setSelected}
          />
        )}
      </section>
      {selected && (
        <RunDetail
          key={selected}
          identifier={selected}
          onClose={() => setSelected(null)}
          onSelect={setSelected}
        />
      )}
    </div>
  );
}
function RunDetail({
  identifier,
  onClose,
  onSelect,
}: {
  identifier: string;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const { canEdit } = usePermissions();
  const client = useQueryClient();
  const dialog = useDialog(onClose);
  const [busy, setBusy] = useState(false);
  const { data, error } = useQuery({
    queryKey: ["run", identifier],
    queryFn: () =>
      api<
        Run & {
          steps: Step[];
        }
      >("/runs/" + identifier),
    refetchInterval: (query) =>
      ["succeeded", "failed", "cancelled"].includes(
        query.state.data?.status || "",
      )
        ? false
        : 1500,
  });
  async function action(name: string) {
    setBusy(true);
    try {
      const result = await write<{
        id: string;
      }>("/runs/" + identifier + "/" + name, {});
      onSelect(result.id);
      client.invalidateQueries({ queryKey: ["runs"] });
      client.invalidateQueries({ queryKey: ["run"] });
      toast.success("Run " + name + " accepted");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="drawer-backdrop">
      <section
        ref={dialog}
        className="run-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Execution monitor"
      >
        <div className="panel-heading">
          <div>
            <div className="eyebrow">EXECUTION MONITOR</div>
            <h2>{data?.workflow_name || "Loading execution"}</h2>
          </div>
          <button aria-label="Close monitor" onClick={onClose}>
            <X />
          </button>
        </div>
        {error ? (
          <Failure error={error} />
        ) : !data ? (
          <Loading />
        ) : (
          <>
            <div className="run-summary">
              <Badge status={data.status} />
              <span className="mono">run_{data.id.slice(0, 8)}</span>
              <span>{data.duration_ms} ms</span>
            </div>
            {data.error && <p className="error-box">{data.error}</p>}
            <fieldset className="run-actions" disabled={busy || !canEdit}>
              {data.status === "waiting_approval" && (
                <button
                  className="btn btn-primary"
                  onClick={() => action("approve")}
                >
                  <ShieldCheck size={16} />
                  Approve & continue
                </button>
              )}
              {data.status === "failed" && (
                <button
                  className="btn btn-primary"
                  onClick={() => action("retry")}
                >
                  <RotateCcw size={16} />
                  Retry as new run
                </button>
              )}
              {["queued", "running", "waiting_approval"].includes(
                data.status,
              ) && (
                <button
                  className="btn btn-outline"
                  onClick={() => action("cancel")}
                >
                  Cancel run
                </button>
              )}
            </fieldset>
            <RunInspection key={data.id} run={data} />
          </>
        )}
      </section>
    </div>
  );
}
