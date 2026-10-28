"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Workflow as WorkflowIcon,
  Bot,
  Play,
  CheckCircle2,
  Plus,
  ArrowUpRight,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { api } from "@/services/api";
import type { Analytics, Run, Activity, Agent, Workflow, User } from "@/types";
import { Loading, Failure, RunTable, Badge } from "@/components/shared";
import {
  ExecutionChart,
  StatusChart,
  UsageChart,
  Sparkline,
} from "@/components/charts/charts";
function Panel({
  title,
  note,
  children,
  action,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h3>{title}</h3>
          <p>{note}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export default function Overview({
  analyticsOnly = false,
}: {
  analyticsOnly?: boolean;
}) {
  const router = useRouter(),
    reduce = useReducedMotion();
  const { data: stats, error } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => api<Analytics>("/analytics"),
  });
  const { data: runs = [] } = useQuery({
    queryKey: ["overview-runs"],
    queryFn: () => api<Run[]>("/runs?limit=100"),
  });
  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: () => api<Agent[]>("/agents"),
  });
  const { data: activity = [] } = useQuery({
    queryKey: ["overview-activity"],
    queryFn: () => api<Activity[]>("/activity?limit=5"),
  });
  const { data: workflows = [] } = useQuery({
    queryKey: ["workflows"],
    queryFn: () => api<Workflow[]>("/workflows"),
  });
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => api<User>("/auth/me"),
  });
  if (error) return <Failure error={error} />;
  if (!stats) return <Loading />;
  const metrics = analyticsOnly
    ? ([
        ["Total runs", stats.runs, Play, "Recorded across all workflows"],
        [
          "Success rate",
          stats.success_rate + "%",
          CheckCircle2,
          stats.succeeded + " successful runs",
        ],
        [
          "Avg. duration",
          stats.average_duration_ms + " ms",
          Clock,
          "Across recorded executions",
        ],
        [
          "Active agents",
          agents.filter((a) => a.enabled).length,
          Bot,
          "Enabled in this workspace",
        ],
      ] as const)
    : ([
        [
          "Total workflows",
          stats.workflows,
          WorkflowIcon,
          stats.active_workflows + " active workflows",
        ],
        [
          "Active agents",
          agents.filter((a) => a.enabled).length,
          Bot,
          "Ready for orchestration",
        ],
        ["Total runs", stats.runs, Play, "All recorded executions"],
        [
          "Success rate",
          stats.success_rate + "%",
          CheckCircle2,
          stats.succeeded + " successful runs",
        ],
      ] as const);
  const performance = workflows.map((w) => ({
    name: w.name,
    value: runs.filter((r) => r.workflow_id === w.id).length,
  }));
  return (
    <motion.div
      className="page premium-overview"
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            {analyticsOnly
              ? "WORKSPACE INTELLIGENCE"
              : "YOUR AUTOMATION WORKSPACE"}
          </div>
          <h1>
            {analyticsOnly
              ? "Analytics"
              : "Welcome back, " + (user?.name.split(" ")[0] || "there")}
            <span className="title-dot" />
          </h1>
          <p>
            {analyticsOnly
              ? "A clear view of performance. A smarter way forward."
              : "Here’s what’s happening across your AI workflows today."}
          </p>
        </div>
        <Link className="btn btn-primary" href="/workflows">
          <Plus size={16} />
          Create workflow
        </Link>
      </div>
      <div className="metrics-grid">
        {metrics.map(([label, value, Icon, note], i) => (
          <article className={"metric-card metric-" + i} key={label}>
            <div className="metric-label">
              {label}
              <span>
                <Icon size={18} />
              </span>
            </div>
            <div className="metric-value">{value}</div>
            <div className="metric-note">{note}</div>
            {label === "Total runs" && <Sparkline data={stats.trend} />}
          </article>
        ))}
      </div>
      <div className="dashboard-grid">
        <Panel
          title="Workflow executions"
          note="Daily execution outcomes across the last 14 days"
          action={<span className="chip">Last 14 days</span>}
        >
          <div className="chart-legend">
            <span>
              <i style={{ background: "#238ffc" }} />
              Succeeded
            </span>
            <span>
              <i style={{ background: "#a855f7" }} />
              Failed
            </span>
          </div>
          <ExecutionChart data={stats.trend} />
        </Panel>
        <Panel
          title="Run status distribution"
          note="Every outcome, accounted for"
        >
          <StatusChart stats={stats} />
        </Panel>
      </div>
      <div className="dashboard-grid equal">
        <Panel
          title="Agent usage"
          note="Recorded agent steps, ordered by usage"
          action={
            <Link href="/agents" className="text-link">
              Manage agents <ArrowUpRight size={14} />
            </Link>
          }
        >
          <UsageChart
            data={[...stats.agent_usage].sort((a, b) => b.value - a.value)}
          />
        </Panel>
        <Panel
          title={analyticsOnly ? "Node execution frequency" : "Recent activity"}
          note={
            analyticsOnly
              ? "Recorded tool and processing operations"
              : "The latest events across your workspace"
          }
          action={
            !analyticsOnly && (
              <Link href="/activity" className="text-link">
                View all <ArrowUpRight size={14} />
              </Link>
            )
          }
        >
          {analyticsOnly ? (
            <UsageChart data={stats.node_usage} />
          ) : (
            <div className="dashboard-activity">
              {activity.map((a) => (
                <div key={a.id}>
                  <span className="activity-symbol">
                    <ShieldCheck size={15} />
                  </span>
                  <div>
                    <strong>
                      {a.action.replaceAll(".", " ").replaceAll("_", " ")}
                    </strong>
                    <p>{a.detail || a.actor}</p>
                  </div>
                  <time>{a.created_at.slice(11, 16)} UTC</time>
                </div>
              ))}
              {!activity.length && (
                <p className="chart-empty">
                  Your workspace activity will appear here.
                </p>
              )}
            </div>
          )}
        </Panel>
      </div>
      {analyticsOnly && (
        <div className="dashboard-grid equal">
          <Panel
            title="Workflow execution volume"
            note="Comparison within the latest 100 executions"
          >
            <UsageChart data={performance} />
          </Panel>
          <Panel title="Workflow health" note="Current published configuration">
            <div className="workflow-health-list">
              {workflows.map((w) => (
                <Link href={"/workflows/" + w.id} key={w.id}>
                  <span className="agent-icon">
                    <WorkflowIcon size={18} />
                  </span>
                  <div>
                    <strong>{w.name}</strong>
                    <small>
                      {w.nodes.length} nodes · {w.edges.length} connections
                    </small>
                  </div>
                  <Badge status={w.status} />
                </Link>
              ))}
            </div>
          </Panel>
        </div>
      )}
      <Panel
        title="Recent workflow runs"
        note="Trace every decision, from trigger to output"
        action={
          <Link href="/runs" className="text-link">
            View all runs <ArrowUpRight size={14} />
          </Link>
        }
      >
        <RunTable
          runs={runs.slice(0, 5)}
          onSelect={(id) => router.push("/runs?run=" + id)}
        />
      </Panel>
      <div className="workspace-health">
        <span>
          <i />
          Demo AI available
        </span>
        <span>
          {stats.active_workflows} active workflows ·{" "}
          {agents.filter((a) => a.enabled).length} enabled agents
        </span>
        <span>
          <ShieldCheck size={13} />
          Human oversight built in
        </span>
      </div>
    </motion.div>
  );
}
