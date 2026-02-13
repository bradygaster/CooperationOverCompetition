# PR Plan: Generics Run

## Branch Naming Convention

All feature branches follow the pattern:

```
feature/task-{number}-{kebab-case-title}
```

Examples:
- `feature/task-01-filtering`
- `feature/task-02-priorities`
- `feature/task-03-bulk-operations`
- `feature/task-04-task-history`
- `feature/task-05-export-import`

Bug fix branches during QA:

```
fix/{description}
```

Example:
- `fix/filter-case-sensitivity`

---

## Work Claiming Process

### Option 1: Branch-First
Agent opens feature branch for a task and pushes to origin:
```bash
git checkout -b feature/task-01-filtering
# ... work ...
git push origin feature/task-01-filtering
```

This signals to other agents: "I'm working on Task 01."

### Option 2: PR-First (Preferable for Coordination)
Agent opens a PR (even if empty) to signal claim:
- PR Title: `[WIP] feat: Task 01 — Filtering`
- Comment: "Starting Task 01. Expect API routes + filtering logic."
- Other agents can comment with suggestions or offer to help.

### Parallel Work on Same Task
If two agents start Task 01 simultaneously:
1. First to push wins the branch name.
2. Second agent either:
   - Contributes to the same branch (collaborate)
   - Opens a new branch with variant suffix: `feature/task-01-filtering-alt`
   - Merge conflicts will occur; agents must resolve

---

## PR Process (Informal)

In generic mode, PR review is peer-to-peer with no designated reviewer:

1. **Agent pushes feature branch and opens PR**
2. **Any agent can review** (first-come-first-served)
3. **Review checklist (flexible):**
   - [ ] Tests pass locally
   - [ ] Code is readable
   - [ ] Acceptance criteria appear to be met
   - [ ] No obvious bugs
   - [ ] Documentation exists (optional, if prioritized)

4. **Feedback options:**
   - Approve & merge
   - Request changes (author revises)
   - Rewrite the PR (if significant issues)

5. **Merge:** Author merges once approved (no squash; preserve commit history)

---

## Expected PR Chaos vs. Specialists

Expect:
- **More PR reviews needed** (less clear boundaries = more back-and-forth)
- **Inconsistent standards** (each reviewer has different expectations)
- **More rework** (conflicting design decisions discovered post-merge)
- **Documentation gaps** (some agents skip docs if not enforced)

---

## PR Template (Optional)

Agents may use this, but it's not required:

```markdown
## Task Reference
[Link to task definition in /tasks]

## Description
[Brief summary of what this PR does]

## Acceptance Criteria Met
- [ ] Criterion 1
- [ ] Criterion 2
[etc.]

## Changes
- [File 1: brief description]
- [File 2: brief description]

## Tests Added
- [Test description]

## Notes
[Any issues, decisions, or known limitations]
```

---

## Conflict Resolution

### Merge Conflicts
When two agents edit the same file:
1. Git will flag the conflict
2. Conflicting agents must resolve manually
3. Resolution is logged in decision log
4. Tests re-run after resolution

### Design Conflicts
When two agents make incompatible decisions (e.g., different schema):
1. Discovered in PR review
2. Discussed in PR comments
3. One agent's code is either:
   - Merged first (other agent must adapt)
   - Rejected (rewritten to match)
   - Compromised (both adapt)

---

## Timing Expectations

Due to lack of coordination:
- **First PR:** ~45 min to 1 hour per task (one agent writing everything)
- **Parallel PRs:** Potential for conflicts every 15–30 min (if agents overlap)
- **Review:** 15–30 min per PR (peer review, informal)
- **Merge conflicts:** 10–20 min per conflict (manual resolution)

**Total Phase 1 time:** 4 hours expected, but may extend due to rework.

---

## Deferral / Incomplete Tasks

If a task is not complete by the end of Phase 1:
1. Create a PR for what's done, marked **[WIP]** in title
2. Document in decision log why it's incomplete
3. Continue in Phase 2 (if allocated)
4. Another agent can take over, or original agent resumes

---

## Documentation Expectations

Unlike specialists mode (where Docs/Release is responsible):
- **Each agent documents their own work** (or doesn't)
- **No centralized review** for documentation quality
- **Inconsistency expected** (some endpoints well-documented, others sparse)
- **May require cleanup** during QA/bug bash phase

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-02-13 | Saul | Initial PR plan |
