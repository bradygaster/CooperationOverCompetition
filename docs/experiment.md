# The Conway's Law Experiment

## Hypothesis

**Conway's Law states:** "Any organization that designs a system will produce a design whose structure is isomorphic to the structure of the organization which produced it."

**Our hypothesis:** A team with **clear specialist ownership** (well-defined roles and boundaries) will outperform a team of **generic, non-specialized agents** (identical charters, no ownership) on the same set of tasks, measured by:
1. **Cycle time** (time to complete all tasks)
2. **Quality** (test coverage, bugs found and fixed)
3. **Clarity** (code readability, documentation quality, decision traceability)
4. **Waste** (merge conflicts, reverted commits, rework)
5. **User-value alignment** (how well delivered features match requirements)

**Expected outcome:** Specialists will have **lower cycle time, higher quality, less waste, and better clarity** than Generics, due to better coordination and reduced context switching.

---

## Why These Tasks Create Coordination Pressure

The five tasks are deliberately designed to touch multiple layers of the application and create natural interdependencies:

### Task 01: Filtering
- **Touches:** API routes (request validation), persistence layer (query logic)
- **Coordination need:** API/Services and Data/Persistence must agree on filter parameters and SQL approach

### Task 02: Priorities
- **Touches:** API routes, persistence layer (schema migration), CLI client
- **Coordination need:** Schema change (migration) must happen before API or CLI work; sort logic must be consistent

### Task 03: Bulk Operations
- **Touches:** API routes, persistence layer (transaction handling), tests (edge cases)
- **Coordination need:** Transaction semantics must be clear; API validation must match persistence constraints

### Task 04: History
- **Touches:** Persistence layer (audit log schema), logging middleware, all other tasks (each must log)
- **Coordination need:** Highest interdependency; requires other specialists to integrate audit logging into their tasks

### Task 05: Export/Import
- **Touches:** API routes, persistence layer (data serialization), validation, documentation
- **Coordination need:** Must understand entire task schema; requires careful testing of edge cases

**Key insight:** Task 04 (History) creates strong coupling — every other task must log its mutations, forcing integration and coordination.

---

## How the Two Team Structures Differ

### Specialists Mode

**Structure:**
- 6 roles: Coordinator, API/Services, Data/Persistence, CLI UX, QA/Test, Docs/Release
- Clear ownership: Each specialist owns specific areas (routes, schema, tests, docs)
- Explicit boundaries: Specialists know what they own and what they don't

**Communication:**
- Formal: Task assignment by Coordinator
- Escalation: Documented blockers and decision log
- Coordination: Planned at sprint start; ad-hoc during sprint

**Expected behavior:**
- API/Services and Data/Persistence plan schema together before implementation
- History audit log design is agreed upon upfront
- QA/Test writes tests as code is developed (strong feedback loop)
- Docs/Release enforces quality gates (accepts PRs only if tests pass + docs updated)

**Risks:**
- Bottleneck: If one specialist is slow, others wait
- Over-coordination: Time spent in meetings could be used for coding
- Handoff friction: Passing work between specialists may lose context

### Generics Mode

**Structure:**
- 5 identical agents with no assigned roles
- All agents can work on any part of the codebase
- No explicit ownership or boundaries

**Communication:**
- Informal: Agents pick work asynchronously
- No escalation: Conflicts resolved peer-to-peer
- Coordination: Minimal; agents work independently

**Expected behavior:**
- Agent A starts Task 02 (priorities) and adds schema change without coordinating with others
- Agent B starts Task 04 (history) simultaneously, designs audit log independently
- Merge conflict: Both agents added columns to the tasks table; schema conflict arises
- Rework: One schema design is discarded; affected agents rewrite code
- History: Task 04's audit logging design clashes with Agent A's priority logging; refactored

**Risks:**
- Merge conflicts: Parallel edits to same files
- Duplicate work: Two agents solve the same problem independently
- Inconsistency: Different API design patterns, test strategies, documentation styles
- Discovery: Design conflicts found late (in PR review or QA)

---

## How We Measure & Compare

### Metrics Collected (Per Run)

**Cycle Time:**
- Start timestamp (when work begins)
- End timestamp (when final code is merged and tested)
- Elapsed time (difference)
- Per-task cycle time (time from task assignment to PR merge)

**Quality:**
- Test count: How many tests are written?
- Test coverage: % of code covered by tests (target: ≥85%)
- Bugs found: Count by severity (major, minor)
- Bugs fixed: Count before run closure
- Acceptance criteria: How many fully met per task?

