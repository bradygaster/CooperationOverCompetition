# Evaluation Rubric for Conway's Law Experiment

## Overview

This rubric measures team performance on the same set of tasks under two different organizational structures: **Specialists** (clear ownership, defined boundaries) vs. **Generics** (identical agents, no ownership).

The rubric scores five dimensions, each on a **0–5 scale**. Final score is a weighted average across all dimensions.

---

## Scoring Dimensions

### 1. Cycle Time
**Measures:** Speed of delivery. How long from task assignment to production-ready code.

**Scale:**
- **5:** All tasks complete in < 4 hours elapsed time (including PR review and testing)
- **4:** All tasks complete in 4–6 hours elapsed time
- **3:** All tasks complete in 6–10 hours elapsed time
- **2:** Some tasks complete in 10–15 hours; one or more stalled
- **1:** One or more tasks exceed 15 hours; significant delays or blockers
- **0:** Tasks incomplete or abandoned after > 20 hours

**Evidence:**
- Git commit timestamps and PR merge dates
- Timestamps in decision logs
- Test execution logs showing final pass times

---

### 2. Quality
**Measures:** Code correctness, test coverage, and adherence to acceptance criteria.

**Scale:**
- **5:** All acceptance criteria met, all tests pass (≥90% code coverage), no bugs found in QA
- **4:** All acceptance criteria met, all tests pass (≥75% code coverage), 1 minor bug found and fixed in QA
- **3:** 85% of acceptance criteria met, tests pass (≥70% code coverage), 2–3 minor bugs found in QA
- **2:** 70% of acceptance criteria met, tests pass (≥60% code coverage), 4+ minor bugs or 1 major bug
- **1:** <70% of acceptance criteria met, tests incomplete, major bugs unfixed
- **0:** Code does not run or fails all tests

**Evidence:**
- Test execution output (pass/fail/coverage %)
- QA bug bash log (bugs discovered, severity, resolution)
- Code review comments (in PRs)
- Acceptance criteria checklist from task (done/incomplete)

---

### 3. Clarity
**Measures:** Code understandability, documentation quality, and decision traceability.

**Scale:**
- **5:** Code is self-documenting, comprehensive API docs, decision log is clear and complete
- **4:** Code is readable with minor comments, good API docs, decision log covers key choices
- **3:** Code is readable with some comment gaps, basic API docs, decision log covers major decisions
- **2:** Code requires clarification, sparse API docs, decision log is incomplete
- **1:** Code is unclear despite comments, minimal documentation, decisions are not logged
- **0:** No documentation or decision log

**Evidence:**
- Code review readability feedback
- Completeness of `/app/README.md` (API documentation)
- Decision log file completeness (one entry per major decision)
- Comment coverage in complex logic

---

### 4. Waste / Thrash
**Measures:** Efficiency and organization. Low waste = minimal merge conflicts, rework, and context switching.

**Scale:**
- **5:** 0 merge conflicts, 0 reverted commits, linear PR sequence
- **4:** ≤1 merge conflict (resolved cleanly), 0 reverted commits, mostly linear
- **3:** 2–3 merge conflicts or 1 reverted commit, minor rework required
- **2:** 4–5 merge conflicts or 2–3 reverted commits, noticeable rework required
- **1:** 6+ merge conflicts or 4+ reverted commits, significant rework required
- **0:** Abandoned or unusable code state

**Evidence:**
- Git log: merge conflict history, revert history
- Git reflog or branch visualization
- PR review notes indicating rework requests
- Branch naming convention adherence (all work on feature branches, no direct main commits)

---

### 5. User-Value Alignment
**Measures:** Do the delivered features match user needs? Did the team make good prioritization choices?

**Scale:**
- **5:** All 5 tasks completed and fully functional, no scope creep, features align perfectly with task requirements
- **4:** All 5 tasks completed, 1 minor feature incomplete, slight scope creep
- **3:** 4 of 5 tasks complete, some minor incompleteness, moderate scope creep or deprioritization
- **2:** 3 of 5 tasks complete, significant features missing, team lost focus
- **1:** Fewer than 3 tasks complete, major scope misalignment
- **0:** No tasks complete

