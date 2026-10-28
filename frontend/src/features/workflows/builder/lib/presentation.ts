import type { Node, Edge } from "@xyflow/react";
import type { NodeData, Step } from "@/types";
export function presentGraph(
  nodes: Node<NodeData>[],
  edges: Edge[],
  steps: Step[] = [],
  readOnly = false,
) {
  const statuses = new Map(steps.map((step) => [step.node_id, step.status]));
  return {
    nodes: nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        executionStatus: statuses.get(node.id),
        invalid: node.data.kind === "agent" && !node.data.agent_id,
      },
    })),
    edges: edges.map((edge) => ({
      ...edge,
      type: "smoothstep",
      animated: !readOnly && statuses.get(edge.target) === "running",
      markerEnd: {
        type: "arrowclosed" as import("@xyflow/react").MarkerType,
        color: "#5777bb",
      },
      style: {
        stroke: edge.selected ? "#c4b5fd" : "#5777bb",
        strokeWidth: 1.7,
      },
    })),
  };
}
