# Project Context

- **Owner:** bradygaster (bradyg@microsoft.com)
- **Project:** Conway's Law experiment — specialized agents vs. generic agents on the same tasks
- **Stack:** TBD (Lead will decide)
- **Created:** 2026-02-13

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### 2026-02-13: Backend API built

- **Stack confirmed:** Node.js + Express + better-sqlite3, no TypeScript. Works.
- **DB path:** `app/data/taskboard.db` — created on first run, gitignored.
- **Schema migration** runs on app startup via `app/src/db/migrate.js`. Single `tasks` table with CHECK constraint on status.
- **Status transitions** enforced in the model layer (`app/src/models/task.js`), not in the DB. Forward-only: todo → in-progress → done. Model throws with `code: 'INVALID_TRANSITION'`, route handler maps that to 422.
- **app.js exports `createApp()`** — factory pattern so tests can create isolated app instances.
- **connection.js** is a singleton with `closeConnection()` for test teardown.
- **Key file paths:**
  - `app/src/index.js` — entry point, listens on port 3000
  - `app/src/app.js` — Express app factory
  - `app/src/routes/tasks.js` — all task CRUD routes
  - `app/src/models/task.js` — data access layer (getAll, getById, create, update, remove)
  - `app/src/db/connection.js` — SQLite connection singleton
  - `app/src/db/migrate.js` — schema creation on startup

📌 Team update (2026-02-13): Documentation strategy established with weighted rubric (Quality 30%, Cycle Time 20%, Clarity 20%, Waste 15%, User-Value 15%), run duration 8–12 hours, specialist roles defined (Coordinator orchestration-only), generic autonomy (no escalation) — decided by Saul
