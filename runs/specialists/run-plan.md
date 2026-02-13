# Run Plan: Specialists Mode

## Overview

This plan describes how to execute the Conway's Law experiment using a **Specialist Team** structure. Specialists have clear ownership boundaries, defined responsibilities, and explicit escalation rules.

**Start Point:** Fresh clone of main branch at `/app`
**Duration:** Target 8–12 hours (two 4–6 hour sprints with a QA phase)
**Team Size:** 6 specialists (Coordinator, API/Services, Data/Persistence, CLI UX, QA/Test, Docs/Release)

---

## Pre-Run Setup

### 1. Roles & Escalation (5 min)

Assign the six specialist roles to agents:
- **Coordinator:** Orchestrates task allocation, resolves cross-team blockers, owns integration points
- **API/Services:** Owns HTTP routes, request/response handling, error responses
- **Data/Persistence:** Owns database schema, migrations, query logic, transactions
- **CLI UX:** Owns CLI client, user-facing features, CLI testing
- **QA/Test:** Owns all test code, test infrastructure, coverage, bug bash execution
- **Docs/Release:** Owns API docs, process docs, decision logs, release notes

Each specialist reads `/squad/profiles/specialists.md` to understand their charter, "do not do" boundaries, and escalation triggers.

### 2. Environment Setup (10 min)

```bash
cd /app
npm install
npm test  # Confirm baseline (should pass)
npm start  # Confirm server starts; Ctrl+C to stop
```

Record baseline metrics:
- Start timestamp: ___________
- Baseline test count and coverage: ___________
- All agents online: ___________

### 3. Task Review (10 min)

Walk through all 5 tasks in `/tasks/`:
1. `/tasks/01-add-task-filtering.md`
2. `/tasks/02-add-task-priorities.md`
3. `/tasks/03-add-bulk-operations.md`
4. `/tasks/04-add-task-history.md`
5. `/tasks/05-add-export-import.md`

Coordinator confirms all agents understand task scope and acceptance criteria. Any questions are resolved before work begins.

---

## Phase 1: Sprint (Hours 0–4)

### Coordinator: Setup & Work Allocation (0–30 min)

1. Create main tracking document: `/runs/specialists/log-phase-1.md`
2. Create `decisions.md` for logging choices
3. Create `bug-bash.md` for QA findings
4. Assign tasks to specialists:
   - **Task 01 (Filtering):** API/Services + Data/Persistence (API routes + query logic)
   - **Task 02 (Priorities):** API/Services + Data/Persistence + CLI UX (schema, routes, CLI update)
   - **Task 03 (Bulk Ops):** API/Services + Data/Persistence (bulk endpoints + transactions)
   - **Task 04 (History):** Data/Persistence + QA/Test (audit schema + logging + tests)
   - **Task 05 (Export/Import):** API/Services + Data/Persistence + Docs/Release (endpoints + docs)

5. Open feature branches (one per task):
   ```bash
   git checkout -b feature/task-01-filtering
   git checkout -b feature/task-02-priorities
   # ... etc
   ```

### Specialists: Development (30 min – 3.5 hours)

**Parallel work streams:**

- **API/Services + Data/Persistence:** Task 01, 02, 03, 05
  - Start with Task 01 (filtering) — simplest, establishes patterns
  - Move to Task 03 (bulk ops) — uses transaction patterns
  - Coordinate on Task 05 (export/import) endpoints
  - Task 02 (priorities) depends on schema migration, so Data/Persistence does that first

- **Data/Persistence:** Task 02, 04
  - Parallel: Task 02 migration (priority field), Task 04 (audit schema)

- **CLI UX:** Task 02 (integrate priority into CLI)

- **QA/Test:** Write tests as code is pushed (TDD-friendly)
  - Task 01 tests
  - Task 02 tests
  - Task 03 tests
  - Task 04 tests
  - Task 05 tests

- **Docs/Release:** Document as tasks are completed
  - Update `/app/README.md` with new endpoints (Task 01, 02, 03, 05)
  - Update `/app/README.md` with history endpoint (Task 04)

### Integration Checkpoints (3:30 mark)

At 3 hours 30 minutes:
1. Run `npm test` — all tests must pass
2. Coordinator checks for merge conflicts
3. If conflicts, assignees resolve collaboratively
4. Docs/Release: Verify all new endpoints are documented

### Escalation Triggers

