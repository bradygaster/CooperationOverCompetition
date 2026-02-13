# How to Execute: Specialists Run

This document is a quick-start guide for running the Specialists experiment. Use this if you want step-by-step instructions to execute the run from start to finish.

---

## Pre-Execution Checklist (15 min)

- [ ] Repo is cloned and `/app` exists
- [ ] 6 agents are available (or persons assigned to specialist roles)
- [ ] All agents have read `/squad/profiles/specialists.md`
- [ ] All agents have read `/tasks/*.md` (task definitions)
- [ ] `/rubric/rubric.md` is reviewed (everyone understands scoring)
- [ ] This run plan is reviewed
- [ ] Stopwatch or timer is ready
- [ ] `/runs/specialists/` directory exists (for logs)

---

## Step 1: Setup (0–15 min)

### Coordinator Actions
```bash
cd /app
npm install
npm test
npm start  # Start server, test manually, Ctrl+C to stop
```

Record in `/runs/specialists/log-phase-1.md`:
- Baseline test count and coverage (e.g., "5 tests, 60% coverage")
- Start timestamp (e.g., "2026-02-13 09:00 UTC")

### All Agents
- Read this entire document
- Open `/tasks/01-*.md` through `/tasks/05-*.md`
- Confirm understanding of all 5 acceptance criteria

---

## Step 2: Task Assignment (15–30 min)

Coordinator reads `/squad/profiles/specialists.md` and assigns tasks:

| Task | Lead Specialist | Support |
|------|---|---|
| 01: Filtering | API/Services | Data/Persistence |
| 02: Priorities | API/Services | Data/Persistence, CLI UX |
| 03: Bulk Ops | API/Services | Data/Persistence |
| 04: History | Data/Persistence | QA/Test |
| 05: Export/Import | API/Services | Data/Persistence, Docs/Release |

Create feature branches:
```bash
git checkout -b feature/task-01-filtering
git checkout -b feature/task-02-priorities
git checkout -b feature/task-03-bulk-operations
git checkout -b feature/task-04-task-history
git checkout -b feature/task-05-export-import
```

---

## Step 3: Parallel Development (30 min – 3:30 hours)

### Work Organization

**Data/Persistence does:**
- Schema migrations (priority field, audit log table, etc.)
- Query logic and transactions
- Work in parallel on Tasks 01–05

**API/Services does:**
- HTTP routes for all tasks
- Request/response handling
- Work in parallel on Tasks 01, 02, 03, 05

**CLI UX does:**
- Update CLI client for new features (Task 02: priorities)
- Manual testing of CLI

**QA/Test does:**
- Write tests as code is pushed
- Test-first for each task
- Maintain test coverage

**Docs/Release does:**
- Document endpoints as they're created
- Update `/app/README.md`
- Create decision log entries (with help from specialists)

### Integration Checkpoints

**At 3:30 mark:**
```bash
npm test  # All tests must pass
npm start  # Server starts cleanly
git --no-pager status  # Check for uncommitted changes (should be clean)
```

Record results in log.

### If Stuck
- Specialist posts blocker in decision log (with timestamp)
- Coordinator is notified; coordinate resolution
- Continue other tasks while blocker is being resolved

---

## Step 4: PR Submission (3:30–4:00 hours)

Each specialist (or pair) who has completed code:

1. **Commit and push:**
   ```bash
   git add .
   git commit -m "feat(task-0X): [description]"
   git push origin feature/task-0X-{name}
   ```

2. **Open PR** with title and description (use template from `/runs/specialists/pr-plan.md`)

3. **Assign to Docs/Release** for review

### Docs/Release: Review & Merge
- Verify acceptance criteria met
- Verify tests pass
- Verify docs updated
- Merge to main (no squash)

Record in log: `PRs merged: [list]`

---

## Step 5: Phase 1 Closure (4:00 hours)

Update `/runs/specialists/log-phase-1.md`:
- End time
- Total elapsed: 4 hours (or actual)
- Test coverage (target: ≥75%)
- Bugs found: 0 (QA phase pending)
- Tasks completed: ___ / 5

---

