# Decisions

> Shared team decisions. All agents read this before starting work. Scribe merges new entries from the inbox.

### 2026-02-13: Stack and architecture decisions
**By:** Rusty

---

#### Decision 1: Stack — Node.js + Express + better-sqlite3

**What:** The app will be built with Node.js (no TypeScript), Express for HTTP, and better-sqlite3 for persistence.

**Why:**
- **Node.js without TypeScript** — Zero compile step. One-command startup (`node src/index.js`). No build tooling to maintain. The app is small enough that TypeScript adds friction without meaningful safety gains.
- **Express** — The most widely-known Node HTTP framework. Any agent (specialist or generic) can work with it immediately. No learning curve, no magic.
- **better-sqlite3** — Synchronous SQLite bindings. Single-file database, no server process, no connection management. Gives us real SQL persistence without ops overhead. The DB file lives at `app/data/taskboard.db` (gitignored). Schema is applied on startup via migrations in `app/src/db/`.
- **Node's built-in test runner** (`node --test`) — No Jest, no Mocha. Ships with Node 18+. Fewer dependencies, fewer config files.

**Rejected alternatives:**
- Python/Flask — Equally valid, but the owner (bradygaster) is a .NET/JS person. Node is the better fit.
- TypeScript — Over-engineering for a throwaway experiment app. Adds a build step we don't need.
- JSON file persistence — Too fragile for concurrent access patterns. SQLite is the pragmatic middle ground.
- MongoDB/Postgres — Requires a running server. Violates the one-command-run requirement.

---

#### Decision 2: App concept — Task Board API

**What:** The app is a minimal task board (like a stripped-down Trello). It manages tasks with status transitions.

**Why:** A task board has the right amount of surface area for the experiment:
- **API surface:** CRUD on tasks + status transitions + filtering = ~6-8 endpoints. Enough to create coordination pressure between agents.
- **Persistence:** Tasks, statuses, timestamps — simple schema but real enough to need migrations and data integrity.
- **UI/CLI:** A CLI client that talks to the API. Simpler than a web UI, still demonstrates the full stack.
- **Tests:** Each endpoint and each status transition is independently testable. Clear acceptance criteria.
- **Cross-cutting concerns:** Error handling, validation, logging — enough shared surface to create merge conflicts and coordination challenges (which is the point of the experiment).

**Domain model:**
- `Task` — id, title, description, status (todo|in-progress|done), created_at, updated_at
- Status transitions: todo → in-progress → done (no skipping, no backward moves)
- API: GET /tasks, GET /tasks/:id, POST /tasks, PATCH /tasks/:id, DELETE /tasks/:id

---

#### Decision 3: Project layout

**What:** Flat, conventional Node project structure inside `/app`.

```
app/
├── package.json
├── src/
│   ├── index.js          # Entry point — starts Express server
│   ├── app.js            # Express app factory (exported for testing)
│   ├── routes/
│   │   └── tasks.js      # Task routes
│   ├── db/
│   │   ├── connection.js  # SQLite connection singleton
│   │   └── migrate.js     # Schema migration on startup
│   └── models/
│       └── task.js        # Task data access (queries)
├── tests/
│   ├── tasks.test.js      # API integration tests
│   └── model.test.js      # Unit tests for task model
├── cli/
│   └── taskboard.js       # CLI client
└── data/                  # SQLite DB lives here (gitignored)
```

**Why:** No nested src/lib/core/domain hierarchy. Files are where you'd expect them. New contributors (or agents) can navigate by convention.

---

#### Decision 4: One-command run

**What:** `npm start` from `/app` starts the server. `npm test` runs all tests. No Docker, no docker-compose, no Makefile.

**Why:** The prompt says "one-command local run experience." npm scripts are the simplest way to deliver that for a Node app. Docker adds a layer we don't need for a local experiment.

**Prerequisites:** Node.js 18+ installed. That's it.

---

#### Decision 5: No shared state between experiment runs

**What:** Each experiment run (specialists vs. generics) works against a fresh clone. The `/app` directory in `main` is the starting point for both runs.

**Why:** Fair comparison requires identical starting conditions. Both teams get the same skeleton and the same tasks. Divergence is the signal we're measuring.

---

### 2026-02-13: Backend API contract

**By:** Basher

---

