# Workflow engine

A graph contains typed nodes, positioned canvas coordinates, and directed edges. Node kinds: trigger, agent, tool, condition, delay, approval, output. Edges may use condition source handles true or false.

Validation requires unique node IDs, one trigger, at least one output, valid edge endpoints, all nodes reachable from the sole root trigger, and no cycles. Kahn topological ordering defines execution order. Active parent outputs merge in edge order; later keys win. Condition nodes add a boolean branch based on a case-insensitive substring comparison of a named input field. Inactive branches persist skipped steps; a merge executes if any incoming path is active.

Creation snapshots the graph and records queued state. A worker atomically claims the queued run. Each node stores input/output, status, duration, error, and attempt count. Retries are bounded to three additional attempts. Local delay is bounded to five seconds. Disabled or cross-organization agents fail safely. Tool names resolve from a fixed registry.

Approval pauses at waiting_approval. An authorized builder/admin marks the waiting step succeeded, records their email in output, audits the decision, and requeues the run. Completed and skipped steps are reused on resume. Output nodes become named entries in final execution output. Failures record the failing step and overall error. Cancellation is checked before each node. Failed-run retry creates a new run from the current workflow.

Local mode requires no Redis. Celery mode uses Redis as broker and database records for state. Task submission is not transactional with database commit; a transactional outbox and stale-run recovery are future work. Do not assume exactly-once effects or durable in-process execution.