**Evidence:**
- Task completion checklist (done/incomplete per task)
- Decision log entries explaining scope changes or deprioritizations
- Comparison of delivered features to task acceptance criteria

---

## Scoring Method

### Per-Dimension Score
Each dimension is scored **0–5** by the evaluator, using the evidence above.

### Final Score
```
Final = (CycleTime × 0.2) + (Quality × 0.3) + (Clarity × 0.2) + (Waste × 0.15) + (UserValue × 0.15)
```

**Weights Rationale:**
- **Quality (30%):** Correctness and functionality is paramount. Broken code wastes time.
- **Cycle Time (20%):** Speed matters, but not at the cost of quality. Faster teams that build bad code don't win.
- **Clarity (20%):** Documentation and decision logs reduce future rework and onboarding time for the next task.
- **Waste (15%):** Merge conflicts and reverts are costly. Lower waste indicates better planning/coordination.
- **User Value (15%):** Did we build the right thing? Alignment with scope is a tiebreaker.

### Score Interpretation
- **4.5–5.0:** Excellent. Clean execution, high quality, minimal waste.
- **3.5–4.4:** Good. Met all requirements with minor issues.
- **2.5–3.4:** Acceptable. Core features work, some rough edges.
- **1.5–2.4:** Weak. Significant issues, rework required.
- **0–1.4:** Failed. Code incomplete or non-functional.

---

## Comparison Method

### Before Each Run
1. Record the team structure (Specialists or Generics).
2. Record start time and list of tasks assigned.
3. Confirm both teams receive identical task definitions and acceptance criteria.

### During Each Run
1. Maintain a daily log with timestamps.
2. Document decisions and blockers in the decision log.
3. Record PR merges, test results, and bugs found during QA.

### After Each Run (QA + Bug Bash)
1. Run all tests: `npm test` in `/app`.
2. Record coverage percentage and pass/fail count.
3. Execute bug bash checklist (manual testing of each feature).
4. Tally bugs: count severity (minor/major), document in QA log.
5. Timestamp the final passing build.

### Scoring
1. Collect evidence for each dimension (from logs, tests, PRs).
2. Score independently: one evaluator per dimension to avoid anchoring bias.
3. Discuss outliers; consensus on final score.
4. Calculate weighted final score.

### Comparison
1. Plot cycle time and final score for both teams side-by-side.
2. Analyze waste (merge conflicts, reverts) — did specialists avoid thrash?
3. Compare quality (bugs found in QA, test coverage) — did specialist ownership reduce bugs?
4. Compare clarity (decision logs, code review comments) — did specialists document better?
5. Compare user-value alignment — did either team over-engineer or cut corners?
6. Qualitative analysis: Did the team structure affect collaboration, bottlenecks, or knowledge sharing?

---

## Required Evidence Artifacts

All scoring depends on these files and logs:

### From `/runs/{specialists,generics}/`
- `log-phase-1.md`, `log-phase-2.md`, etc. — Daily execution logs with timestamps
- `decisions.md` — Decision log (one entry per significant choice)
- `bug-bash.md` — QA execution log (bugs discovered, severity, fixed/deferred)

### From `/app`
- `README.md` — API documentation (completeness score)
- Test output: `npm test` result (pass count, coverage %)
- Git log and PR history (merge conflicts, reverted commits)

### Metadata
- Task completion checklist (from each task definition)
- Start and end timestamps for the run
- Team composition (specialist roles or generic list)

---

## Notes on Fairness

### Fair Comparison Requires:
1. **Identical starting point:** Both teams work from the same `/app` skeleton.
2. **Identical tasks:** Same task definitions, same acceptance criteria, same order.
3. **Identical resources:** Same tools (Node, npm, git), same environment.
4. **Blind evaluation:** If possible, score runs without knowing which is specialist/generic until final comparison.

### Known Confounds to Control:
- Agent capability or experience (prefer agents from same pool, or document if different)
- Task order (both teams should attempt tasks in the same order, or randomize both)
- Interruptions or external blockers (log any and exclude from cycle time comparison)
- Explicit pauses for documentation (log separately; both teams must document equally)

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-02-13 | Saul | Initial rubric design |
