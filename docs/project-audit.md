# Project audit - 2026-10-28

## Scope

Reviewed first-party frontend routes, components, state management, styles, API client, backend services, authorization, DTOs, ORM records, migrations, adapters, tests, container definitions and documentation. Reviewed source and documentation text, filenames, seeded identities and persisted local database values. Vendor dependencies, binary fonts and generated caches are not authored application content.

## Findings resolved

- Workflow editing stayed enabled while a save was in flight. Inputs, graph mutations and library additions now lock during requests; successful saves update the workflow query cache.
- Viewer accounts saw controls that the API would reject. A shared permissions hook now disables agent, workflow and run mutations. The canvas blocks changes in read-only mode, including its interactivity toggle. Backend authorization remains authoritative.
- The builder stopped refreshing a test run at approval. It now continues polling until a terminal state. Run detail polling stops when terminal and resets its state when switching runs.
- A second unauthorized response after token refresh left stale credentials in the browser. It now clears the expired session and signals sign-in. Tests cover concurrent refresh, rejected refreshed sessions and invalid sign-in.
- In-progress node state was not committed until completion. Running status and attempts are now visible before adapter execution. Failed steps retain measured duration, approval pauses retain elapsed execution time, and cancellation during an adapter call remains cancelled even if that call fails.
- Graph validation now rejects duplicate connection IDs, outgoing output connections, incoming trigger connections and invalid conditional source handles.
- Agent, workflow and activity filters previously displayed blank results without feedback. Filtered empty states are now explicit.
- Settings sections relied on positional CSS hiding. They now render separate content with a validated organization form and save feedback. Read-only sections do not offer a save action.
- Removed a static system-health claim. The header reports the actual session connection state instead.
- Extracted the node inspector and shared permissions, moved the catalog service to the shared backend layer, removed a redundant icon wrapper, removed 49 obsolete CSS selectors and duplicate legacy palette declarations, and split presentation styles into five ordered sections.
- Docker runtime omitted locally served fonts. The frontend now copies public assets. Both build contexts exclude local dependencies, caches, databases and environment files.

## Duplicate inventory

SHA-256 comparison found no duplicate application implementations or assets. Ten Python package initializers have identical package-marker content; these files define separate package boundaries and are intentionally retained. Empty initializers in other packages are also intentional. Base layout CSS and presentation CSS remain separate cascade layers; repeated selectors across those layers are not duplicate files. Requirements input and the environment lock snapshot serve different purposes.

## Content review

No matching restricted-script text, geographical references or reviewed personal-name variants were found in first-party text or local database content. The expanded scan checked 3,487 persisted text/JSON values without printing credentials. Seed identities remain Alex Morgan, Jordan Taylor and Casey Reed. This is a finite pattern scan plus manual identity review, not a universal linguistic classification of every possible name. Existing user-controlled future input is not prohibited or transformed by the application.

## Verification

- Backend: Ruff passes; 16 tests pass. One existing upstream Starlette/httpx deprecation warning remains.
- Frontend: strict TypeScript, ESLint and nine Node tests pass.
- Production build: Next.js Webpack build passes.
- Browser: all seven main authenticated pages load at desktop 1440px and mobile 390px; measured document scroll widths do not exceed viewport widths.
- Viewer browser checks: agent creation, workflow creation, duplicate/archive, graph editing, publishing and running are disabled; settings remain read-only.
- Mobile: navigation drawer, workflow node list and configuration inspection, profile/preferences sections and status controls checked.
- Forms: invalid agent form reports validation, Escape closes, focus returns to the opener, real agent save succeeds, organization save succeeds and workflow validation succeeds.
- Updated backend smoke run: Research briefing completed all five steps with persisted output; the browser console reported no errors.

## Practical limits

Docker is unavailable on this host, so container changes are statically reviewed rather than executed. PostgreSQL/Redis/Celery and external provider calls require separate environment verification. Testing covers the local deterministic provider and SQLite mode. Cross-browser coverage, real touch devices and a complete screen-reader audit are not claimed. Existing documented product limits still apply: manual triggers, server-managed external credentials, no invitation/SSO/password-reset implementation, bounded sequential DAG execution, and no external notification delivery. Legacy base CSS remains a future modularization opportunity; source files are not all equally small.
