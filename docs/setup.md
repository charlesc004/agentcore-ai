# Setup and configuration

**Requirements:** Python 3.12+, Node.js 24+, and npm. Local mode uses SQLite and the deterministic provider; Docker and an external AI key are optional.

### 1. Start the API

From the repository root, in PowerShell:

```powershell
cd backend
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` and replace `JWT_SECRET` with a random value of at least 32 characters. Keep the local database, execution mode, and CORS defaults for this setup.

```powershell
.venv/Scripts/python.exe -m alembic upgrade head
.venv/Scripts/python.exe -m app.seed
.venv/Scripts/python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

<details>
<summary>Linux / macOS equivalent</summary>

```bash
cd backend
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
cp .env.example .env
# Set a random JWT_SECRET in .env before continuing.
.venv/bin/python -m alembic upgrade head
.venv/bin/python -m app.seed
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

</details>

### 2. Start the frontend

Open a second terminal at the repository root:

```sh
cd frontend
npm ci
npm run dev
```

| Service | Local address |
| --- | --- |
| Workspace | [localhost:3000](http://localhost:3000) |
| Interactive API documentation | [localhost:8000/docs](http://localhost:8000/docs) |
| Health endpoint | [localhost:8000/health](http://localhost:8000/health) |

For the production frontend, run `npm run build`, then `npm start`. The build uses Next.js's supported Webpack compiler; development uses Turbopack.

### 3. Explore the demo

| Role | Email | Password | Access |
| --- | --- | --- | --- |
| Admin | `admin@example.com` | `DemoPass123!` | Build and run workflows; manage workspace settings. |
| Builder | `builder@example.com` | `DemoPass123!` | Configure agents, edit workflows, execute and approve runs. |
| Viewer | `viewer@example.com` | `DemoPass123!` | Inspect resources and recorded results. |

These are local demonstration accounts. To use another initial password, set the `DEMO_PASSWORD` process environment variable before the first seed. Seeding does not overwrite existing records.

The initial dataset provides four agents, two workflows, recorded history over 14 days, seeded failure examples, and a pending review. Screenshots can include additional executions created during verification; their totals are not the fresh-seed baseline.

### Your first end-to-end run

1. Sign in as an admin or builder.
2. Open **Workflows → Research briefing** and inspect an agent or tool node.
3. Choose **Validate**, then **Test run**.
4. Follow **Inspect run** to review the completed timeline and final JSON output.
5. Run **Customer inquiry triage** to explore conditional routing and human review.
6. Open the waiting execution and select **Approve & continue**.

## Configuration

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLAlchemy connection URL: SQLite for local mode, PostgreSQL in Compose. |
| `JWT_SECRET` | Explicit shared signing secret for stable sessions across restarts/processes. |
| `EXECUTION_MODE` | `local` for background tasks, or `celery` for worker dispatch. |
| `REDIS_URL` | Celery broker connection. |
| `CORS_ORIGIN` | Exact browser origin allowed by the API; default `http://localhost:3000`. |
| `DEMO_PASSWORD` | Process environment variable used only for initial seeded accounts. |
| `AI_API_KEY` | Optional external provider credential; server only. |
| `AI_API_URL` | Optional OpenAI-compatible chat-completions endpoint. |
| `AI_MODEL` | External model fallback when the agent uses the demo model identifier. |
| `NEXT_PUBLIC_API_URL` | Browser API base, including `/api`; default `http://localhost:8000/api`. |

Backend settings read `backend/.env`. The provider adapter reads its `AI_*` values from the server process environment. Frontend overrides can be set in `frontend/.env.local` or the process environment; public API URLs are embedded at build time.

For an external provider, export `AI_API_KEY` and any optional endpoint/model values before starting the API/worker. Select **OpenAI compatible** in an agent's configuration and supply the appropriate model identifier. External responses must be JSON objects. Credentials are never configured through `NEXT_PUBLIC_*` variables.

If changing local ports, update both `CORS_ORIGIN` and `NEXT_PUBLIC_API_URL`, and rebuild the production frontend.

## Docker Compose

The repository includes definitions for PostgreSQL, Redis, migrations, API, Celery worker, and frontend.

```powershell
# From the repository root:
Copy-Item .env.example .env
# Replace POSTGRES_PASSWORD and JWT_SECRET with random values.
docker compose up --build -d
docker compose run --rm api python -m app.seed
```

The migration service runs before the API and worker. PostgreSQL data persists in the `postgres_data` volume; database and Redis ports are internal to the Compose network. The frontend exposes port 3000 and the API exposes port 8000.

```sh
docker compose logs -f api worker
docker compose run --rm api alembic upgrade head
```

Local verification used SQLite/background-task mode. Container, PostgreSQL, Redis, and Celery behavior still require execution on a Docker-enabled host.
