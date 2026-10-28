"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Bot,
  Workflow,
  Play,
  ChartNoAxesCombined,
  Activity,
  Settings,
  Hexagon,
  ArrowUpRight,
  LogOut,
  PanelLeft,
  ChevronDown,
  Search,
  Bell,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api, write } from "@/services/api";
import type { Activity as AuditActivity, User } from "@/types";
const nav = [
  ["Overview", "/", LayoutDashboard],
  ["Agents", "/agents", Bot],
  ["Workflows", "/workflows", Workflow],
  ["Runs", "/runs", Play],
  ["Analytics", "/analytics", ChartNoAxesCombined],
  ["Activity", "/activity", Activity],
  ["Settings", "/settings", Settings],
] as const;
export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(),
    router = useRouter(),
    client = useQueryClient();
  const [open, setOpen] = useState(false),
    [account, setAccount] = useState(false),
    [notifications, setNotifications] = useState(false),
    [contrast, setContrast] = useState(false);
  const { data: events = [] } = useQuery({
    queryKey: ["shell-activity"],
    queryFn: () => api<AuditActivity[]>("/activity?limit=4"),
    enabled: notifications,
  });
  useEffect(() => {
    const value = localStorage.getItem("agentcore-contrast") === "true";
    setContrast(value);
    document.documentElement.dataset.appearance = value
      ? "contrast"
      : "default";
  }, []);
  function toggleContrast() {
    const next = !contrast;
    setContrast(next);
    document.documentElement.dataset.appearance = next ? "contrast" : "default";
    localStorage.setItem("agentcore-contrast", String(next));
  }
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAccount(false);
        setNotifications(false);
        setOpen(false);
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, []);
  const { data: workspace } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api<{ organization: string }>("/settings"),
  });
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => api<User>("/auth/me"),
  });
  useEffect(() => {
    if (!sessionStorage.getItem("access")) router.replace("/login");
  }, [router]);
  useEffect(() => {
    const expired = () => router.replace("/login");
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, [router]);
  async function logout() {
    try {
      await write("/auth/logout", {
        refresh_token: sessionStorage.getItem("refresh"),
      });
    } finally {
      sessionStorage.clear();
      client.clear();
      router.push("/login");
    }
  }
  return (
    <div className="app-shell">
      <aside
        id="workspace-sidebar"
        className={open ? "sidebar open" : "sidebar"}
      >
        <Link href="/" className="brand">
          <span className="brand-icon">
            <Hexagon size={24} />
          </span>
          AgentCore<span className="brand-ai">AI</span>
        </Link>
        <Link
          href="/settings"
          className="workspace"
          aria-label="Organization settings"
        >
          <span className="workspace-avatar">N</span>
          <span>
            {workspace?.organization || "Workspace"}
            <small>Organization workspace</small>
          </span>
          <ChevronDown size={14} />
        </Link>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {nav.map(([label, href, Icon]) => (
            <Link
              onClick={() => setOpen(false)}
              className={
                (href === "/" ? pathname === "/" : pathname.startsWith(href))
                  ? "nav-item active"
                  : "nav-item"
              }
              title={label}
              aria-label={label}
              href={href}
              key={href}
            >
              <Icon size={18} />
              {label}
              {label === "Workflows" && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="side-note">
            <span className="eyebrow">BUILT TO WORK TOGETHER</span>
            <h4>
              Your next idea.
              <br />
              An entire agent team.
            </h4>
            <Link href="/workflows">
              Build a workflow <ArrowUpRight size={15} />
            </Link>
          </div>
          <button className="user-profile" onClick={logout} title="Sign out">
            <span className="avatar">
              {user?.name
                .split(" ")
                .map((n) => n[0])
                .join("") || "…"}
            </span>
            <span>
              {user?.name || "Loading session"}
              <small>{user?.role || "Workspace member"}</small>
            </span>
            <LogOut size={16} />
          </button>
        </div>
      </aside>
      {open && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-toggle"
              onClick={() => setOpen(!open)}
              aria-label="Toggle navigation"
              aria-expanded={open}
              aria-controls="workspace-sidebar"
            >
              <PanelLeft size={19} />
            </button>
            <span>Workspace</span>
            <span>/</span>
            <strong>
              {nav.find(([, href]) =>
                href === "/" ? pathname === "/" : pathname.startsWith(href),
              )?.[0] || "Workflow builder"}
            </strong>
          </div>
          <div className="topbar-right">
            <Link className="search-link" href="/workflows">
              <Search size={15} />
              Find a workflow
            </Link>
            <span className="system-status">
              <i />
              {user ? "Workspace connected" : "Connecting workspace"}
            </span>
            <div className="topbar-popover">
              <button
                className="icon-button"
                aria-label="Recent workspace events"
                aria-expanded={notifications}
                onClick={() => {
                  setNotifications(!notifications);
                  setAccount(false);
                }}
              >
                <Bell size={17} />
              </button>
              {notifications && (
                <section className="header-popover">
                  <div className="panel-heading">
                    <h3>Workspace events</h3>
                    <span className="live-label">Latest activity</span>
                  </div>
                  {events.map((event) => (
                    <Link
                      href="/activity"
                      onClick={() => setNotifications(false)}
                      key={event.id}
                    >
                      <strong>{event.action.replaceAll(".", " ")}</strong>
                      <small>{event.detail || event.actor}</small>
                    </Link>
                  ))}
                  {!events.length && <p>No recent events to show.</p>}
                </section>
              )}
            </div>
            <button
              className="icon-button"
              title="Toggle higher contrast"
              aria-label="Toggle higher contrast"
              aria-pressed={contrast}
              onClick={toggleContrast}
            >
              <SlidersHorizontal size={17} />
            </button>
            <div className="topbar-popover">
              <button
                className="avatar small"
                aria-label="Account menu"
                aria-expanded={account}
                onClick={() => {
                  setAccount(!account);
                  setNotifications(false);
                }}
              >
                {user?.name[0] || "N"}
              </button>
              {account && (
                <section className="header-popover account-popover">
                  <strong>{user?.name}</strong>
                  <small>{user?.email}</small>
                  <Link href="/settings" onClick={() => setAccount(false)}>
                    <UserRound size={15} />
                    Profile and settings
                  </Link>
                  <button onClick={logout}>
                    <LogOut size={15} />
                    Sign out
                  </button>
                </section>
              )}
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer>
          AgentCore AI <span>Intelligent orchestration, human control.</span>
          <span>All timestamps in UTC</span>
        </footer>
      </div>
    </div>
  );
}
