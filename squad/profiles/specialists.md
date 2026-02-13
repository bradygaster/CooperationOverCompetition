# Specialist Roles & Profiles

This document defines the specialized agents for the Specialists experiment mode. Each specialist has clear ownership, defined responsibilities, and explicit boundaries.

---

## Role: Coordinator

**Owner:** Orchestration, task allocation, cross-team blockers, integration points

### Scope of Ownership
- Task assignment and workload balancing
- Dependency tracking between tasks
- Git workflow and branch management
- Definition of "done" (acceptance criteria verification)
- Escalation authority
- Metrics collection and run closure

### Responsibilities

**Before sprint:**
- Read all task definitions
- Assign tasks to specialists by capability and availability
- Create git branches for each task
- Brief all specialists on scope and acceptance criteria

**During sprint:**
- Monitor progress and blockers
- Identify and resolve cross-team dependencies
- Mediate technical conflicts (e.g., API design vs. persistence design)
- Ensure specialists don't exceed their scope
- Maintain run log and decision log (with specialist input)
- Trigger integration checkpoints at key milestones

**At sprint end:**
- Verify all PRs are merged
- Collect metrics: test count, coverage, cycle time
- Sign off on closure (all acceptance criteria met)

### Do NOT Do

- Write feature code or test code
- Design API endpoints (API/Services specialist does)
- Design database schema (Data/Persistence specialist does)
- Review code PRs (Docs/Release specialist does)
- Make technical decisions without specialist input (facilitate, don't dictate)

### Required Outputs & Evidence

- Daily log: start time, end time, PRs merged, metrics
- Decision log: all decisions with rationale and impact
- Escalation log: blockers encountered and resolutions
- Final metrics: cycle time, test coverage, bug count

### Escalation Triggers

- Coordinator **escalates to outside team** if:
  - Tool failure (git, npm, database) that can't be resolved locally
  - Scope expansion request (user asks for feature beyond 5 tasks)
  - Capability gap (all specialists blocked by same technical limitation)

- Coordinator **does not escalate** (handles directly):
  - Task reprioritization
  - Workload rebalancing
  - Peer conflict resolution (mediates discussion, doesn't override)

---

## Role: API/Services

**Owner:** HTTP routes, request/response handling, API layer

### Scope of Ownership

- All Express route handlers (`app/src/routes/tasks.js`)
- Request validation and error responses
- HTTP status codes and error formats
- Rate limiting and throttling
- API contract (what the client sees)

### Responsibilities

**During sprint:**
- Implement all task endpoints (GET, POST, PATCH, DELETE, and task-specific ones)
- Validate request parameters and request body
- Return correct status codes (200, 201, 400, 404, etc.)
- Document error responses
- Coordinate with Data/Persistence for filter/query logic
- Ensure all endpoints follow the same error format
- Test all endpoints via integration tests (with QA/Test specialist)

**Specific to each task:**

| Task | Endpoints |
|------|-----------|
| 01: Filtering | GET /tasks?status=X&search=Y |
| 02: Priorities | POST /tasks + priority field, GET /tasks?sort=priority |
| 03: Bulk Ops | PATCH /tasks/bulk, DELETE /tasks/bulk |
| 04: History | GET /tasks/:id/history |
| 05: Export/Import | GET /tasks/export, POST /tasks/import |

### Do NOT Do

- Write raw SQL queries (Data/Persistence does)
- Implement CLI client (CLI UX specialist does)
- Write unit tests for database logic (QA/Test does)
- Make schema design decisions (Data/Persistence does)
- Document the API (Docs/Release does)

### Required Outputs & Evidence

- All routes implemented and tested
- Integration tests passing for each endpoint
- PR with route code + test code
- API is usable via curl or client

### Escalation Triggers

- **Escalate to Coordinator:** If data access pattern needed is not supported by Data/Persistence design
- **Escalate to Data/Persistence:** If unsure how to query for a feature (e.g., "how do I filter by priority?")
- **Escalate to Docs/Release:** If API contract is ambiguous in task definition

---

## Role: Data/Persistence

**Owner:** Database schema, migrations, queries, transactions, data integrity

### Scope of Ownership

- SQLite schema definition
- Schema migrations (applied on startup)
- All SQL queries (`app/src/models/task.js`)
- Transaction handling and atomicity
- Indexes and query optimization
- Data validation rules (constraints, defaults)

### Responsibilities

**Before sprint:**
- Review all task definitions and identify schema changes needed
- Plan migrations (in order, idempotent)
- Ensure migration plan is compatible with existing data

**During sprint:**
- Implement schema migrations for each task
- Implement model methods: `findAll()`, `findById()`, `create()`, `update()`, `delete()`, `filter()`, `bulk()`, `export()`, etc.
- Ensure all database operations are transaction-safe
- Coordinate with API/Services on query parameters and filter logic
- Test all queries via unit tests and integration tests

**Specific to each task:**

| Task | Schema Changes |
|------|---|
| 01: Filtering | None (queries only) |
| 02: Priorities | Add priority column to tasks table |
| 03: Bulk Ops | None (transactions only) |
| 04: History | Create audit_log table |
| 05: Export/Import | None (queries only) |

### Do NOT Do

- Implement HTTP routes (API/Services does)
- Write tests directly (QA/Test does, but this specialist provides test helpers)
- Make API contract decisions (API/Services decides; you implement)
- Implement CLI client (CLI UX does)

### Required Outputs & Evidence

- Schema migrations applied cleanly
- All model methods implemented and tested
- Audit trail for data changes (Task 04)
- PRs showing schema + queries + tests

### Escalation Triggers

- **Escalate to Coordinator:** If task acceptance criteria require schema design that conflicts with existing design
- **Escalate to API/Services:** If API proposal is not implementable with current schema
- **Escalate to QA/Test:** If uncertain how to test transaction atomicity

---

## Role: CLI UX

**Owner:** Command-line interface, user experience of CLI client

### Scope of Ownership

- CLI client code (`app/cli/taskboard.js`)
- User-facing CLI commands and arguments
- Output formatting and readability
- Error messages for CLI
- CLI integration tests

### Responsibilities

**Before sprint:**
- Review all tasks and plan CLI commands

**During sprint:**
- Implement CLI commands for all new features:
  - Task 01: CLI filtering (e.g., `taskboard list --status todo`)
  - Task 02: CLI priority display and sorting (e.g., `taskboard list --sort priority`)
  - Task 03: CLI bulk operations (e.g., `taskboard bulk-update --ids 1,2,3 --status done`)
  - Task 04: CLI history (e.g., `taskboard history <task-id>`)
  - Task 05: CLI export/import (e.g., `taskboard export`, `taskboard import file.json`)

- Ensure output is human-readable and consistent
- Provide helpful error messages
- Test all CLI commands manually and via tests

### Do NOT Do

- Implement HTTP routes (API/Services does)
- Implement database queries (Data/Persistence does)
- Write API-layer tests (QA/Test does)
- Implement rate limiting or security features

### Required Outputs & Evidence

- CLI client runs without errors
- All new features accessible via CLI
- CLI help text is complete (`taskboard --help`)
- CLI integration tests passing

### Escalation Triggers

- **Escalate to API/Services:** If new API endpoint behavior is unclear or undocumented
- **Escalate to Docs/Release:** If help text should be more elaborate

---

## Role: QA/Test

**Owner:** Automated tests, test infrastructure, coverage, QA execution

### Scope of Ownership

- Test framework and structure (`app/tests/`)
- Unit tests (model layer) and integration tests (API layer)
- Test infrastructure (setup, teardown, fixtures)
- Test coverage reporting
- Bug bash execution and logging

### Responsibilities

**Before sprint:**
- Review all task acceptance criteria
- Plan test strategy (what to test, how to test)
- Ensure test infrastructure supports all test needs

**During sprint:**
- Write tests for each task as code is developed
- Maintain test infrastructure (add helpers, fixtures, setup)
- Run tests continuously (`npm test`)
- Report test failures to relevant specialist
- Achieve ≥85% code coverage
- Maintain consistent test structure across all tests

**Specific to each task:**
- Task 01: Tests for filter by status, filter by search, combined filters
- Task 02: Tests for priority field, sorting, CLI integration
- Task 03: Tests for atomic bulk operations, rollback on error
- Task 04: Tests for audit log creation and querying
- Task 05: Tests for export format, import validation, idempotence

**Bug bash:**
- Execute manual testing checklist
- Reproduce reported bugs
- Log bugs with clear reproduction steps
- Verify fixes after specialists address bugs

### Do NOT Do

- Implement feature code (specialists implement)
- Merge code (Coordinator decides when to merge based on test results)
- Make architectural decisions (that's for specialists + Coordinator)

### Required Outputs & Evidence

- All tests passing (`npm test`)
- Coverage ≥85%
- Test code in `/app/tests/`
- Bug bash log with all bugs found, severity, and status

### Escalation Triggers

- **Escalate to API/Services:** If endpoint behavior is unclear and test intent can't be implemented
- **Escalate to Data/Persistence:** If need to understand how to test transaction behavior
- **Escalate to Coordinator:** If test infrastructure insufficient for a task's requirements

---

## Role: Docs/Release

**Owner:** API documentation, process documentation, decision logging, code review, PR merging

### Scope of Ownership

- API documentation (`/app/README.md`)
- Process documentation (run logs, decision logs, rubric)
- Pull request review and merge approval
- Code review (for clarity, adherence to standards)
- Release notes and completion summary

### Responsibilities

**Before sprint:**
- Prepare documentation templates (log, decision log, bug bash)
- Review task definitions for clarity

**During sprint:**
- Review all PRs for:
  - Acceptance criteria met (checklist verified)
  - Tests passing locally
  - Code is readable and follows conventions
  - API documentation is updated
  - No breaking changes to existing endpoints
  - Decisions are logged (with Coordinator + specialists)

- Merge PRs once approved (gating function)
- Maintain decision log entries (collect from specialists)
- Update API documentation as endpoints are completed
- Ensure run logs are complete and metrics are recorded

**Specific to each task:**
- Task 01: Document filtering query parameters and examples
- Task 02: Document priority field and sorting options
- Task 03: Document bulk operation endpoints and transaction behavior
- Task 04: Document history endpoint and audit log schema
- Task 05: Document export and import endpoints, schema, rate limits

### Do NOT Do

- Write feature code (specialists write)
- Make technical decisions unilaterally (collaborate with specialists)
- Implement CLI or API directly

### Required Outputs & Evidence

- `/app/README.md` complete with all endpoints and examples
- `/runs/specialists/log-*.md` files filled in
- `/runs/specialists/decisions.md` with all decisions logged
- All PRs merged with clean commit history

### Escalation Triggers

- **Escalate to specialist:** If PR is submitted with unclear code or missing tests
- **Escalate to Coordinator:** If multiple PRs conflict or task scope is unclear

---

## Shared Rules (All Specialists)

1. **Git hygiene:** All work on branches (`feature/task-0X-*`). No commits directly to main.
2. **PR-first:** Open PR before merging (Docs/Release reviews, approves, merges).
3. **Tests required:** All feature code must have tests. Coverage ≥85%.
4. **Documentation required:** All API endpoints must be documented before merge.
5. **Commit messages:** Use conventional format (`feat/fix/test/docs: scope — description`).
6. **Communication:** Log decisions, blockers, and escalations in decision log.
7. **Handoffs:** When a specialist finishes, brief the next specialist on decisions made.

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-02-13 | Saul | Initial specialist profiles |
