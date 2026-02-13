# How to Execute: Generics Run

This document is a quick-start guide for running the Generics experiment. Use this if you want step-by-step instructions to execute the run from start to finish.

---

## Pre-Execution Checklist (15 min)

- [ ] Repo is cloned and `/app` exists
- [ ] 5 agents are available (or persons assigned as generic agents)
- [ ] All agents have read `/squad/profiles/generics.md`
- [ ] All agents have read `/tasks/*.md` (task definitions)
- [ ] `/rubric/rubric.md` is reviewed (everyone understands scoring)
- [ ] This run plan is reviewed
- [ ] Stopwatch or timer is ready
- [ ] `/runs/generics/` directory exists (for logs)

---

## Step 1: Setup (0–15 min)

### Initial Setup (Any Agent)
```bash
cd /app
npm install
npm test
npm start  # Start server, test manually, Ctrl+C to stop
```

Record in `/runs/generics/log-phase-1.md`:
- Baseline test count and coverage (e.g., "5 tests, 60% coverage")
- Start timestamp (e.g., "2026-02-13 09:00 UTC")

### All Agents
- Read this entire document
- Open `/tasks/01-*.md` through `/tasks/05-*.md`
- Confirm understanding of all 5 task acceptance criteria

---

## Step 2: Work Board Setup (15–30 min)

Create a shared "work board" (can be a text file, GitHub issues, or just verbal):

```
[AVAILABLE] Task 01: Filtering
[AVAILABLE] Task 02: Priorities
[AVAILABLE] Task 03: Bulk Operations
[AVAILABLE] Task 04: Task History
[AVAILABLE] Task 05: Export/Import
```

**Each agent:**
- Pick a task from the available list
- Post a comment or write to the log: "I'm starting Task 02"
- Open a feature branch: `git checkout -b feature/task-0X-{name}`
- Communicate via decision log or PR if coordination is needed

---

## Step 3: Parallel Development (30 min – 3:30 hours)

### Agent Freedom

**Each agent is responsible for their claimed task, end-to-end:**
- API routes (GET, POST, PATCH, DELETE)
- Database schema/migrations
- Tests for the feature
- Documentation for the feature

**Expected work patterns:**
- Agent A focuses entirely on Task 01 (api + persistence + tests + docs)
- Agent B starts Task 02, then helps Agent C with Task 04
- Agent C finishes Task 04 with Agent B's help
- Agents D and E pair on Task 03 (collaborative coding)
- If conflicts arise, agents resolve via PR discussion

### Integration Checkpoints

**At 3:30 mark:**
```bash
npm test  # Must pass (or agents fix failures)
npm start  # Server starts cleanly
git --no-pager status  # Check for uncommitted changes (should be clean)
```

Record results in log.

### If Stuck

