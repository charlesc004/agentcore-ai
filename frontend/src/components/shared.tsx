"use client";
import {
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { Run } from "@/types";
export function Badge({ status }: { status: string }) {
  return (
    <span className={"status-badge " + status}>
      <i />
      {status.replaceAll("_", " ")}
    </span>
  );
}
export function Loading() {
  return (
    <div className="skeleton-grid">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div className="skeleton" key={i} />
      ))}
    </div>
  );
}
export function Failure({ error }: { error: Error }) {
  return (
    <div className="empty">
      <AlertCircle />
      <h3>Unable to load workspace</h3>
      <p>{error.message}</p>
      <button
        className="btn btn-outline"
        onClick={() => window.location.reload()}
      >
        Try again
      </button>
    </div>
  );
}
export function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <Clock />
      <h3>{text}</h3>
      <p>Your next successful automation starts here.</p>
    </div>
  );
}
export function RunTable({
  runs,
  onSelect,
}: {
  runs: Run[];
  onSelect: (id: string) => void;
}) {
  return !runs.length ? (
    <Empty text="No runs yet" />
  ) : (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Workflow / Run ID</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Started (UTC)</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => (
            <tr
              key={r.id}
              onClick={() => onSelect(r.id)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSelect(r.id);
              }}
            >
              <td>
                <div className="table-title">
                  <span className={"run-icon " + r.status}>
                    {r.status === "succeeded" ? (
                      <CheckCircle2 size={16} />
                    ) : r.status === "failed" ? (
                      <AlertCircle size={16} />
                    ) : (
                      <Loader2 size={16} />
                    )}
                  </span>
                  <span>
                    {r.workflow_name}
                    <small>run_{r.id.slice(0, 8)}</small>
                  </span>
                </div>
              </td>
              <td>
                <Badge status={r.status} />
              </td>
              <td className="mono">{r.duration_ms} ms</td>
              <td>
                {new Date(
                  r.created_at.endsWith("Z") || r.created_at.includes("+")
                    ? r.created_at
                    : r.created_at + "Z",
                ).toLocaleString("en-US", {
                  timeZone: "UTC",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td>
                <ArrowUpRight size={16} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
