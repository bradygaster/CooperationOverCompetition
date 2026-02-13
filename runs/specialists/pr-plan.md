# PR Plan: Specialists Run

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
fix/task-{number}-{description}
```

Example:
- `fix/task-01-filter-case-sensitivity`

---

## PR Breakdown Strategy

### One Task = One PR (Minimum)

Each task generates at least one PR. If a task is large (e.g., Task 04: History), it may be split into multiple PRs:

#### Task 01: Filtering (1 PR)
- **PR Title:** `feat: Add task filtering by status and search`
- **Scope:** Query params, filter logic, tests, docs
- **Assignee:** Docs/Release (reviewer)

#### Task 02: Priorities (1 PR)
- **PR Title:** `feat: Add task priority field and sorting`
- **Scope:** Schema migration, priority field, sort logic, CLI update, tests, docs
- **Assignee:** Docs/Release (reviewer)

#### Task 03: Bulk Operations (1 PR)
- **PR Title:** `feat: Add bulk status update and delete endpoints`
- **Scope:** Bulk endpoints, transaction handling, validation, tests, docs
- **Assignee:** Docs/Release (reviewer)

#### Task 04: History (2 PRs)
- **PR 04a:** `feat: Add audit log table and logging middleware`
  - Scope: Schema, logging layer, transaction safety
  - Assignee: Docs/Release
  
- **PR 04b:** `feat: Add task history query endpoint and tests`
  - Scope: GET /tasks/:id/history endpoint, filtering, pagination, tests

#### Task 05: Export/Import (1 PR)
- **PR Title:** `feat: Add export and import endpoints`
- **Scope:** Export endpoint, import validation, transactions, rate limiting, tests, docs
- **Assignee:** Docs/Release (reviewer)

---

## PR Template

```markdown
## Task Reference
[Link to task definition in /tasks]

## Description
[Brief summary of what this PR does]

## Acceptance Criteria Met
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
[etc.]

## Changes
- [File 1: brief description]
- [File 2: brief description]
[etc.]

## Tests Added
- [Test description]
- [Test description]

## Documentation Updated
- [/app/README.md: new endpoint section]
- [etc.]

## Notes
[Any deviations from the task, decisions made, or known limitations]
```

---

## Review & Merge Process

1. **PR Creation:** Feature specialist pushes to feature branch and opens PR.
2. **Assignment:** Coordinator assigns Docs/Release as reviewer.
3. **Review Checklist (Docs/Release):**
   - [ ] All acceptance criteria are met
   - [ ] All tests pass locally
   - [ ] Code is readable and follows project conventions
   - [ ] API documentation is updated
   - [ ] No breaking changes to existing endpoints
   - [ ] Decision log or comments explain key choices
4. **Merge:** Docs/Release merges to main (no squash; preserve commit history).

---

## Timing Expectations

**Parallel PR Review:**
- While one PR is under review, other specialists continue work on their branches.
- Target: PR review + merge within 30 minutes of submission.

**Conflict Resolution:**
- If merge conflicts arise, assignees resolve collaboratively (Coordinator mediates if needed).
- Resolution should be documented in decision log.

---

## Deferral / Partial Completion

If a task is not complete by the end of Phase 1:
1. Create a PR for what's done, marked as **Draft**.
2. Log in decision log why the task is incomplete.
3. Continue in Phase 2 (if Phase 2 is allocated).

Example PR title: `[DRAFT] feat: Task 01 — Filtering (partial)`.

---

## Bug Fix PRs (QA Phase)

During bug bash, if bugs are discovered:

1. **Create fix branch:** `fix/task-{number}-{description}`
2. **Create PR with bug details:**
   ```markdown
   ## Bug
   [Description of bug, reproduction steps]
   
   ## Fix
   [What changed to fix it]
   
   ## Testing
   [How was the fix verified]
   ```
3. **Priority:** All bugs must be fixed and merged before run closure.

---

## Commit Message Convention

Commit messages should follow the pattern:

```
{type}({scope}): {subject}

{body}
```

Types: `feat`, `fix`, `test`, `docs`, `refactor`, `style`
Scope: `task-01`, `task-02`, etc., or filename

Examples:
```
feat(task-01): Add status and search filters to GET /tasks

- Add query parameter validation
- Update model layer with filter logic
- Add integration tests for filter combinations

Closes #1
```

```
test(task-02): Add priority sorting tests

- Test ascending and descending sort
- Test priority filtering with status filter
- Test default priority assignment

Closes #2
```

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-02-13 | Saul | Initial PR plan |
