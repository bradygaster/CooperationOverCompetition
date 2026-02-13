# Project Context

- **Owner:** bradygaster (bradyg@microsoft.com)
- **Project:** Conway's Law experiment — specialized agents vs. generic agents on the same tasks
- **Stack:** TBD (Lead will decide)
- **Created:** 2026-02-13

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### 2026-02-13: Stack and architecture established

- **Stack:** Node.js (no TS) + Express 4 + better-sqlite3 + Node built-in test runner (`node --test`)
- **App concept:** Task board API — CRUD on tasks with status transitions (todo → in-progress → done)
- **Domain model:** Task (id, title, description, status, created_at, updated_at)
- **API surface:** GET /tasks, GET /tasks/:id, POST /tasks, PATCH /tasks/:id, DELETE /tasks/:id
- **One-command run:** `npm start` from `/app`. `npm test` for tests. No Docker, no build step.
- **Persistence:** SQLite via better-sqlite3. DB file at `app/data/taskboard.db` (gitignored). Schema applied on startup.
- **Project layout:**
  - `app/src/index.js` — entry point
  - `app/src/app.js` — Express app factory (for testing)
  - `app/src/routes/tasks.js` — route handlers
  - `app/src/db/connection.js` — SQLite singleton
  - `app/src/db/migrate.js` — schema migration
  - `app/src/models/task.js` — data access layer
  - `app/tests/` — test files using Node built-in test runner
  - `app/cli/taskboard.js` — CLI client
- **Directory structure at repo root:**
  - `/app` — the application
  - `/tasks` — task definitions for the experiment
  - `/rubric` — evaluation rubric
  - `/runs/specialists` and `/runs/generics` — run harness artifacts
  - `/squad/profiles` — team profiles (specialist and generic)
  - `/docs` — experiment documentation
- **Decision file:** `.ai-team/decisions/inbox/rusty-stack-and-architecture.md`
- **Key convention:** No TypeScript, no build tools, no Docker. Keep it dead simple so any agent can work on it immediately.

📌 Team update (2026-02-13): API contract finalized with 6 endpoints, status transitions, and test support pattern — decided by Basher

📌 Team update (2026-02-13): Documentation strategy established with weighted rubric (Quality 30%, Cycle Time 20%, Clarity 20%, Waste 15%, User-Value 15%), run duration 8–12 hours, specialist roles defined (Coordinator orchestration-only), generic autonomy (no escalation) — decided by Saul
