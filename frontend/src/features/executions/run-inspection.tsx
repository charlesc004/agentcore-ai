"use client";

import { useState } from "react";

import {
  CheckCircle2,
  Play,
  ShieldCheck,
  AlertCircle,
  Clock,
} from "lucide-react";

import type { Run, Step } from "@/types";

import { Badge } from "@/components/shared";

import { JsonViewer } from "@/components/shared/json-viewer";

export function RunInspection({ run }: { run: Run & { steps: Step[] } }) {
  const [selected, setSelected] = useState<string | null>(null),
    [tab, setTab] = useState("output");
  const step = run.steps.find((s) => s.id === selected);
  const tabs = ["input", "output", "logs", "details"];
  return (
    <>
      <div className="inspection-layout">
        <div className="execution-timeline">
          <div className="timeline-bookend">
            <Play size={14} />
            <span>
              Workflow started
              <small>{run.created_at.slice(0, 19).replace("T", " ")} UTC</small>
            </span>
          </div>
          {run.steps.map((s) => {
            const Icon =
              s.status === "succeeded"
                ? CheckCircle2
                : s.status === "failed"
                  ? AlertCircle
                  : s.kind === "approval"
                    ? ShieldCheck
                    : Clock;
            return (
              <button
                className={
                  "timeline-node " +
                  s.status +
                  (step?.id === s.id ? " selected" : "")
                }
                key={s.id}
                onClick={() => setSelected(s.id)}
              >
                <span className="timeline-node-icon">
                  <Icon size={16} />
                </span>
                <span>
                  <strong>{s.label}</strong>
                  <small>
                    {s.kind} · {s.status}
                  </small>
                </span>
                <em>{s.duration_ms} ms</em>
              </button>
            );
          })}
          <div className={"timeline-bookend " + run.status}>
            <CheckCircle2 size={15} />
            <span>
              {run.status === "succeeded"
                ? "Workflow completed"
                : run.status === "failed"
                  ? "Workflow failed"
                  : run.status === "waiting_approval"
                    ? "Awaiting human approval"
                    : "Workflow " + run.status}
            </span>
          </div>
        </div>
        <div className="inspection-content">
          <div className="inspection-heading">
            <div>
              <span className="eyebrow">
                {step ? "NODE INSPECTION" : "WORKFLOW RESULT"}
              </span>
              <h3>{step?.label || run.workflow_name}</h3>
            </div>
            <Badge status={step?.status || run.status} />
          </div>
          <div
            className="inspection-tabs"
            role="tablist"
            aria-label="Execution data"
          >
            {tabs.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                aria-controls="inspection-tab-panel"
                id={"inspection-tab-" + t}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div
            role="tabpanel"
            id="inspection-tab-panel"
            aria-labelledby={"inspection-tab-" + tab}
          >
            {tab === "input" && (
              <JsonViewer
                value={step?.input || run.input}
                label="Execution input"
              />
            )}
            {tab === "output" && (
              <JsonViewer
                value={step?.output || run.output}
                label={step ? "Node output" : "Final output"}
              />
            )}{" "}
            {tab === "logs" && (
              <div className="structured-logs">
                {(step ? [step] : run.steps).map((s) => (
                  <div key={s.id}>
                    <Badge status={s.status} />
                    <span>{s.label}</span>
                    <small>
                      {s.attempts} attempts · {s.duration_ms} ms
                    </small>
                    {s.error && <p className="error">{s.error}</p>}
                  </div>
                ))}
                {!run.steps.length && (
                  <p className="chart-empty">No step records yet.</p>
                )}
              </div>
            )}
            {tab === "details" && (
              <dl className="inspection-metadata">
                <dt>Run ID</dt>
                <dd>{run.id}</dd>
                <dt>Workflow ID</dt>
                <dd>{run.workflow_id}</dd>
                <dt>Status</dt>
                <dd>{step?.status || run.status}</dd>
                <dt>Duration</dt>
                <dd>{step?.duration_ms ?? run.duration_ms} ms</dd>
                {step && (
                  <>
                    <dt>Node ID</dt>
                    <dd>{step.node_id}</dd>
                    <dt>Attempts</dt>
                    <dd>{step.attempts}</dd>
                  </>
                )}
                <dt>Started (UTC)</dt>
                <dd>{run.created_at.slice(0, 19).replace("T", " ")}</dd>
              </dl>
            )}
          </div>
          {step && (
            <button
              className="text-link inspection-reset"
              onClick={() => setSelected(null)}
            >
              Show final workflow result
            </button>
          )}
        </div>
      </div>
    </>
  );
}
