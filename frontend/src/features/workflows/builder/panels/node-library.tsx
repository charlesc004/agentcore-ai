"use client";

import { useState } from "react";

import {
  Search,
  Plus,
  Bot,
  Zap,
  Wrench,
  GitBranch,
  Clock,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";

const entries = [
  {
    kind: "trigger",
    name: "Trigger",
    note: "Start your workflow",
    icon: Zap,
    group: "Core",
  },
  {
    kind: "agent",
    name: "AI agent",
    note: "Think, reason, generate",
    icon: Bot,
    group: "Core",
  },
  {
    kind: "tool",
    name: "Tool",
    note: "Connect a capability",
    icon: Wrench,
    group: "Core",
  },
  {
    kind: "condition",
    name: "Condition",
    note: "Choose the next path",
    icon: GitBranch,
    group: "Logic",
  },
  {
    kind: "delay",
    name: "Delay",
    note: "Wait before continuing",
    icon: Clock,
    group: "Logic",
  },
  {
    kind: "approval",
    name: "Human approval",
    note: "Request a human decision",
    icon: ShieldCheck,
    group: "Control",
  },
  {
    kind: "output",
    name: "Output",
    note: "Return your final result",
    icon: ArrowUpRight,
    group: "Control",
  },
];

export function NodeLibrary({
  onAdd,
  disabled = false,
}: {
  onAdd: (kind: string) => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  return (
    <aside className="node-library">
      <div className="library-heading">
        <h3>Nodes</h3>
        <span>{entries.length} types</span>
      </div>
      <div className="filter-search">
        <Search size={14} />
        <input
          aria-label="Search node library"
          placeholder="Search nodes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {["Core", "Logic", "Control"].map((group) => (
        <div className="node-category" key={group}>
          <h4>{group}</h4>
          {entries
            .filter(
              (e) =>
                e.group === group &&
                (e.name + " " + e.note)
                  .toLowerCase()
                  .includes(search.toLowerCase()),
            )
            .map(({ kind, name, note, icon: Icon }) => (
              <button
                className={"library-node kind-" + kind}
                draggable={!disabled}
                disabled={disabled}
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/agentcore", kind);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onClick={() => onAdd(kind)}
                key={kind}
              >
                <span>
                  <Icon size={18} />
                </span>
                <div>
                  <strong>{name}</strong>
                  <small>{note}</small>
                </div>
                <Plus size={13} />
              </button>
            ))}
        </div>
      ))}
      {!entries.some((e) =>
        (e.name + " " + e.note).toLowerCase().includes(search.toLowerCase()),
      ) && <p className="chart-empty">No matching node types.</p>}
      <div className="library-note">
        <ShieldCheck size={18} />
        <p>
          Build with intelligence.
          <br />
          Keep people in control.
        </p>
      </div>
    </aside>
  );
}
