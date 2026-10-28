"use client";
import { Trash2 } from "lucide-react";
import type { Node } from "@xyflow/react";
import type { Agent, NodeData } from "@/types";

type Props = {
  current?: Node<NodeData>;
  agents: Agent[];
  disabled: boolean;
  input: string;
  setInput: (value: string) => void;
  update: (values: Partial<NodeData>) => void;
  onRemove: () => void;
};
export function NodeInspector({
  current,
  agents,
  disabled,
  input,
  setInput,
  update,
  onRemove,
}: Props) {
  return (
    <aside className="node-inspector">
      <fieldset className="inspector-fields" disabled={disabled}>
        <div className="eyebrow">
          {current ? "NODE CONFIGURATION" : "WORKFLOW INPUT"}
        </div>
        <h3>{current ? current.data.label : "Start with a spark."}</h3>
        {current ? (
          <div className="inspector-form">
            <label>
              Node name
              <input
                value={current.data.label}
                onChange={(e) => update({ label: e.target.value })}
              />
            </label>
            {current.data.kind === "agent" && (
              <label>
                Assigned agent
                <select
                  value={current.data.agent_id || ""}
                  onChange={(e) => update({ agent_id: e.target.value })}
                >
                  <option value="">Select an agent</option>
                  {agents
                    .filter((a) => a.enabled)
                    .map((a) => (
                      <option value={a.id} key={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
              </label>
            )}
            {current.data.kind === "tool" && (
              <label>
                Tool adapter
                <select
                  value={current.data.tool || "json_formatter"}
                  onChange={(e) => update({ tool: e.target.value })}
                >
                  {[
                    "json_formatter",
                    "email_draft",
                    "document_parser",
                    "delay",
                  ].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
            )}
            {current.data.kind === "condition" && (
              <>
                <label>
                  Input field
                  <input
                    value={current.data.field || "text"}
                    onChange={(e) => update({ field: e.target.value })}
                  />
                </label>
                <label>
                  Contains (case insensitive)
                  <input
                    value={current.data.contains || "urgent"}
                    onChange={(e) => update({ contains: e.target.value })}
                  />
                </label>
                <p>
                  Connect the upper handle for true and the lower handle for
                  false.
                </p>
              </>
            )}
            {current.data.kind === "delay" && (
              <label>
                Seconds (maximum 5)
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={current.data.seconds ?? 0.1}
                  onChange={(e) => update({ seconds: Number(e.target.value) })}
                />
              </label>
            )}
            {current.data.kind === "approval" && (
              <p>
                Execution pauses here until an authorized builder approves it in
                the run monitor.
              </p>
            )}
            <label>
              Retries (0–3)
              <input
                type="number"
                min={0}
                max={3}
                value={current.data.retries || 0}
                onChange={(e) => update({ retries: Number(e.target.value) })}
              />
            </label>
            <button className="btn btn-danger" onClick={onRemove}>
              <Trash2 size={15} />
              Remove node
            </button>
          </div>
        ) : (
          <>
            <p>
              Test your workflow with a customer inquiry, research note, or any
              text.
            </p>
            <label>
              Test input
              <textarea
                rows={8}
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </label>
            <div className="demo-note">
              <span className="badge">LOCAL DEMO PROVIDER</span>
              <p>
                Deterministic AI outputs.
                <br />
                No external API key needed.
              </p>
            </div>
          </>
        )}
      </fieldset>
    </aside>
  );
}