## Step 6: Phase 2 (Hours 4–8) — If Needed

If not all tasks are complete:

1. **Reprioritize:** Coordinator identifies remaining work
2. **New branches:** Open feature branches for remaining tasks
3. **Repeat Steps 3–4** for Phase 2

Update `/runs/specialists/log-phase-2.md` with same metrics.

---

## Step 7: QA & Bug Bash (Hours 8–10)

### Full Test Suite
```bash
npm test
```
Record: pass/fail count and coverage %.

### Manual Bug Bash
Use `/runs/specialists/bug-bash.md` template. Go through each task:

1. **Task 01 (Filtering):**
   - Test `GET /tasks?status=todo` — does it work?
   - Test `GET /tasks?search=keyword` — case-insensitive?
   - Test `GET /tasks?status=invalid` — proper error?
   - Test combinations: `?status=done&search=test`

2. **Task 02 (Priorities):**
   - Test `POST /tasks` with priority field
   - Test `GET /tasks?sort=priority`
   - Test PATCH to update priority
   - Test CLI shows priority correctly

3. **Task 03 (Bulk Ops):**
   - Test `PATCH /tasks/bulk` with 3 task IDs
   - Test transaction rollback (invalid status in batch)
   - Test `DELETE /tasks/bulk`

4. **Task 04 (History):**
   - Create task, verify audit log entry
   - Update task, verify change is logged
   - Test `GET /tasks/:id/history`
   - Test bulk operation logs correctly

5. **Task 05 (Export/Import):**
   - Test `GET /tasks/export` — valid JSON?
   - Create file, test `POST /tasks/import` with file
   - Test idempotency (import twice, state unchanged)
   - Test transaction rollback (bad data in import)

**Log any bugs:**
```
Bug: [description]
Severity: Minor / Major
Reproduction: [steps]
Fixed: Yes / No (with commit SHA if fixed)
```

### Bug Triage
- Major bugs: Fix immediately (create fix branch, PR, merge)
- Minor bugs: Log for future work or include in next phase

---

## Step 8: Final Metrics & Closure (Hours 10–12)

### Coordinator: Record Final Metrics
- **Total elapsed time:** ___ hours (from start timestamp to finish)
- **Final test count:** ___ (target: all tests pass)
- **Final coverage:** __% (target: ≥85%)
- **Tasks completed:** ___ / 5 (target: 5 / 5)
- **Merge conflicts:** ___ (target: 0–3)
- **Bugs found:** ___ (target: 0 major, <5 minor)

### Docs/Release: Final Documentation
- Verify all endpoints documented in `/app/README.md`
- Verify edge cases explained
- Verify state machine documented
- Verify decision log is complete (≥10 entries)

### Archive Logs
Copy logs to `/runs/specialists/`:
- `log-phase-1.md` (or log-phase-2.md if Phase 2 occurred)
- `decisions.md` (final decision log)
- `bug-bash.md` (final bug log)

### Final Check
```bash
git --no-pager log --oneline main | head -20  # Verify all PRs merged
npm test  # Final test run passes
npm start  # Server starts, Ctrl+C to stop
```

---

## Success Criteria

At the end of the run:
- [ ] All 5 tasks complete
- [ ] `npm test` passes (all tests)
- [ ] Coverage ≥85%
- [ ] No major bugs unfixed
- [ ] All endpoints documented
- [ ] Decision log complete
- [ ] Elapsed time logged
- [ ] Zero direct commits to main

---

## Troubleshooting

### Tests fail after merge
- Check if test code was included in PR
- Run tests locally with same Node version
- If merge conflict in test file, resolve and re-run
- Coordinate with QA/Test specialist

### Merge conflict on main
- Resolve in feature branch (don't commit directly to main)
- Verify tests pass after resolution
- Re-submit PR
- Log conflict in decision log

### Blocker: Schema design
- Data/Persistence + API/Services meet with Coordinator
- Make decision, log it
- Continue with other tasks

### Time pressure
- Coordinator: Assess what's done and what can defer
- Log deferral in decision log
- Focus on quality over quantity

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-02-13 | Saul | Initial execution guide |
