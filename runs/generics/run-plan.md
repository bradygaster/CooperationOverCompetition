# Run Plan: Generics Mode

## Overview

This plan describes how to execute the Conway's Law experiment using a **Generic Team** structure. Generics are identical agents with no ownership boundaries, no predefined roles, and no explicit responsibilities. They compete for work on a first-come-first-served basis.

**Start Point:** Fresh clone of main branch at `/app`
**Duration:** Target 8–12 hours (two 4–6 hour sprints with a QA phase)
**Team Size:** 5 generic agents (all interchangeable)

---

## Pre-Run Setup

### 1. Team Structure (5 min)

Assign 5 agents to generic roles. Each agent has **identical charter**:
- Own the entire codebase (no boundaries)
- Claim work by opening an issue or branch
- No escalation protocol (conflict resolution is peer-to-peer)
- Expected to do API, database, tests, docs, and CLI work

All agents read `/squad/profiles/generics.md` to understand the team structure.

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

All agents confirm understanding of task scope and acceptance criteria.

---

## Phase 1: Sprint (Hours 0–4)

### Setup (0–15 min)

1. Create main tracking document: `/runs/generics/log-phase-1.md`
2. Create `decisions.md` for logging choices
3. Create `bug-bash.md` for QA findings
4. **No task assignment.** Instead, create a "work board":
   ```
   Task 01: Filtering — [AVAILABLE]
   Task 02: Priorities — [AVAILABLE]
   Task 03: Bulk Ops — [AVAILABLE]
   Task 04: History — [AVAILABLE]
   Task 05: Export/Import — [AVAILABLE]
   ```

5. Open feature branches (first agent to start a task creates the branch):
   ```bash
   git checkout -b feature/task-01-filtering
   # (other branches created as needed)
   ```

### Development (15 min – 3:30 hours)

**No assigned specialties.** Each agent:
- Picks a task from the available list
- Opens a feature branch (`feature/task-0X-{name}`)
- Implements API, database, tests, and docs for that task
- Or helps another agent if that task is partially done
- Or jumps to a different task if blocked

**Expected patterns:**
- Some agents will focus on one task (e.g., Agent A does Task 01 end-to-end)
- Some agents will flit between tasks (e.g., Agent B starts Task 02, helps on Task 03, finishes Task 02)
- Some agents may work on the same task in parallel (both writing code on Task 04)
- Merge conflicts are more likely due to overlapping edits

### Integration Checkpoints (3:30 mark)

At 3 hours 30 minutes:
1. Run `npm test` — all tests must pass
2. Check for merge conflicts (will likely be more than specialists mode)
3. Verify all new endpoints are documented (may be incomplete or inconsistent)

### Decision-Making

With no designated roles:
- **API design choices** are made by whoever is writing the route (and communicated via PR or decision log)
- **Database design choices** are made by whoever is working on the schema (may conflict with other agents' assumptions)
- **Test strategy** is decided per-agent (may result in inconsistent coverage or patterns)
- **Documentation** is updated inconsistently (some agents are thorough; some skip it)

**Conflict resolution:** Agents resolve via pull request review, discussion, or rewriting the other's code.

### Escalation Triggers

With no Coordinator:
- **Merge conflict?** → Affected agents resolve collaboratively (may take longer)
- **Schema incompatibility?** → Whoever merged last wins; next agent adapts
- **API design conflict?** → PRs get rejected and rewritten; rework happens

---

## Phase 1 Wrap-Up (3:45–4:00 hours)

### Create PR for each completed task
- Branch: `feature/task-0X-{name}`
- Title: `feat: Task 0X — {name}`
- Description: Task definition link + acceptance criteria met (or not)
- Assigned to: Anyone available to review (no designated Docs specialist)

### Review & Merge
- Agents review each other's PRs (peer review, no hierarchy)
- Merge conflicts: Agents resolve and re-test
- May result in back-and-forth or partial merges

### Log Phase 1 Metrics
Update `/runs/generics/log-phase-1.md`:
- End timestamp
- PRs created and merged (may be messy)
- Test count & coverage (may be incomplete)
- Merge conflicts resolved
- Blockers encountered

---

## Phase 2: Sprint (Hours 4–8)

If not all tasks are complete, continue with remaining work:

### Agent Autonomy
- Agents pick remaining tasks or continue unfinished work
- No reprioritization (agents decide for themselves)
- Possible: Agent A finishes Task 01, Agent B finishes Task 02 while Agent C rewrites Task 03

### Integration Checkpoints (at 1.5 and 3 hours)
- Run `npm test`
- Log any failures
- Agents fix issues independently

### End-of-Phase 2
- PRs merged (some may still be in review)
- `npm test` may pass (or may have unresolved failures)
- Task completion varies (some tasks half-done)

---

## Phase 3: QA & Bug Bash (Hours 8–10)

### Full Test Suite Run
```bash
npm test
```
Record: Pass count, coverage %, any failures.

### Manual Bug Bash
Use `/runs/generics/bug-bash.md` template. Agents (in rotation) test:

1. **Task 01–05 features** (same as specialists run)

2. **Cross-task interactions:**
   - Does filtering work after priority updates?
   - Does export include all priority levels?
   - Can bulk operations be reversed by history?

3. **Inconsistencies:**
   - Do all endpoints use the same error format?
   - Is documentation consistent across endpoints?
   - Are tests structured the same way?

**Expected:** More bugs due to less coordination during development.

### Bug Triage
- Critical bugs: Fix immediately
- Minor/inconsistency bugs: Log for deferral or quick fix

---

## Phase 4: Closure (Hours 10–12)

### Final Metrics
1. Record total elapsed time
2. Tally final test count and coverage
3. List all bugs found and fixed/deferred
4. List all merge conflicts and how they were resolved

### Documentation Pass
- Review README for consistency
- Fill in any missing endpoint docs
- Clean up decision log (may be sparse)

### Archive Logs
Move to:
- `/runs/generics/log-phase-1.md`
- `/runs/generics/log-phase-2.md` (if Phase 2 occurred)
- `/runs/generics/decisions.md`
- `/runs/generics/bug-bash.md`

---

## Expected Outcomes (Different from Specialists)

Due to lack of coordination:
- **More merge conflicts** (agents edit overlapping files without coordination)
- **More rework** (conflicting design choices that require backing out)
- **Slower cycle time** (conflict resolution, re-testing, rewrites)
- **Lower quality** (more bugs found in QA due to less design thinking upfront)
- **Inconsistent documentation** (each agent documents their own task differently)
- **More thrash** (reverted commits, abandoned branches, rework)

---

## Success Criteria

By end of Phase 4:
- [ ] All 5 tasks complete (target: ideally yes, but some may be incomplete)
- [ ] `npm test` passes (if not, time spent debugging)
- [ ] Coverage ≥75% (may be lower due to coordination gaps)
- [ ] Bug count logged (expect higher than specialists)
- [ ] All endpoints documented (may be inconsistent)
- [ ] Decision log complete (may be sparse)
- [ ] Elapsed time logged (expect longer than specialists)
- [ ] Zero direct commits to main (all work via PRs)

---

## Notes on Fair Comparison

To keep the comparison fair:
1. Generics and Specialists start from identical `/app` skeleton.
2. Both teams get identical task definitions.
3. Both teams get identical time budget (8–12 hours).
4. Scoring uses the same rubric (cycle time, quality, clarity, waste, user-value).
5. Confounds are logged (e.g., if an agent is faster/slower, note it).

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-02-13 | Saul | Initial run plan |
