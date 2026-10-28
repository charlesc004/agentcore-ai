# Publishing the repository

The release archive contains source, dependency manifests, CI, example configuration, documentation and six screenshots. Local databases, real environment files, sessions, installed dependencies, caches and build output are excluded. Seed the database after installing; the working database is not distributed.

## Create a remote repository

Create an empty repository on your Git hosting service, then run these commands from the extracted project folder. Replace the remote placeholder with your own repository URL.

```sh
git init -b main
git add .
git status --short
git commit -m "Initial AgentCore AI release"
git remote add origin <YOUR_REPOSITORY_URL>
git push -u origin main
```

Configure your Git author name and email if Git asks. The ZIP does not include local Git history. The canonical repository is [charlesc004/agentcore-ai](https://github.com/charlesc004/agentcore-ai); use the commands above when publishing your own copy to a different repository.

## Run and verify

Follow the installation, migration and seed commands in the root README. Copy example configuration to your local environment files, then replace placeholder server secrets before deployment. Run both test suites, lint, TypeScript and the production build. The GitHub Actions workflow repeats these checks on pushes and pull requests.

The screenshots in `docs/screenshots` are captures from the running production frontend using the local deterministic provider and persisted demo data. They are not design mockups. Normal setup uses UI port 3000 and API port 8000; capture sessions used ports 3200 and 8200.

## Release limitations

The local deterministic provider and SQLite mode were tested. Docker/PostgreSQL/Redis/Celery and external AI credentials require independent environment verification. See `docs/project-audit.md` and the README scope section before public deployment.
