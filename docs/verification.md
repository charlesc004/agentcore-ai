# Local verification — 2026-10-28

| Check | Result |
| --- | --- |
| Backend Pytest suite | 10 passed; one upstream Starlette/httpx deprecation warning |
| Ruff backend lint | Passed |
| Alembic initial upgrade | Passed on SQLite |
| Explicit migration upgrade / seed / repeated seed / downgrade / re-upgrade | Passed on isolated SQLite database |
| Demo seed on preview database | Passed; second seed leaves records unchanged |
| Frontend strict TypeScript | Passed |
| Frontend ESLint | Passed with no warnings after cleanup |
| Next.js optimized production build | Passed; 10 route entries, including dynamic workflow detail |
| Browser login with seeded admin | Passed against running API |
| Browser dashboard | Real 48-run seeded metrics displayed before smoke execution |
| Browser workflow loading, save, validation | Passed on Research briefing |
| Browser builder Test run | Created persisted successful execution |
| Browser execution monitor | Five successful steps and final structured output displayed |
| Docker / PostgreSQL / Redis / Celery integration | Not executed: Docker is not installed on this host |
| External AI provider | Not executed: no external credentials supplied |
| Mobile interaction, keyboard and screen-reader audit | Not comprehensively tested |

Environment: Windows, Python 3.14, Node.js 24.11.1. Backend target supports Python 3.12+. Preview uses frontend http://127.0.0.1:3100 and API http://localhost:8100; documented normal local defaults are frontend localhost:3000 and API localhost:8000. Existing unrelated services occupied the default ports.

Dependency installation initially failed due to network connection resets. The final installation succeeded from cached official npm packages. The final source builds successfully; intermediate missing-package failures were resolved.

See README.md for implementation limitations and commands to repeat the checks. No hosted production readiness or unexecuted infrastructure checks are implied.

## Premium frontend redesign verification

- Six frontend regression tests pass: idle/active/read-only edge presentation, graph immutability, missing agent feedback and nested credential redaction.
- Backend regression suite remains 10 passed, with the existing upstream Starlette/httpx deprecation warning. Backend implementation and contracts were preserved.
- Browser checks: split authentication, real API dashboard, workflow loading/save/validation, add/undo/redo, actual test execution reaching human approval, and selectable execution input/output inspection.
- Responsive browser review: 390px login/dashboard and workflow inspection list; mobile node selection and navigation drawer; 1024px tablet canvas and inspector. These are targeted checks, not a comprehensive accessibility audit.
- Shared chart data is API-derived. No invented comparison percentages or unsupported live-data claims were added.
- Next.js Turbopack production compilation failed locally when its CSS worker exited before connecting. The supported Webpack compiler completed successfully; npm run build now uses it explicitly. Development continues to use Turbopack.
- The redesign preview uses frontend http://127.0.0.1:3200 and API http://127.0.0.1:8200. Set NEXT_PUBLIC_API_URL before building when using nondefault ports.
- Approval continuation browser check: the redesign smoke run resumed from waiting approval, completed all seven steps, and displayed the persisted final output with Succeeded status.

## Full project audit follow-up

Ruff, strict TypeScript, ESLint, 16 backend tests, nine frontend tests and the optimized build pass after audit fixes. All seven main pages passed desktop/mobile loading and document overflow checks. A five-step workflow completed against the updated backend with persisted results. See [project audit](project-audit.md) for findings, duplicate inventory, content scan scope and verification limits.