**What:** The Task Board API is live with the following contract. All endpoints are implemented and manually verified.

**Endpoints:**

| Method | Path | Success | Error Cases |
|--------|------|---------|-------------|
| GET | /tasks | 200 + array | — |
| GET | /tasks/:id | 200 + task | 404 if not found |
| POST | /tasks | 201 + created task | 400 if title missing/empty |
| PATCH | /tasks/:id | 200 + updated task | 404 not found, 400 bad input, 422 invalid transition |
| DELETE | /tasks/:id | 200 + deleted task | 404 if not found |

**Status transitions (enforced in model layer):**
- `todo` → `in-progress` ✓
- `in-progress` → `done` ✓
- Everything else → 422

**For test authors:** `app/src/app.js` exports `createApp()` which returns an Express app without calling `.listen()`. Import that in tests. The `closeConnection()` function in `app/src/db/connection.js` resets the DB singleton for cleanup between test runs.

**For CLI authors:** All responses are JSON. Created tasks return 201. Error responses have `{ "error": "message" }` shape.

---

## 2026-02-13: Documentation Strategy & Artifacts

**By:** Saul

---

### Decision 1: Rubric Weights — Prioritize Quality over Speed

**What:** The evaluation rubric weights dimensions as:
- Quality (30%)
- Cycle Time (20%)
- Clarity (20%)
- Waste (15%)
- User-Value (15%)

**Why:**
- **Quality first:** A fast team that ships broken code doesn't win. Correctness, test coverage, and bug count are paramount.
- **Cycle time second:** Speed matters, but not at the cost of quality. A 10-hour run with high quality beats a 4-hour run with low quality.
- **Clarity & waste:** Both are important but secondary. Clarity enables future work; waste is expensive but survivable.
- **User-value:** Alignment matters, but if all tasks are prioritized equally and completed, this becomes a tiebreaker.

**Evidence needed:** Test output, bug bash logs, code review feedback, decision log completeness, merge conflict history, task completion checklist.

---

### Decision 2: Task Interdependency — Task 04 (History) is the Coupling Pin

**What:** Task 04 (Add Task History / Audit Log) requires **all other tasks** to integrate audit logging into their mutations. This creates strong coordination pressure.

**Why:**
- Task 04 is not independent; it touches every other task
- In Specialists mode, this forces upfront design discussion (Data/Persistence + Coordinator plan schema with all stakeholders)
- In Generics mode, agents will discover conflicts late (one agent designs history independently; others must adapt)
- This amplifies the difference between team structures and makes the experiment more meaningful

**Implication:** Any run scoring should note Task 04 completion as **critical to overall success**. If Task 04 is incomplete or poorly integrated, the entire audit trail is compromised.

---

### Decision 3: Run Duration — 8–12 Hours, Two Sprints + QA

**What:** Each run (specialists and generics) is allocated 8–12 hours:
- **Phase 1:** 0–4 hours (first sprint + integration checkpoint)
- **Phase 2:** 4–8 hours (second sprint if needed)
- **Phase 3:** 8–10 hours (QA & bug bash)
- **Phase 4:** 10–12 hours (closure & metrics)

**Why:**
- **Realistic:** 2–3 full days of work (fits a long coding session or distributed sprint)
- **Tight enough:** Time pressure creates natural tradeoffs (speed vs. quality, feature completeness vs. bug fixing)
- **Loose enough:** Both teams should complete most tasks (not a failure if 1 task is deferred)
- **QA phase is explicit:** Distinguishes between dev-time bugs and QA-found bugs; reveals which team structure catches issues earlier

**Note:** If a team completes all tasks early, they should use remaining time for documentation cleanup, edge case testing, or performance optimization.

---

### Decision 4: Specialist Roles — Coordinator is Gating Function, Not Developer

**What:** The Coordinator role is orchestration-only. The Coordinator does not:
- Write feature code
- Make technical architecture decisions unilaterally
- Review code PRs (Docs/Release does)
- Implement API endpoints, schema, or tests

**Why:**
- **True specialization:** Other 5 roles are technical specialists; Coordinator is a process specialist
- **Clear boundaries:** Prevents Coordinator from becoming a bottleneck (by doing all the coding) or a tyrant (by overriding technical decisions)
- **Fair comparison:** Generics have 5 agents; Specialists have 6. Coordinator is the 6th to make up for the orchestration role that Generics don't have.

