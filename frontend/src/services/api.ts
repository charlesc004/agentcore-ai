const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
let refreshing: Promise<boolean> | null = null;
async function refreshSession() {
  const token = sessionStorage.getItem("refresh");
  if (!token) return false;
  const response = await fetch(base + "/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: token }),
  });
  if (!response.ok) return false;
  const data = await response.json();
  sessionStorage.setItem("access", data.access_token);
  sessionStorage.setItem("refresh", data.refresh_token);
  return true;
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token =
    typeof window !== "undefined" ? sessionStorage.getItem("access") : null;
  const response = await fetch(base + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (response.status === 401 && !path.startsWith("/auth/")) {
    if (retry) {
      refreshing ||= refreshSession().finally(() => {
        refreshing = null;
      });
      if (await refreshing) return api<T>(path, options, false);
    }
    sessionStorage.clear();
    window.dispatchEvent(new Event("session-expired"));
    throw new Error("Session expired. Please sign in again.");
  }
  if (!response.ok) {
    const data = await response
      .json()
      .catch(() => ({ detail: "Unable to connect to the service" }));
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "Please check the supplied values",
    );
  }
  return response.json();
}
export const write = <T>(path: string, body: unknown, method = "POST") =>
  api<T>(path, { method, body: JSON.stringify(body) });
