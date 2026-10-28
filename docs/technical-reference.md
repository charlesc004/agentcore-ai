# Technical reference

## API at a glance

| Area | Representative endpoints |
| --- | --- |
| Sessions | `POST /api/auth/login`, `/refresh`, `/logout`; `GET /api/auth/me` |
| Agents | `GET/POST /api/agents`; `PUT /api/agents/{id}` |
| Workflows | `GET/POST /api/workflows`; `GET/PUT /api/workflows/{id}` |
| Validation | `POST /api/workflows/{id}/validate` |
| Execution | `POST /api/workflows/{id}/runs`; `GET /api/runs`, `/api/runs/{id}` |
| Run actions | `POST /api/runs/{id}/approve`, `/retry`, `/cancel` |
| Insights | `GET /api/analytics`, `GET /api/activity` |
| Workspace | `GET/PUT /api/settings` |

Protected endpoints require a bearer access token. Requests are scoped to the authenticated user's organization. Use the generated API documentation for exact request and response schemas.


## Security and operational boundaries

- Argon2 password hashes, signed access tokens, hashed rotating refresh tokens, and role checks are implemented. Tokens currently live in browser `sessionStorage`.
- Queries are organization-scoped. UI permissions improve usability; server checks enforce authorization.
- Structured JSON display/copy redacts credential-shaped keys. Arbitrary text should still be reviewed before sharing logs.
- Cancel is cooperative: an in-flight adapter call is not forcibly interrupted. Its cancelled outcome is retained when the call returns.
- External AI input is bounded and structured output is checked. Provider credentials remain server-side.
- A public deployment needs HTTPS, session hardening, a suitable CSP, distributed auth throttling, secret management, backups, and worker recovery procedures.

## Current scope

The implemented workflow engine supports acyclic graphs, sequential topological execution, conditional branch pruning, bounded retries, and merging active parent outputs in connection order.

The following remain outside the implemented product scope:

- Recurring schedules, webhook ingestion, external integration connections, team invitations, SSO, password reset, and email delivery.
- Loops, parallel node execution, streaming model output, semantic output schemas, schema-aware field mapping, and autonomous agent tool calling.
- Durable local background tasks across process restarts, a transactional outbox, or exactly-once external side-effect guarantees. Celery deployments need recovery procedures for interrupted workers.
- Separate provider/integration configuration tables or browser-managed provider secrets. Graph/configuration fields use JSON where appropriate; persisted steps serve as execution logs.
- SQL-aggregated analytics at scale and UI pagination/date sorting. APIs support offset pagination; workspace lists currently show up to 100 records.
- Editable personal profiles and external notification delivery. Notification settings currently persist a workspace preference.
- A custom unsaved-change blocker for internal navigation. Browser unload warnings are implemented.

Retry creates a new execution from the current saved graph. A concurrent duplicate idempotency key can return a conflict. Logout revokes refresh tokens; existing access tokens expire within their configured lifetime. See the audit and verification notes for additional practical limits.