**Clarity:**
- API documentation: Completeness of `/app/README.md`
- Decision log: Number of entries (target: ≥10), completeness
- Code review feedback: Readability issues flagged by reviewers
- Comment coverage: Logic that required clarification

**Waste:**
- Merge conflicts: Count and severity
- Reverted commits: Count (git log searches for `Revert`)
- Rework: Time spent rewriting code after discovery of conflicts
- Branch churn: How many branches were opened, abandoned, or redone

**User-Value Alignment:**
- Tasks completed: How many of 5 tasks done?
- Feature completeness: What % of acceptance criteria met per task?
- Scope creep: Were features added beyond task definition?
- Scope cuts: Were features deferred or removed?

### Rubric & Scoring

See `/rubric/rubric.md` for detailed scoring methodology.

**Summary:**
- Each dimension (cycle time, quality, clarity, waste, user-value) is scored 0–5
- Final score is weighted average: Quality (30%) + CycleTime (20%) + Clarity (20%) + Waste (15%) + UserValue (15%)
- Score 4.5–5.0 = Excellent; 3.5–4.4 = Good; 2.5–3.4 = Acceptable; <2.5 = Weak/Failed

### Comparison Method

After both runs are complete:
1. Score each dimension independently (avoid anchoring bias)
2. Calculate final scores
3. Plot results side-by-side
4. Analyze differences:
   - Did specialists have lower cycle time? Why?
   - Did generics have more merge conflicts? Evidence?
   - Did clarity differ? Which team had better documentation?
   - What coordination patterns emerged in each run?

---

## Keeping the Comparison Fair

### Identical Starting Point
- Both teams start from the same `/app` skeleton (in main branch)
- Both teams receive identical task definitions
- Both teams have the same 8–12 hour time budget
- Both teams use the same tools (Node, npm, git, better-sqlite3)

### Controlled Variables
1. **Task definitions:** Identical acceptance criteria, constraints, scoring
2. **Team size:** Specialists = 6 agents; Generics = 5 agents (close enough; minor confound)
3. **Tools:** No external dependencies or build systems
4. **Environment:** Same Node version, same git config

### Documented Confounds
If differences arise in outcomes, log the possible causes:
- **Agent capability:** Did one team have faster/slower agents? Document it.
- **Task order:** Did one team tackle tasks in different order? Both should use same order.
- **Interruptions:** Did external issues affect one team? Log and exclude from scoring.
- **Preparation:** Did one team spend more time planning? Time it and note it.

### Blind Evaluation
If possible, score runs **without knowing** which is specialists/generics until final tally.

---

## Expected Outcomes (Tentative)

### Specialists Should Show:
- **Lower cycle time:** Upfront coordination reduces merge conflicts and rework
- **Higher quality:** QA/Test specialist ensures coverage and tests drive development
- **Better clarity:** Docs/Release specialist gates PRs; decision log is comprehensive
- **Less waste:** Clear ownership reduces parallel edits and conflicts
- **Good alignment:** Coordinator ensures all acceptance criteria are met

### Generics Might Show:
- **Higher cycle time:** Merge conflicts and rework slow progress
- **Lower quality (initially):** More bugs discovered in QA due to less upfront design
- **Lower clarity:** Inconsistent documentation; sparse decision log
- **More waste:** Merge conflicts, reverted commits, duplicated work
- **Variable alignment:** Some tasks over-engineered; others under-specified

### Possible Surprises
- **Generics faster than expected:** If agents self-organize well and avoid conflicts
- **Specialists bottlenecked:** If Coordinator becomes a bottleneck or Docs/Release reviewing is too slow
- **No significant difference:** If coordination overhead is higher than conflict cost
- **Specialists lower quality:** If lack of autonomy stifles innovation or testing

---

## What We Learn

This experiment tests whether **organizational structure affects technical outcomes**:

1. **If Specialists win:** Conway's Law is validated. Clear ownership and defined roles reduce coordination overhead and enable better quality.

2. **If Generics win:** Autonomy and self-organization may outweigh coordination benefits. Smaller, nimble teams with no overhead may be faster.

3. **If they tie:** Coordination costs ≈ conflict costs. The level of task interdependency matters more than team structure.

4. **Other insights:**
   - Which tasks are most interdependent? (Task 04: History likely requires the most coordination)
   - Where do merge conflicts occur? (Shared files like schema, error handling, tests)
   - How do agents self-organize under pressure? (Observed patterns in decision log)
   - What's the cost of unclear ownership? (Measured in rework and bugs)

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-02-13 | Saul | Initial experiment documentation |
