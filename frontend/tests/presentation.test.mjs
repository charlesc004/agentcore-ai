import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
async function load(path) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  return import(
    "data:text/javascript;base64," + Buffer.from(outputText).toString("base64")
  );
}
const { presentGraph } = await load(
  "../src/features/workflows/builder/lib/presentation.ts",
);
const { redact } = await load("../src/lib/redact.ts");
const nodes = [
  {
    id: "start",
    data: { kind: "trigger", label: "Start" },
    position: { x: 0, y: 0 },
  },
  {
    id: "agent",
    data: { kind: "agent", label: "Research", agent_id: "configured-agent" },
    position: { x: 200, y: 0 },
  },
];
const edges = [{ id: "flow", source: "start", target: "agent" }];
test("idle canvas does not animate every connection", () => {
  assert.equal(presentGraph(nodes, edges).edges[0].animated, false);
});
test("only the connection to a running node is animated", () => {
  const result = presentGraph(nodes, edges, [
    { node_id: "agent", status: "running" },
  ]);
  assert.equal(result.edges[0].animated, true);
  assert.equal(result.nodes[1].data.executionStatus, "running");
  assert.equal(
    presentGraph(nodes, edges, [{ node_id: "agent", status: "succeeded" }])
      .edges[0].animated,
    false,
  );
});
test("inspection mode suppresses execution animation", () => {
  assert.equal(
    presentGraph(nodes, edges, [{ node_id: "agent", status: "running" }], true)
      .edges[0].animated,
    false,
  );
});
test("presentation state never mutates persisted graph data", () => {
  const before = JSON.stringify({ nodes, edges });
  presentGraph(nodes, edges, [{ node_id: "agent", status: "failed" }]);
  assert.equal(JSON.stringify({ nodes, edges }), before);
  assert.equal("executionStatus" in nodes[1].data, false);
});
test("agent configuration feedback requires an assigned agent", () => {
  assert.equal(
    presentGraph(
      [{ ...nodes[1], data: { kind: "agent", label: "Missing assignment" } }],
      [],
    ).nodes[0].data.invalid,
    true,
  );
  assert.equal(presentGraph(nodes, edges).nodes[1].data.invalid, false);
});
test("structured data copy and display redact nested credential fields", () => {
  const source = {
    text: "Ordinary output",
    API_KEY: "private",
    nested: [{ refresh_token: "private", result: 42 }],
    authorization: "private",
  };
  assert.deepEqual(redact(source), {
    text: "Ordinary output",
    API_KEY: "[REDACTED]",
    nested: [{ refresh_token: "[REDACTED]", result: 42 }],
    authorization: "[REDACTED]",
  });
  assert.equal(source.API_KEY, "private");
});
