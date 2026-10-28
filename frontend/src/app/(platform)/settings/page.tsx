"use client";
import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  Building2,
  Plug,
  Save,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { api, write } from "@/services/api";
import { usePermissions } from "@/hooks/use-permissions";
import { Loading, Failure } from "@/components/shared";

type Settings = {
  organization: string;
  preferences: { notifications?: boolean };
  execution_mode: string;
  provider: string;
  tools: string[];
};
const sections = [
  "organization",
  "profile",
  "ai providers",
  "preferences",
] as const;
type Section = (typeof sections)[number];
export default function Page() {
  const { data, error } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api<Settings>("/settings"),
  });
  if (error) return <Failure error={error} />;
  if (!data) return <Loading />;
  return <SettingsForm initial={data} />;
}
function SettingsForm({ initial }: { initial: Settings }) {
  const { user, isAdmin } = usePermissions();
  const client = useQueryClient();
  const [name, setName] = useState(initial.organization);
  const [notifications, setNotifications] = useState(
    initial.preferences.notifications ?? true,
  );
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Section>("organization");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAdmin || busy) return;
    setBusy(true);
    try {
      await write(
        "/settings",
        { organization: name.trim(), notifications },
        "PUT",
      );
      await client.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Workspace settings saved");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="page" onSubmit={save}>
      <div className="page-heading">
        <div>
          <div className="eyebrow">MAKE THIS SPACE YOURS</div>
          <h1>
            Workspace settings
            <span className="title-dot" />
          </h1>
          <p>Your team. Your preferences. Your way of working.</p>
        </div>
        {(tab === "organization" || tab === "preferences") && (
          <button
            disabled={busy || !isAdmin || name.trim().length < 2}
            className="btn btn-primary"
            type="submit"
          >
            <Save size={16} />
            {busy ? "Saving…" : "Save changes"}
          </button>
        )}
      </div>
      <div className="filter-bar">
        <div className="tabs" aria-label="Settings section">
          {sections.map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={tab === value}
              className={tab === value ? "selected" : ""}
              onClick={() => setTab(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      <div className="settings-grid settings-sections">
        {tab === "organization" && (
          <section className="panel settings-panel">
            <div className="panel-heading">
              <h3>
                <Building2 size={19} />
                Organization
              </h3>
            </div>
            <label>
              Organization name
              <input
                required
                minLength={2}
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isAdmin || busy}
              />
            </label>
            <p className="muted">
              Only administrators can update workspace settings.
            </p>
          </section>
        )}
        {tab === "profile" && (
          <section className="panel settings-panel">
            <div className="panel-heading">
              <h3>
                <ShieldCheck size={19} />
                Your account
              </h3>
            </div>
            <dl>
              <dt>Name</dt>
              <dd>{user?.name}</dd>
              <dt>Email</dt>
              <dd>{user?.email}</dd>
              <dt>Workspace role</dt>
              <dd className="capitalize">{user?.role}</dd>
              <dt>Timestamp standard</dt>
              <dd>UTC</dd>
            </dl>
            <p className="muted">
              Profile information is managed by your workspace administrator.
            </p>
          </section>
        )}
        {tab === "preferences" && (
          <section className="panel settings-panel">
            <div className="panel-heading">
              <h3>
                <SlidersHorizontal size={19} />
                Preferences
              </h3>
            </div>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                disabled={!isAdmin || busy}
              />
              Enable workspace notification preference
            </label>
            <p className="muted">
              This saves your workspace preference. External notification
              delivery is not configured.
            </p>
          </section>
        )}
        {tab === "ai providers" && (
          <section className="panel settings-panel">
            <div className="panel-heading">
              <h3>
                <Plug size={19} />
                AI & execution
              </h3>
            </div>
            <div className="provider-card">
              <span className="agent-icon">
                <CheckCircle2 size={24} />
              </span>
              <div>
                <h3>Deterministic demo provider</h3>
                <p>Available · no API key required</p>
              </div>
            </div>
            <p>
              External AI credentials are configured on the server through
              environment variables. They are never sent to this browser.
            </p>
            <dl>
              <dt>Execution adapter</dt>
              <dd>{initial.execution_mode}</dd>
              <dt>Available tool adapters</dt>
              <dd>{initial.tools.length}</dd>
            </dl>
            <div className="tool-list">
              {initial.tools.map((tool) => (
                <span key={tool}>
                  <CheckCircle2 size={14} />
                  {tool.replaceAll("_", " ")}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </form>
  );
}
