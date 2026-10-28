"use client";
import { useState, useCallback } from "react";
import type { Node, Edge } from "@xyflow/react";
import type { NodeData } from "@/types";
type Snapshot = { nodes: Node<NodeData>[]; edges: Edge[] };
export function useGraphHistory(
  nodes: Snapshot["nodes"],
  edges: Snapshot["edges"],
  restore: (next: Snapshot) => void,
) {
  const [past, setPast] = useState<Snapshot[]>([]),
    [future, setFuture] = useState<Snapshot[]>([]);
  const checkpoint = useCallback(() => {
    setPast((p) => [...p.slice(-39), structuredClone({ nodes, edges })]);
    setFuture([]);
  }, [nodes, edges]);
  function undo() {
    const previous = past.at(-1);
    if (!previous) return;
    setFuture((f) => [structuredClone({ nodes, edges }), ...f]);
    setPast((p) => p.slice(0, -1));
    restore(previous);
  }
  function redo() {
    const next = future[0];
    if (!next) return;
    setPast((p) => [...p, structuredClone({ nodes, edges })]);
    setFuture((f) => f.slice(1));
    restore(next);
  }
  return {
    checkpoint,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
