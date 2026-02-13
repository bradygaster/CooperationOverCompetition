# Experiment Execution Plan

**By:** Rusty
**Date:** 2026-02-13
**Requested by:** bradygaster

---

## Context

Brady wants the full experiment executed — both runs (specialists and generics), all 5 tasks, scored at the end. We're AI agents in a single repo. We can't literally run two separate teams in parallel — we need to sequence and isolate.

---

## Decision 1: Run Order — Specialists First

**What:** Run specialists first, then generics.

**Why:**
- Specialists run has more process overhead (Coordinator, role assignments, escalation). If something is broken in the baseline app, we find out during the more structured run — easier to diagnose.
- The generics run is simpler to spawn (5 identical agents, no role boundaries). Running it second means the coordinator has already worked through any environmental kinks.
- We MUST isolate via git branches (see Decision 2), so the generics run starts from the same baseline commit — no contamination.

---

## Decision 2: Isolation Strategy — Git Branches

**What:** Use git branches. Specialists work on `run/specialists`, generics work on `run/generics`. Both branch from the current `main` commit (`d2190f6`).

**Why:**
- Cleanest isolation. Both teams start from identical code.
- We preserve full git history for both runs (commit timestamps, merge conflicts, reverts — all measurable).
- No file copying, no stash management, no risk of cross-contamination.
- Scoring can diff each branch against baseline to measure exactly what changed.

**Mechanics:**
1. Before specialists run: `git checkout -b run/specialists main`
2. All specialist work happens on this branch (feature branches merge into `run/specialists`, not `main`)
3. After specialists complete: switch back to main
4. Before generics run: `git checkout -b run/generics main`
5. All generic work happens on this branch (feature branches merge into `run/generics`, not `main`)
6. Scoring compares both branches against `main` baseline

**Important:** Feature branches within each run merge into the run branch, NOT into `main`. Main stays pristine as the baseline.

---

## Decision 3: Task Order — Same Order (01 → 05) for Both Runs

**What:** Both teams attempt tasks in order: 01, 02, 03, 04, 05.

**Why:**
- The rubric explicitly says "both teams should attempt tasks in the same order."
- Order 01–05 is intentional: Tasks 01–03 are progressively more complex. Task 04 (history/audit) is the coupling pin that touches everything. Task 05 (export/import) depends on having data to export.
- Same order eliminates task-ordering as a confound variable.

**Caveat for specialists:** The Coordinator may assign tasks to different specialists in parallel (e.g., Data/Persistence starts on Task 02 schema while API/Services works on Task 01 routes). That's fine — parallel execution within the same ordering is expected. The key constraint is: don't start Task 05 before Task 01 is done, don't start Task 04 before Tasks 01–03 are at least in progress.

**Caveat for generics:** Agents pick tasks first-come-first-served. If Agent A grabs Task 03 before Task 01 is done, that's a natural outcome of no coordination — and it's exactly what we're measuring.

---

## Decision 4: Simulating the Generic Team — 5 Identical Agents with Generic Charter

**What:** Spawn 5 agents with the identical generic charter from `/squad/profiles/generics.md`. Do NOT reuse our specialist squad with loosened boundaries.

**Why:**
- Reusing specialists with "no boundaries" is not a fair simulation — they still carry specialist knowledge and habits from their charters.
- The generics profile is already written and defines the right behavior: full codebase ownership, first-come-first-served, no escalation, peer-to-peer conflict resolution.
- 5 agents (not 6) matches the generics design: specialists have 6 (including non-coding Coordinator), generics have 5 (no Coordinator role).

**How:** Each generic agent spawn gets:
- The generic charter from `/squad/profiles/generics.md`
- The shared rules from `/squad/rules.md`
- The task list (`/tasks/01-05`)
- The run plan from `/runs/generics/run-plan.md`
- Access to the `run/generics` branch

---

## Decision 5: Scoring Approach — Evidence Collection During Runs, Scored After Both Complete

**What:** Collect evidence artifacts during each run. Score after both runs complete. Use one scoring agent (or Rusty) to evaluate both runs against the same rubric.

**Evidence to collect per run:**

| Metric | How to Measure |
|--------|---------------|
| **Cycle Time** | Count total agent spawns/iterations to complete all 5 tasks. Also: git timestamps from first commit to last merge on the run branch. |
| **Quality** | `npm test` output: pass count, fail count. Test coverage %. Acceptance criteria checklist (done/incomplete per task). |
| **Clarity** | Completeness of `/app/README.md` API docs. Decision log entry count and quality. Code comment quality (spot check). |
| **Waste** | Git log: count merge conflicts, reverted commits, abandoned branches. Count of rework (same file edited by multiple agents for the same purpose). |
| **User-Value** | Task completion count (X/5). Feature completeness vs. acceptance criteria. Any scope creep or missed requirements. |

**Scoring mechanics:**
1. After both runs complete, checkout `run/specialists` → run `npm test`, inspect code, count artifacts
2. Checkout `run/generics` → same evaluation
3. Score each dimension 0–5 per the rubric in `/rubric/rubric.md`
4. Calculate weighted final score: `(CycleTime × 0.2) + (Quality × 0.3) + (Clarity × 0.2) + (Waste × 0.15) + (UserValue × 0.15)`
5. Write results to `/runs/scoring.md`

**Cycle time for AI agents:** The rubric's hour-based scale doesn't map directly. For us, cycle time = number of agent spawns × complexity. We'll record wall-clock time AND spawn count, then normalize for scoring.

---

## Decision 6: Practical Execution — AI Agent Spawn Sequence

Since we're AI agents running sequentially in a CLI, here's the concrete step list the coordinator follows:

