# Project Context

- **Owner:** bradygaster (bradyg@microsoft.com)
- **Project:** Conway's Law experiment — specialized agents vs. generic agents on the same tasks
- **Stack:** TBD (Lead will decide)
- **Created:** 2026-02-13

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### 2026-02-13: Initial test suite written
- **Stack:** Node.js + Express + better-sqlite3, tests use `node:test` + `node:assert` + `supertest`.
- **Test count:** 29 tests (15 model unit tests, 14 API integration tests). All passing.
- **Test DB strategy:** In-memory SQLite via `better-sqlite3(':memory:')`. The `tests/helpers.js` module clears the Node require cache for all `app/src/` modules, then patches `connection.getConnection` to return the in-memory DB. This ensures every module that imports `getConnection` gets the patched version. Teardown closes the DB and restores the original function.
- **Gotcha — require cache:** Destructured imports like `const { getConnection } = require(...)` capture a reference at load time. Monkey-patching the exports object after the module is already loaded does nothing. You must clear `require.cache` for the entire `src/` tree before re-requiring modules. This is the only reliable way to inject a test DB without modifying source code.
- **Package.json fix:** The test script was `node --test src/**/*.test.js` but tests live in `tests/`. Updated to `node --test tests/**/*.test.js`.
- **Coverage areas:** Task CRUD, status transitions (todo→in-progress→done), invalid transitions (skip/backward), 404/400/422 error responses, edge cases (empty title, whitespace-only title, missing fields).

📌 Team update (2026-02-13): Stack and architecture finalized — Node.js + Express + better-sqlite3, flat project layout, one-command run, status transitions forward-only — decided by Rusty

📌 Team update (2026-02-13): API contract finalized with 6 endpoints, status transitions, and test support pattern — decided by Basher

📌 Team update (2026-02-13): Documentation strategy established with weighted rubric (Quality 30%, Cycle Time 20%, Clarity 20%, Waste 15%, User-Value 15%), run duration 8–12 hours, specialist roles defined (Coordinator orchestration-only), generic autonomy (no escalation) — decided by Saul
