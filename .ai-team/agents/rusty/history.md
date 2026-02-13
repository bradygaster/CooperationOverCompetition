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

### 2026-02-13: Experiment execution plan finalized

- **Run order:** Specialists first, then generics. Structured run first catches environmental issues early.
- **Isolation:** Git branches (`run/specialists` and `run/generics`), both branching from `main` at `d2190f6`. Feature branches merge into run branches, never into `main`. This preserves full git history for scoring and prevents cross-contamination.
- **Task order:** 01 → 05 for both runs. Same order eliminates ordering as a confound. Task 04 (history) is the coupling pin — it touches everything.
- **Generic simulation:** 5 fresh agents with the generic charter from `/squad/profiles/generics.md`. NOT our specialist squad with loosened boundaries. 5 agents (not 6) because generics have no Coordinator role.
- **Scoring:** Evidence-based, collected during runs, scored after both complete. Cycle time measured in spawns + wall-clock. Quality from `npm test`. Waste from git log (conflicts, reverts). Clarity from docs completeness. User-value from task completion checklist.
- **Concrete execution:** 24-step plan written to `.ai-team/decisions/inbox/rusty-experiment-execution.md`. Steps 1–12 = specialists, 13–22 = generics, 23–24 = scoring and report.
- **Key insight for AI agents:** The human run plan's "hours" don't apply — each task is a spawn. Cycle time = spawn count × complexity. We record both wall-clock and spawn count, then normalize.
- **Decision file:** `.ai-team/decisions/inbox/rusty-experiment-execution.md`
