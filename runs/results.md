# Conway's Law Experiment — Results

## Overview

Two AI agent teams implemented the same 5 tasks on a Task Board API, starting from the same baseline (29 passing tests, Express + SQLite CRUD app). The experiment tests whether team structure (specialist roles vs. generic/interchangeable agents) affects software architecture and delivery quality.

- **Specialist Run:** 6 roles (Lead, Backend Dev, Frontend/CLI Dev, Tester, Docs/Release) with clear ownership boundaries and escalation protocols.
- **Generic Run:** 5 identical agents with no ownership, no boundaries, first-come-first-served.

Both runs executed tasks 01–05 in the same order from the same `main` baseline commit (`638e0eb`).

---

## Task Completion Summary

| Task | Specialist | Generic |
|------|-----------|---------|
| 01 – Filtering (status + search) | ✅ Complete | ✅ Complete |
| 02 – Priorities (schema + sort) | ✅ Complete | ✅ Complete |
| 03 – Bulk Operations (transactions) | ✅ Complete | ✅ Complete |
| 04 – Audit History (append-only log) | ✅ Complete | ✅ Complete |
| 05 – Export/Import (JSON + validation) | ✅ Complete | ✅ Complete |

Both teams completed all 5 tasks. **User-Value: 5/5 for both.**

---

## Metrics Comparison

| Metric | Specialist | Generic |
|--------|-----------|---------|
| Final test count | 102 | 108 |
| Tests all passing | ✅ Yes | ✅ Yes |
| Commits | 5 (linear) | 5 (linear) |
| Merge conflicts | 0 | 0 |
| Reverted commits | 0 | 0 |
| Source files changed | 7 | 9 |
| Lines added | 1,345 | 1,600 |
| Model file (task.js) lines | 240 | 298 (+24 in auditLog.js = 322 total) |
| Routes file lines | 149 | 144 |
| Migration file lines | 31 | 59 |
| Test file organization | 3 files | 5 files |
| Separate audit model | No (inline) | Yes (auditLog.js) |

---

## Scoring (Rubric: 0–5 per dimension)

### 1. Cycle Time (Weight: 20%)

Both teams completed all 5 tasks in a single sequential pass with no stalls, blockers, or rework iterations.

| | Specialist | Generic |
|---|-----------|---------|
| Score | **5** | **5** |
| Evidence | 5 clean commits, no rework | 5 clean commits, no rework |

### 2. Quality (Weight: 30%)

Both teams produced working, tested code with all acceptance criteria met.

| | Specialist | Generic |
|---|-----------|---------|
| Score | **5** | **5** |
| Tests passing | 102/102 | 108/108 |
| Acceptance criteria met | 100% | 100% |
| Bugs found in QA | 0 | 0 |

The generic run wrote 6 more tests (108 vs 102), but both achieved full coverage of requirements.

### 3. Clarity (Weight: 20%)

| | Specialist | Generic |
|---|-----------|---------|
| Score | **4** | **3** |
| Code organization | Consolidated — audit logic inline in task.js | Fragmented — separate auditLog.js, 3 extra test files |
| Migration approach | Clean single-file evolution | 59-line migrate.js with more complex ALTER TABLE handling |
| Decision traceability | Specialist roles provide implicit decisions | No ownership → decisions undocumented |
| Consistency | Consistent style (single backend dev) | Slight style variation across agents |

**Key observation:** The specialist run kept audit logic integrated with the task model, making the data flow clear. The generic run created a separate `auditLog.js` model — a reasonable choice, but it splits related logic across files and creates coupling that's harder to trace.

### 4. Waste / Thrash (Weight: 15%)

| | Specialist | Generic |
|---|-----------|---------|
| Score | **5** | **4** |
| Merge conflicts | 0 | 0 |
| Reverted commits | 0 | 0 |
| Lines of code | 1,345 | 1,600 (+19% more code) |
| Extra files | 0 | 2 (auditLog.js, bulk.test.js, history.test.js) |
| Rework | None | None |

The generic run produced 255 more lines of code and 2 extra source files for equivalent functionality. The extra code isn't "wrong" — it's structural overhead from agents making independent architectural decisions without a shared vision. In a longer project, this fragmentation compounds.

### 5. User-Value Alignment (Weight: 15%)

| | Specialist | Generic |
|---|-----------|---------|
| Score | **5** | **5** |
| Tasks completed | 5/5 | 5/5 |
| Scope creep | None | None |
| Feature completeness | Full | Full |

---

## Final Weighted Scores

```
Formula: (CycleTime × 0.2) + (Quality × 0.3) + (Clarity × 0.2) + (Waste × 0.15) + (UserValue × 0.15)
```