**Implication:** Coordinator's job is to **remove blockers, track progress, and enforce quality gates**, not to code.

---

### Decision 5: Generic Autonomy — No Escalation Protocol

**What:** In Generics mode:
- There is no Coordinator role
- There is no escalation process
- Conflicts are resolved peer-to-peer (via PR discussion or code rewrite)
- Agents make decisions autonomously and communicate via PRs/decision log (optional)

**Why:**
- **True contrast:** Specialists have explicit coordination; Generics have none
- **Realistic:** Reflects real open-source teams (no manager, just peers)
- **Reveals cost:** Measures how much time agents spend in conflict resolution vs. coordination
- **Fair:** Both teams have access to decision logs and PR discussions; generics just don't have a gating function

**Implication:** Generics may have more merge conflicts, rework, and inconsistency, but they may also move faster (no approval bottleneck). The rubric will reveal the tradeoff.

---

### Decision 6: Documentation Expectations — Minimal, Not Verbose

**What:** All documentation (run plans, decision logs, API docs) is structured for **clarity and brevity**, not comprehensiveness:
- Decision log entries: 1–2 sentences of context, decision, rationale
- API docs: Endpoint name, query params, example curl, error codes
- Runbook: Step-by-step, not narrative prose

**Why:**
- **Agents are busy:** They don't have time to write 10-page design documents
- **Clarity over length:** 1 well-written decision beats 5 pages of meeting notes
- **Rubric rewards clear decisions, not verbose ones:** Clarity score is based on "can a stranger understand the decision" not "how many pages"

**Implication:** Docs/Release specialist's job is to enforce **quality, not quantity**. A sparse but clear decision log is better than a verbose, rambling one.

---

### Decision 7: Fair Comparison — Identical Tasks, But Agents May Differ

**What:** Both runs receive:
- Identical task definitions (same acceptance criteria, constraints)
- Identical starting code (same /app skeleton)
- Identical tools (Node, npm, git, SQLite)
- Identical time budget (8–12 hours)

**But:**
- Agents may differ in capability (if same pool is not available)
- Agent assignment to roles may not be uniform (e.g., not all specialists equally experienced)

**Why:**
- **Fairness:** Neither team starts with an advantage in code or task definition
- **Realism:** In real organizations, agents have different capabilities
- **Transparency:** If agents differ, we log it and note it in the final analysis

**Implication:** Scoring should include a confound analysis: "Specialist agent X was faster/slower than generic agent Y — does this explain the difference?" This doesn't invalidate the result, but it contextualizes it.

---

### Decision 8: Rubric Scoring — 0–5 Per Dimension, 5 Dimensions

**What:** Each dimension (cycle time, quality, clarity, waste, user-value) is scored 0–5:
- 5 = Excellent (exceeds expectations)
- 4 = Good (meets expectations)
- 3 = Acceptable (minimal issues)
- 2 = Weak (significant issues)
- 1 = Poor (major failures)
- 0 = Failed (incomplete or non-functional)

Final score is weighted average (as above).

**Why:**
- **0–5 scale:** Familiar to educators and researchers; easy to compare
- **5 dimensions:** Covers breadth (time, quality, clarity, efficiency, alignment)
- **Weighted:** Emphasizes what matters most (quality + cycle time account for 50%)
- **Objective criteria:** Each score has specific evidence (test output, bug count, commit history, etc.)

**Note:** Scorers should evaluate independently (to avoid anchoring bias), then discuss outliers.

---

## Decisions Not Made (Deferred)

- **Agent assignment:** Who plays Coordinator, API/Services, etc.? (Coordinator makes this decision at run start)
- **Exact task order:** Both teams tackle tasks 01–05, but might do them in different order (okay; order is not expected to differ materially)
- **Final scoring:** Who scores the rubric? (Whoever runs the experiment; ideally 2+ scorers to cross-check)

---

## Follow-Up Decisions Needed (For Next Experiment Round)

- Should we measure **latency** of individual features (how long from task assignment to first passing test)?
- Should we weight **knowledge transfer** (did agents on generics learn from each other's code)?
- Should we run a **reverse experiment** (generics with coordinator, specialists without)? (Interesting, but out of scope for now)
