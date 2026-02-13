# Project Context

- **Owner:** bradygaster (bradyg@microsoft.com)
- **Project:** Conway's Law experiment — specialized agents vs. generic agents on the same tasks
- **Stack:** TBD (Lead will decide)
- **Created:** 2026-02-13

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

- **2026-02-13: CLI client built** — `app/cli/taskboard.js` implements all 8 commands (list, get, add, update, start, done, delete, help). Uses Node built-in `fetch`, no external dependencies. Argument parsing is manual (no library). The API has no server-side `?status=` filtering, so `list --status=` filters client-side. Error responses from the API use `{ "error": "message" }` shape — the CLI extracts and displays that. Connection refused errors give the user a helpful "Is the server running?" nudge. Added `"cli"` script to package.json.
- **Status transitions are strict** — `todo → in-progress → done` only. No skipping, no backward. The API returns 422 for invalid transitions. The CLI surfaces that error message directly.

📌 Team update (2026-02-13): Stack and architecture finalized — Node.js + Express + better-sqlite3, flat project layout, one-command run, status transitions forward-only — decided by Rusty

📌 Team update (2026-02-13): API contract finalized with 6 endpoints, status transitions, and test support pattern — decided by Basher

📌 Team update (2026-02-13): Documentation strategy established with weighted rubric (Quality 30%, Cycle Time 20%, Clarity 20%, Waste 15%, User-Value 15%), run duration 8–12 hours, specialist roles defined (Coordinator orchestration-only), generic autonomy (no escalation) — decided by Saul