### SPECIALISTS RUN (Steps 1–12)

```
Step 1:  SETUP — Create branch `run/specialists` from main
         git checkout -b run/specialists main
         cd app && npm install && npm test (record baseline)
         Create /runs/specialists/log.md, decisions.md, bug-bash.md

Step 2:  SPAWN Coordinator agent
         - Reads specialist profiles, task definitions, run plan
         - Assigns tasks to specialist roles
         - Creates feature branches off run/specialists

Step 3:  SPAWN Data/Persistence agent — Task 01 (filter queries) + Task 02 (priority schema)
         - Implements model-layer filtering logic
         - Adds priority column migration
         - Works on run/specialists branch

Step 4:  SPAWN API/Services agent — Task 01 (filter routes) + Task 02 (priority routes)
         - Implements GET /tasks filtering
         - Implements priority in POST/PATCH/GET
         - Works on run/specialists branch

Step 5:  SPAWN Data/Persistence agent — Task 03 (bulk transactions) + Task 04 (audit schema)
         - Implements bulk update/delete model methods
         - Creates audit_log table and logging triggers
         - Works on run/specialists branch

Step 6:  SPAWN API/Services agent — Task 03 (bulk routes) + Task 05 (export/import routes)
         - Implements PATCH/DELETE /tasks/bulk
         - Implements GET /tasks/export, POST /tasks/import
         - Works on run/specialists branch

Step 7:  SPAWN CLI UX agent — All CLI updates
         - Updates taskboard.js for filtering, priorities, bulk, history, export/import
         - Works on run/specialists branch

Step 8:  SPAWN QA/Test agent — All tests
         - Writes integration + unit tests for all 5 tasks
         - Targets ≥85% coverage
         - Works on run/specialists branch

Step 9:  SPAWN Docs/Release agent — All documentation
         - Updates /app/README.md with all endpoints
         - Reviews and merges PRs
         - Fills in decision log
         - Works on run/specialists branch

Step 10: SPAWN QA/Test agent — Bug bash
         - Runs full test suite
         - Manual testing of all features
         - Logs bugs in bug-bash.md
         - Works on run/specialists branch

Step 11: FIX any bugs found in Step 10 (spawn relevant specialist)

Step 12: RECORD final metrics for specialists run
         - npm test output, coverage, task completion
         - Git log analysis (commits, conflicts, reverts)
         - Save to /runs/specialists/final-metrics.md
```

### GENERICS RUN (Steps 13–22)

```
Step 13: SETUP — Create branch `run/generics` from main
         git checkout -b run/generics main
         cd app && npm install && npm test (record baseline)
         Create /runs/generics/log.md, decisions.md, bug-bash.md

Step 14: SPAWN Generic Agent 1 — Task 01 (Filtering, end-to-end)
         - Implements API routes, model queries, tests, docs for filtering
         - Works on run/generics branch

Step 15: SPAWN Generic Agent 2 — Task 02 (Priorities, end-to-end)
         - Implements schema, routes, model, tests, docs for priorities
         - Works on run/generics branch

Step 16: SPAWN Generic Agent 3 — Task 03 (Bulk Operations, end-to-end)
         - Implements bulk endpoints, transactions, tests, docs
         - Works on run/generics branch

Step 17: SPAWN Generic Agent 4 — Task 04 (History/Audit, end-to-end)
         - Implements audit_log, history endpoint, tests, docs
         - Works on run/generics branch

Step 18: SPAWN Generic Agent 5 — Task 05 (Export/Import, end-to-end)
         - Implements export/import endpoints, tests, docs
         - Works on run/generics branch

Step 19: INTEGRATION — Merge all generic feature branches into run/generics
         - Resolve merge conflicts (record count and time spent)
         - Run npm test, fix failures

Step 20: SPAWN Generic Agent (any) — Bug bash
         - Full test suite + manual testing
         - Log bugs in bug-bash.md

Step 21: FIX any bugs found in Step 20 (spawn generic agent)

Step 22: RECORD final metrics for generics run
         - npm test output, coverage, task completion
         - Git log analysis (commits, conflicts, reverts)
         - Save to /runs/generics/final-metrics.md
```

### SCORING (Steps 23–24)

```
Step 23: SCORE both runs
         - Checkout run/specialists: evaluate all 5 dimensions
         - Checkout run/generics: evaluate all 5 dimensions
         - Calculate weighted scores
         - Write comparison to /runs/scoring.md

Step 24: REPORT results to bradygaster
         - Side-by-side comparison
         - Qualitative analysis of Conway's Law effects
         - Confounds and caveats noted
```

---

## Key Constraints & Guardrails

1. **No cross-contamination:** Feature branches within a run merge into the run branch only. Main stays untouched.
2. **Same baseline:** Both runs start from commit `d2190f6` (current main HEAD).
3. **Same task order:** 01 → 05 for both runs.
4. **Evidence over opinion:** Every score must cite specific evidence (test output, git log, file contents).
5. **Honest comparison:** If one run has an unfair advantage (e.g., we learn from specialists' mistakes when running generics), note it as a confound.
6. **Sequential specialists, sequential generics:** Within each run, agents are spawned sequentially (we can't run true parallel agents). This is a known limitation — we note it but don't let it block the experiment.

---

## What I'm NOT Deciding

- **Which specific agents play which roles:** The Coordinator decides this at spawn time.
- **Exact test strategy:** QA/Test specialist (or generic agent) decides.
- **API design details:** API/Services specialist (or generic agent) decides.
- **Whether to skip phases:** We attempt all 4 phases (sprint, sprint 2 if needed, QA, closure). If all tasks complete in one sprint, we skip to QA.

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-02-13 | Rusty | Initial experiment execution plan |