- Agent posts blocker in decision log (with timestamp)
- Other agents may offer help (or may not; it's optional)
- Agent can pivot to a different task or wait for unblock

---

## Step 4: PR Submission & Review (3:30–4:00 hours)

Each agent who has completed code:

1. **Commit and push:**
   ```bash
   git add .
   git commit -m "feat(task-0X): [description]"
   git push origin feature/task-0X-{name}
   ```

2. **Open PR** with task reference and description

3. **Peer review:**
   - Any agent can review any PR
   - Check if tests pass locally, code is readable, acceptance criteria met
   - Approve or request changes
   - If major issues: rewrite the PR instead of requesting revisions

4. **Merge:** Author merges once satisfied (no process gating; trust is peer-based)

### Conflict Handling During Merge
If merge conflicts appear:
- Affected agents resolve collaboratively (may re-run tests)
- Document resolution in decision log
- One agent handles the resolution; others continue work

Record in log: `PRs merged: [list], Merge conflicts: [count]`

---

## Step 5: Phase 1 Closure (4:00 hours)

Update `/runs/generics/log-phase-1.md`:
- End time
- Total elapsed: 4 hours (or actual)
- Test coverage (expect: 65–80%)
- Merge conflicts encountered: ___
- Tasks completed: ___ / 5

---

## Step 6: Phase 2 (Hours 4–8) — If Needed

If not all tasks are complete:

1. **Agent autonomy:** Agents pick remaining or unfinished tasks
2. **No reprioritization:** Agents decide what matters (may differ)
3. **Continue work:** Repeat Step 3 for remaining tasks

Update `/runs/generics/log-phase-2.md` with same metrics.

---

## Step 7: QA & Bug Bash (Hours 8–10)

### Full Test Suite
```bash
npm test
```
Record: pass/fail count, coverage %. If failures, agents debug and fix.

### Manual Bug Bash
Use `/runs/generics/bug-bash.md` template. Any agent can do this:

1. **Test each task's acceptance criteria:**
   - Task 01: Filtering works correctly?
   - Task 02: Priority field + sorting works?
   - Task 03: Bulk operations atomic?
   - Task 04: Audit log complete?
   - Task 05: Export/import idempotent?

2. **Test cross-task interactions:**
   - Does filtering work with priorities?
   - Do bulk ops update the audit log correctly?
   - Can exported data be imported back?

3. **Log bugs found:**
   ```
   Bug: [description]
   Severity: Minor / Major
   Reproduction: [steps]
   Fixed: Yes / No
   ```

### Bug Triage
- Major bugs: Fix immediately (create fix branch, PR, merge)
- Minor bugs: Log for deferral or quick fix

---

## Step 8: Final Metrics & Closure (Hours 10–12)

### Any Agent: Record Final Metrics
- **Total elapsed time:** ___ hours (from start to finish)
- **Final test count:** ___ (all should pass)
- **Final coverage:** __% (expect: 70–85%)
- **Tasks completed:** ___ / 5
- **Merge conflicts:** ___ (expect: 3–8)
- **Bugs found:** ___ (expect: 5–15)
- **Rework incidents:** ___ (commits reverted, code rewritten)

### Documentation Review
- Check if all endpoints are documented (may be incomplete)
- Check for inconsistencies in documentation
- Fill in critical gaps (optional; lower priority)

### Archive Logs
Copy logs to `/runs/generics/`:
- `log-phase-1.md` (or log-phase-2.md if Phase 2 occurred)
- `decisions.md` (final decision log — may be sparse)
- `bug-bash.md` (final bug log)

### Final Check
```bash
git --no-pager log --oneline main | head -20  # Verify PRs merged
npm test  # Final test run passes (or identify what failed)
npm start  # Server starts, Ctrl+C to stop
```

---

## Success Criteria

At the end of the run:
- [ ] All 5 tasks complete (or attempt made)
- [ ] `npm test` passes
- [ ] Coverage ≥70%
- [ ] All major bugs fixed
- [ ] Endpoints documented (even if inconsistently)
- [ ] Decision log complete (even if sparse)
- [ ] Elapsed time logged
- [ ] Zero direct commits to main

---

## Expected Differences from Specialists

Likely outcomes (vs. specialists run):
- **Longer cycle time** (merge conflicts, rework)
- **More bugs** (less coordinated design, gaps in testing)
- **Inconsistent documentation** (each agent documents differently)
- **More thrash** (reverted commits, schema changes)
- **Less clarity** (decisions made unilaterally, not logged)

---

## Troubleshooting

### Tests fail after merge
- Check if test code was included in PR
- Run tests locally with same Node version
- If merge conflict in test file, resolve and re-run
- Agent who caused failure fixes it

### Merge conflict on main
- Resolve in feature branch (don't commit directly to main)
- Verify tests pass after resolution
- Re-submit PR

### Two agents start the same task
1. First to push wins the branch name
2. Second agent either:
   - Contributes to the same branch (collaborate)
   - Opens a separate branch and merges both
   - Switches to a different task

### API design conflict (two agents make incompatible choices)
- Discovered in PR review
- Discussed in PR comments
- Resolution: merge first one, second agent adapts (or vice versa)
- Logged in decision log

### Time pressure at 4-hour mark
- Agents assess completion status
- Continue into Phase 2, or wrap up what's done
- Log deferred work in decision log

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-02-13 | Saul | Initial execution guide |
