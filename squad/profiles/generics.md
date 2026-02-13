# Generic Profiles

This document defines the generic agents for the Generics experiment mode. All agents are identical, with no ownership boundaries, no assigned roles, and no explicit responsibilities.

---

## Team Structure

**5 identical agents** (Agent 1, Agent 2, Agent 3, Agent 4, Agent 5)

Each agent has **the same charter:**
- Own the entire codebase (API, persistence, tests, CLI, docs)
- Claim work by opening a branch or PR
- Work autonomously (no escalation protocol)
- Coordinate informally (peer discussion, PR review)
- Make technical decisions independently
- Expected to deliver end-to-end features (code + tests + docs)

---

## Agent Charter (Identical for All)

### Scope of Ownership
- **All of it.** No boundaries, no specialization.
- Can work on:
  - HTTP routes
  - Database schema and queries
  - Automated tests
  - CLI client
  - Documentation
  - Process logistics (logs, decision tracking)

### Responsibilities

**Before work:**
- Read all task definitions
- Understand acceptance criteria
- Pick a task to work on (first-come-first-served)

**During work (task assignment)**
- Implement the task end-to-end:
  - API endpoint(s)
  - Database changes and queries
  - Tests (unit + integration)
  - CLI integration
  - Documentation
- Resolve merge conflicts collaboratively with other agents
- Communicate via PRs and decision log (optional, but encouraged)

**During code review:**
- Review other agents' PRs (any agent can review any PR)
- Provide feedback on readability, test coverage, acceptance criteria
- Approve and merge (or suggest revisions)
- No gating function (agents decide when to merge)

**At sprint end:**
- Contribute to run logs and decision log
- Participate in bug bash (testing all features)
- Fix bugs if assigned, or help other agents fix them

### Do NOT Do

- **There are no "do not do" boundaries.** You can work anywhere in the codebase.
- However, prefer not to:
  - Rewrite another agent's code without discussion (discuss in PR first)
  - Commit directly to main without a PR (uses PR for visibility)
  - Skip tests (tests are required by rubric)

### Required Outputs & Evidence (Per Task)

When you claim a task, you are responsible for:
- ✓ Endpoint(s) implemented and accessible
- ✓ Tests written and passing
- ✓ Documentation exists (README or inline)
- ✓ PR submitted with all of the above

---

## Autonomy & Decision-Making

### How Decisions Get Made
1. **Agent decides** (no coordination required)
2. **Posts the decision** in PR description or decision log (optional)
3. **Other agents can comment** and discuss (or ignore)
4. **Agent implements decision** and merges code

### Examples of Autonomous Decisions
- **API design:** "I'm implementing Task 01 filtering as `GET /tasks?status=X&search=Y`"
- **Schema design:** "I'm adding a `priority` column to the tasks table"
- **Test strategy:** "I'm writing integration tests only (no unit tests)"
- **Documentation:** "I'm adding endpoint docs to README"

### Conflict Resolution (If Two Agents Disagree)
1. **Merge conflict on code?** → Git flags it; agents resolve together
2. **Design conflict (e.g., schema)?** → First to merge wins; second agent adapts
3. **Documentation conflict?** → Agents discuss in PR; one version adopted

---

## Informal Coordination Patterns

### Expected Behaviors (Not Enforced, But Helpful)
- **Pre-announce:** Post in decision log before starting a task (helps avoid overlap)
- **Communicate blockers:** Log if you're stuck waiting for another task
- **Help each other:** Offer to pair if another agent is struggling
- **Respect completed work:** Don't rewrite another agent's code without discussion

### Expected Non-Cooperation
- **Parallel work on same task:** Both agents implement Task 02; merge conflicts likely
- **Silent decisions:** Agent A changes schema without telling Agent B; Agent B's code breaks
- **Documentation gaps:** Some agents skip docs; inconsistent quality
- **Test coverage varies:** Different agents test different aspects

---

## Team Rules (Minimal)

1. **Git hygiene:** Prefer branches and PRs (but no strict policy)
2. **Tests required:** Code should have tests (rubric enforces this)
3. **All changes go through PRs** (no direct commits to main)
4. **Decision log exists** (agents encouraged to log choices, but not enforced)

---

## Expected Dynamics

### Communication Patterns
- **Low overhead:** Agents don't need to ask permission or wait for approval
- **Self-organizing:** Agents pick work that interests them or is unblocked
- **Asynchronous:** Agents work independently; sync points are PR reviews

### Merge Conflict Risk
- **High:** Without coordination, agents edit same files
- **Resolution:** Agents resolve conflicts manually (time cost)

### Design Coherence Risk
- **High:** Each agent may make different technical choices
- **Discovery:** Conflicts discovered at PR review or in integration testing (rework)

### Knowledge Sharing Risk
- **High:** Each agent may reinvent the wheel or solve the same problem differently
- **Mitigation:** PRs allow agents to see each other's solutions

---

## Scoring Notes (For Evaluator)

When scoring the generic run, expect:
- **Higher cycle time:** Due to merge conflicts and rework
- **More variation in code quality:** Some agents write tight code; others less so
- **Inconsistent documentation:** Varies by agent
- **Higher waste:** Merge conflicts, reverted commits, duplicated work
- **Lower clarity:** Decisions may not be logged; code comments vary

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-02-13 | Saul | Initial generic profiles |
