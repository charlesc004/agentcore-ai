"use client";
import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import {
  Bot,
  Zap,
  Wrench,
  GitBranch,
  Clock,
  ShieldCheck,
  ArrowUpRight,
  GripVertical,
} from "lucide-react";
import type { NodeData } from "@/types";
const icons = {
  trigger: Zap,
  agent: Bot,
  tool: Wrench,
  condition: GitBranch,
  delay: Clock,
  approval: ShieldCheck,
  output: ArrowUpRight,
};
function CoreNodeView({ data, selected }: NodeProps<Node<NodeData>>) {
  const Icon = icons[data.kind as keyof typeof icons] || Bot;
  return (
    <div
      className={
        "core-node kind-" +
        data.kind +
        (selected ? " node-selected" : "") +
        (data.executionStatus ? " execution-" + data.executionStatus : "") +
        (data.invalid ? " node-invalid" : "")
      }
    >
      {data.kind !== "trigger" && (
        <Handle type="target" position={Position.Left} />
      )}
      <div className="node-type">
        <span>
          <Icon size={15} />
          {data.kind === "approval"
            ? "HUMAN APPROVAL"
            : data.kind.toUpperCase()}
        </span>
        <span className="node-glyph">
          <GripVertical size={13} />
        </span>
      </div>
      <div className="node-label">{data.label}</div>
      <div className="node-caption">
        {data.kind === "agent"
          ? "Intelligent processing"
          : data.kind === "condition"
            ? "Route by matching a value"
            : data.kind === "approval"
              ? "Pause for a human decision"
              : data.kind === "trigger"
                ? "The start of something great"
                : "Connected workflow step"}
      </div>
      {data.executionStatus && (
        <span className="node-run-state">
          {String(data.executionStatus).replaceAll("_", " ")}
        </span>
      )}
      {data.kind === "condition" ? (
        <>
          <Handle
            type="source"
            id="true"
            position={Position.Right}
            style={{ top: "35%", background: "#55cfb5" }}
          />
          <Handle
            type="source"
            id="false"
            position={Position.Right}
            style={{ top: "75%", background: "#f0b96b" }}
          />
          <span className="branch-label">true / false</span>
        </>
      ) : data.kind !== "output" ? (
        <Handle type="source" position={Position.Right} />
      ) : null}
    </div>
  );
}

export const CoreNode = memo(CoreNodeView);
