import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source = readFileSync(
  new URL("../src/services/api.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { api } = await import(
  "data:text/javascript;base64," + Buffer.from(compiled).toString("base64")
);

function environment(fetch) {
  const originals = {
    fetch: globalThis.fetch,
    window: globalThis.window,
    sessionStorage: globalThis.sessionStorage,
  };
  const storage = new Map([
    ["access", "old-access"],
    ["refresh", "old-refresh"],
  ]);
  const events = [];
  globalThis.fetch = fetch;
  globalThis.window = { dispatchEvent: (event) => events.push(event.type) };
  globalThis.sessionStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    clear: () => storage.clear(),
  };
  return {
    storage,
    events,
    restore() {
      for (const [key, value] of Object.entries(originals)) {
        if (value === undefined) delete globalThis[key];
        else globalThis[key] = value;
      }
    },
  };
}
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

test("concurrent unauthorized requests share one token refresh", async () => {
  let refreshes = 0;
  const env = environment(async (url, options) => {
    if (url.endsWith("/auth/refresh")) {
      refreshes++;
      return json({ access_token: "new-access", refresh_token: "new-refresh" });
    }
    return options.headers.Authorization === "Bearer new-access"
      ? json({ ok: true })
      : json({}, 401);
  });
  try {
    const results = await Promise.all([api("/agents"), api("/workflows")]);
    assert.equal(refreshes, 1);
    assert.deepEqual(results, [{ ok: true }, { ok: true }]);
    assert.equal(env.storage.get("refresh"), "new-refresh");
  } finally {
    env.restore();
  }
});

test("a rejected request after refresh clears the expired session", async () => {
  const env = environment(async (url) =>
    url.endsWith("/auth/refresh")
      ? json({ access_token: "new-access", refresh_token: "new-refresh" })
      : json({}, 401),
  );
  try {
    await assert.rejects(api("/agents"), /Session expired/);
    assert.equal(env.storage.size, 0);
    assert.deepEqual(env.events, ["session-expired"]);
  } finally {
    env.restore();
  }
});

test("invalid sign-in does not rotate an existing refresh token", async () => {
  let requests = 0;
  const env = environment(async () => {
    requests++;
    return json({ detail: "Invalid email or password" }, 401);
  });
  try {
    await assert.rejects(api("/auth/login"), /Invalid email or password/);
    assert.equal(requests, 1);
    assert.equal(env.storage.get("refresh"), "old-refresh");
  } finally {
    env.restore();
  }
});
