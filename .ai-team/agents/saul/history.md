# Project Context

- **Owner:** bradygaster (bradyg@microsoft.com)
- **Project:** Conway's Law experiment — specialized agents vs. generic agents on the same tasks
- **Stack:** TBD (Lead will decide)
- **Created:** 2026-02-13

## Learnings

### Documentation Artifacts Created (2026-02-13)

**Task definitions** (`/tasks/`):
- `01-add-task-filtering.md` — Query filtering by status and search
- `02-add-task-priorities.md` — Priority field and sorting
- `03-add-bulk-operations.md` — Bulk status update and delete (transactional)
- `04-add-task-history.md` — Audit log for all mutations
- `05-add-export-import.md` — JSON export and import with idempotence

**Evaluation rubric** (`/rubric/rubric.md`):
- 5 scoring dimensions: Cycle Time (20%), Quality (30%), Clarity (20%), Waste (15%), User-Value (15%)
- Scoring scale 0–5 for each dimension; weighted final score
- Evidence artifacts required: logs, tests, PRs, documentation
- Fair comparison methodology with known confounds documented

**Run harness** (`/runs/{specialists,generics}/`):
- `run-plan.md` — Step-by-step execution plan (phases, milestones, checkpoints)
- `log-template.md` — Phase log template (progress, blockers, metrics)
- `decision-log-template.md` — Decision log (captures all major choices)
- `pr-plan.md` — PR process, branch naming, review workflow
- `how-to-execute.md` — Quick-start guide for execution

**Squad profiles** (`/squad/profiles/`):
- `specialists.md` — 6 roles: Coordinator, API/Services, Data/Persistence, CLI UX, QA/Test, Docs/Release. Each with explicit scope, responsibilities, "do not do" boundaries, required outputs.
- `generics.md` — 5 identical agents with no ownership boundaries, identical charter, autonomous decision-making
- `/squad/rules.md` — Shared rules: git hygiene, testing, documentation, code standards, performance, error handling

**Experiment documentation** (`/docs/`):
- `experiment.md` — Hypothesis, why tasks create coordination pressure, how team structures differ, metrics and rubric, fairness controls
- `conway-notes.md` — Conway's Law context, corollaries, related research, predictions

### Documentation Conventions Established

1. **Task definitions** include: problem statement, objective acceptance criteria, testable requirements (7–9 per task), constraints, "done when" checklist
2. **Rubric** uses weighted scoring (0–5) with clear evidence artifacts; final score is WA across dimensions
3. **Run plans** are detailed phase-by-phase with milestones, integration checkpoints, escalation triggers
4. **Squad profiles** define scope (what you own), responsibilities (what you do), boundaries (what you don't), outputs (artifacts required)
5. **Shared rules** are minimalist: git hygiene, tests required (≥75% coverage), docs required, error handling standardized

### Key Design Decisions

1. **Tasks 01–05** are chosen for interdependency, especially Task 04 (History) which requires all other tasks to integrate audit logging
2. **Specialists team** has Coordinator (orchestration), 4 technical specialists, + Docs/Release (gating function)
3. **Generics team** has 5 identical agents with no roles, no escalation, minimal coordination (peer-based)
4. **Rubric weights** prioritize Quality (30%) over Cycle Time (20%), reflecting that correctness > speed
5. **Run duration** is 8–12 hours with explicit phases: 2 sprints (4–6 hours each), QA/bug bash, closure
6. **Fair comparison** requires identical starting code, tasks, tools, time; confounds documented; blind evaluation preferred

📌 Team update (2026-02-13): Stack and architecture finalized — Node.js + Express + better-sqlite3, flat project layout, one-command run, status transitions forward-only — decided by Rusty

📌 Team update (2026-02-13): API contract finalized with 6 endpoints, status transitions, and test support pattern — decided by Basher

📌 Team update (2026-02-13): Task 04 (History) identified as coupling pin requiring all tasks to integrate audit logging — decided by Saul
