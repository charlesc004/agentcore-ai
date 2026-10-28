# Architecture

AgentCore separates domain graph rules, application services, persistence, adapters, and transport. This is a compact architecture: shared persistence/DTO modules avoid empty module boilerplate, while feature services own orchestration. Feature-specific REST presentation modules compose those services. Analytics aggregation lives in its own application service. It does not claim the full four-layer directory tree per every requested feature.

## Backend

Pydantic DTOs validate inputs and serialize explicit response shapes. SQLAlchemy 2 declarative records use UUID identifiers, indexed tenant foreign keys, UTC creation timestamps, and JSON workflow configuration. Repository queries require an organization identifier. Routes obtain users from verified JWTs and enforce builder or admin roles on mutations. Service methods commit transactions around catalog changes and audit records. Passwords use Argon2. Refresh tokens are stored as SHA-256 hashes and rotated on use.

Workflow graphs are snapshotted on execution creation. A unique tenant/idempotency-key constraint reduces duplicate submission. An atomic queued-to-running update claims execution. Step records provide the durable execution timeline; waiting approval is a persisted state. The Celery adapter receives only execution identifiers and opens its own session. Local mode calls the same task body through FastAPI BackgroundTasks.

AIProvider and Tool abstract base classes define replaceable adapters. Models generate data, never authorization or executable system instructions. No arbitrary code execution or outbound HTTP tool is exposed. The real provider endpoint is configured only by trusted server operators.

## Frontend

Next App Router composes a persistent responsive shell and feature components. TanStack Query handles data loading, cache invalidation, and monitoring polls. The API client supplies bearer authentication and serializes refresh rotation. React Hook Form and Zod validate agent/login forms. React Flow owns node and edge interactions while the inspector edits node data. Recharts renders backend-derived activity, with Framer Motion for restrained entry motion.

## Deployment boundary

Compose supplies PostgreSQL, Redis, API, worker, migration, and Next frontend services. Production deployment also needs TLS termination, durable backups, secret rotation, worker recovery, distributed rate limiting, session hardening, observability, and security review. SQLite is an alternate local demonstration adapter, not a replacement for PostgreSQL deployment validation.

## Migration policy

The initial migration contains explicit Alembic table and index operations, independent of future ORM edits. Future versions should add immutable schema revisions with tested upgrade and downgrade paths.
