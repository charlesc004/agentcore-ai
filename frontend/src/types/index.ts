export type Agent = {
  id: string;
  name: string;
  description: string;
  role: string;
  provider: string;
  model: string;
  instructions: string;
  tools: string[];
  enabled: boolean;
  created_at: string;
};
export type NodeData = {
  executionStatus?: string;
  invalid?: boolean;
  kind: string;
  label: string;
  agent_id?: string;
  tool?: string;
  field?: string;
  contains?: string;
  seconds?: number;
  retries?: number;
  [key: string]: unknown;
};
export type Workflow = {
  id: string;
  name: string;
  description: string;
  status: string;
  nodes: import("@xyflow/react").Node<NodeData>[];
  edges: import("@xyflow/react").Edge[];
  created_at: string;
};
export type Run = {
  id: string;
  workflow_id: string;
  workflow_name: string;
  status: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  duration_ms: number;
  error: string | null;
  created_at: string;
};
export type Step = {
  id: string;
  node_id: string;
  label: string;
  kind: string;
  status: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  attempts: number;
  duration_ms: number;
  error: string | null;
};
export type Activity = {
  id: string;
  actor: string;
  action: string;
  detail: string;
  created_at: string;
};
export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  organization_id: string;
};
export type Analytics = {
  workflows: number;
  active_workflows: number;
  agents: number;
  runs: number;
  succeeded: number;
  failed: number;
  success_rate: number;
  average_duration_ms: number;
  trend: {
    date: string;
    runs: number;
    succeeded: number;
    failed: number;
  }[];
  node_usage: {
    name: string;
    value: number;
  }[];
  agent_usage: {
    name: string;
    value: number;
  }[];
};