### Specialist Run
```
(5 × 0.2) + (5 × 0.3) + (4 × 0.2) + (5 × 0.15) + (5 × 0.15)
= 1.0 + 1.5 + 0.8 + 0.75 + 0.75
= 4.80 / 5.00
```

### Generic Run
```
(5 × 0.2) + (5 × 0.3) + (3 × 0.2) + (4 × 0.15) + (5 × 0.15)
= 1.0 + 1.5 + 0.6 + 0.6 + 0.75
= 4.45 / 5.00
```

| | Specialist | Generic |
|---|-----------|---------|
| **Final Score** | **4.80** | **4.45** |
| Rating | Excellent | Good |

---

## Conway's Law Analysis

> "Any organization that designs a system will produce a design whose structure is a copy of the organization's communication structure." — Melvin Conway, 1967

### Findings

**1. Architecture mirrors team structure — even with AI agents.**

The specialist team had one backend developer (Basher) who owned the model layer. All 5 tasks' model changes went through the same "mind," producing a consolidated, consistent `task.js` (240 lines) with audit logging integrated inline. The architecture is monolithic-coherent — everything task-related lives in one module.

The generic team had 5 different agents touching the model layer. Agent 4 created a separate `auditLog.js` module — a natural choice when you don't "own" the task model and want to minimize your footprint in someone else's code. This is Conway's Law in action: the boundary between Agent 3 (bulk ops) and Agent 4 (audit) manifested as a module boundary in the code.

**2. Specialist ownership reduces code volume.**

The specialist run produced 1,345 lines vs. 1,600 for generics — 19% less code for equivalent functionality. The specialist's backend dev reused patterns across tasks (e.g., the same audit logging helper for single and bulk operations). Generic agents, lacking shared context, independently solved similar problems in slightly different ways.

**3. Test organization reflects team boundaries.**

Specialists wrote tests in 3 files (model, API, export-import). Generics wrote tests in 5 files (model, API, bulk, history, export-import). Each generic agent created their own test file for their task — a natural behavior when you don't own the existing test suite and don't want to risk breaking someone else's tests.

**4. Migration complexity diverged.**

The specialist's migration file grew cleanly from 14 to 31 lines. The generic team's grew to 59 lines because different agents handled the ALTER TABLE pattern differently — Agent 2 and Agent 4 each added their own migration strategy without coordinating on a shared approach.

**5. In short sprints, the gap is small. Over time, it compounds.**

For 5 tasks, the difference is modest (4.80 vs 4.45). Both teams delivered working software. But the generics run shows early signs of architectural entropy: more files, more code, inconsistent patterns. In a real project with 50+ tasks, these micro-divergences compound into the kind of "big ball of mud" that Conway's Law predicts for unstructured teams.

---

## Limitations & Caveats

1. **Sequential execution, not parallel.** Both runs executed tasks one-at-a-time. Real teams work in parallel, where merge conflicts and coordination costs would be much higher for generics.

2. **AI agents vs. humans.** AI agents have perfect memory within a session and don't get tired. Human generic teams would likely show more waste (forgotten context, miscommunication).

3. **Same orchestrator.** Both runs were orchestrated by the same coordinator (me), which provides implicit structure even in the generic run. A truly uncoordinated generic team might produce worse results.

4. **Short experiment.** 5 tasks is enough to show trends but not enough to see the full compounding effect of architectural divergence.

5. **No true parallelism.** The biggest Conway's Law effects emerge when multiple agents edit the same files simultaneously. Our sequential execution avoided merge conflicts entirely, which would have been the generic team's biggest cost.

---

## Conclusion

**Specialists win, but the margin is small for short sprints.** The specialist team produced cleaner, more consolidated architecture with 19% less code. Conway's Law manifested clearly: team boundaries became module boundaries in the generic run's code.

The experiment suggests that for AI agent teams:
- **Specialist ownership** produces more coherent architecture
- **Generic agents** produce more modular-but-fragmented code
- The real cost of generic teams is **long-term maintenance**, not initial delivery
- Conway's Law applies to AI teams just as it does to human teams

**Final Scores: Specialists 4.80 / Generics 4.45**

---

## Evidence Artifacts

| Artifact | Location |
|----------|----------|
| Specialist branch | `run/specialists` (5 commits from `638e0eb`) |
| Generic branch | `run/generics` (5 commits from `638e0eb`) |
| Baseline commit | `638e0eb` on `main` |
| Task definitions | `tasks/01-*.md` through `tasks/05-*.md` |
| Scoring rubric | `rubric/rubric.md` |
| Team profiles | `squad/profiles/specialists.md`, `squad/profiles/generics.md` |
| Experiment design | `docs/experiment.md` |

---

*Experiment executed and scored on 2025-07-18.*
*Evaluator: Copilot CLI (orchestrating Squad agents)*