If blocked:
- **API route question:** → Coordinator
- **Schema design question:** → Data/Persistence + Coordinator (impact on all tasks)
- **Test infrastructure question:** → QA/Test
- **CLI usability question:** → CLI UX + Coordinator

---

## Phase 1 Wrap-Up (3:45–4:00 hours)

### Create PR for each task (Coordinator + assignees)
- Branch: `feature/task-0X-{name}`
- Title: `feat: Task 0X — {name}`
- Description: Link to task definition, note any deviations from acceptance criteria
- Assign to Docs/Release for review

### Docs/Release Review & Merge
1. Verify all acceptance criteria are met
2. Verify tests pass and coverage is acceptable
3. Verify API docs are updated
4. Merge to main (no squash; preserve commit history)

### Log Phase 1 Metrics
Update `/runs/specialists/log-phase-1.md`:
- End timestamp
- PRs merged
- Test count & coverage
- Any merge conflicts resolved
- Blockers encountered

---

## Phase 2: Sprint (Hours 4–8)

If not all tasks are complete, continue with remaining work:

### Coordinator: Reprioritize if needed
- What's left? Rank by complexity and interdependencies.
- Reassign if a specialist is overwhelmed.
- Update decision log if scope changes.

### Specialists: Development (same patterns as Phase 1)
- Open new branches for unfinished work
- Parallel development
- Integration checkpoints at 1.5 hours and 3 hours

### End-of-Phase 2
- All PRs merged
- `npm test` passes
- All tasks complete or explicitly deferred (with reason in decision log)

---

## Phase 3: QA & Bug Bash (Hours 8–10)

### QA/Test + All Specialists

1. **Full test suite run:**
   ```bash
   npm test
   ```
   Record: Pass count, coverage %, any failures

2. **Manual bug bash** (follow `/runs/specialists/bug-bash.md` template):
   - Go through each task's acceptance criteria manually
   - Try common edge cases: empty input, invalid status, boundary values
   - Try workflow combinations (e.g., filter + sort + export)
   - Log any bugs found: description, severity (minor/major), reproducible steps

3. **Bug triage:**
   - Major bugs: Fix immediately (same specialist), create PR, test, merge
   - Minor bugs: Log for later or defer (note in decision log)

4. **Coverage check:**
   - Target: ≥85% coverage
   - If below target: QA/Test + relevant specialist add tests

### Docs/Release: Final Documentation Pass
- Verify all endpoints documented with examples
- Verify edge cases explained (e.g., behavior on invalid filters)
- Verify state machine documented (status transitions, constraints)
- Update `/app/README.md` if needed

---

## Phase 4: Closure (Hours 10–12)

### Coordinator: Final Metrics
1. Record total elapsed time (start to finish)
2. Tally final test count and coverage
3. List all bugs found and fixed/deferred
4. Calculate cycle time per task
5. List all merge conflicts and resolutions

### Docs/Release: Final Decision Log
1. Review decision log for completeness
2. Add any outstanding decisions
3. Verify all major choices are documented with rationale

### Archive Logs
Move to:
- `/runs/specialists/log-phase-1.md`
- `/runs/specialists/log-phase-2.md` (if Phase 2 occurred)
- `/runs/specialists/decisions.md`
- `/runs/specialists/bug-bash.md`

---

## Escalation & Coordinator Involvement

The Coordinator is available for:
1. **Scope clarifications:** When a task's acceptance criteria are ambiguous
2. **Cross-team conflicts:** When API design impacts persistence design or CLI integration
3. **Dependency resolution:** When Task X is blocked waiting for Task Y
4. **Blocker removal:** When external issues (tool failures, git problems) halt work

The Coordinator does **not** do:
- Write feature code
- Review code (Docs/Release does)
- Run tests (QA/Test does)
- Make technical architecture decisions (specialists do; escalate only if major disagreement)

---

## Success Criteria

By end of Phase 4:
- [ ] All 5 tasks complete (or explicitly deferred with reason)
- [ ] `npm test` passes with ≥85% coverage
- [ ] No bugs > "major" severity unfixed
- [ ] All endpoints documented
- [ ] All merge conflicts resolved cleanly (≤3 conflicts is acceptable)
- [ ] Decision log complete with ≥10 entries
- [ ] Zero direct commits to main (all work via PRs)
- [ ] Elapsed time logged and traceable via git timestamps

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-02-13 | Saul | Initial run plan |
