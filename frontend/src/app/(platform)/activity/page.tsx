"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity as ActivityIcon, Search } from "lucide-react";
import { api } from "@/services/api";
import type { Activity } from "@/types";
import { Loading, Failure, Empty } from "@/components/shared";
export default function Page() {
  const [search, setSearch] = useState("");
  const { data, error } = useQuery({
    queryKey: ["activity"],
    queryFn: () => api<Activity[]>("/activity"),
  });
  const visible =
    data?.filter((event) =>
      (event.action + event.actor + event.detail)
        .toLowerCase()
        .includes(search.toLowerCase()),
    ) ?? [];
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">A CLEAR RECORD OF WHAT MATTERS</div>
          <h1>
            Workspace activity
            <span className="title-dot" />
          </h1>
          <p>A shared history of your team and your intelligent systems.</p>
        </div>
        <span className="chip">Organization audit trail</span>
      </div>
      <div className="filter-bar">
        <span>Latest 100 events</span>
        <div className="filter-search">
          <Search size={16} />
          <input
            aria-label="Filter activity"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter events or actors…"
          />
        </div>
      </div>
      {error ? (
        <Failure error={error} />
      ) : !data ? (
        <Loading />
      ) : (
        <section className="panel audit-panel">
          {visible.map((a) => (
            <div className="audit-row" key={a.id}>
              <span className="agent-icon">
                <ActivityIcon size={18} />
              </span>
              <div>
                <strong>
                  {a.action.replaceAll(".", " ").replaceAll("_", " ")}
                </strong>
                <p>{a.detail || "Workspace session"}</p>
              </div>
              <span className="audit-actor">
                {a.actor}
                <small>{a.created_at.slice(0, 19).replace("T", " ")} UTC</small>
              </span>
            </div>
          ))}
          {!visible.length && (
            <Empty
              text={
                data.length
                  ? "No activity matches your filter"
                  : "A fresh start"
              }
            />
          )}
        </section>
      )}
    </div>
  );
}
