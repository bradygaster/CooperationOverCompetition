# Task 01: Add Task Filtering

## Problem Statement

Users need to search and filter the task list by status and title. Currently, `GET /tasks` returns the entire list with no filtering options.

## Acceptance Criteria

### Objective
- `GET /tasks` accepts optional query parameters `status` and `search`
- Filtering works correctly for all combinations of parameters
- Invalid parameters are rejected with a clear error message
- Performance is acceptable (< 100ms response time)

### Testable Requirements
1. `GET /tasks?status=todo` returns only tasks with status `todo`
2. `GET /tasks?search=buy` returns tasks with "buy" in the title (case-insensitive)
3. `GET /tasks?status=in-progress&search=design` returns in-progress tasks matching "design"
4. `GET /tasks?status=invalid` responds with HTTP 400 and an error message
5. `GET /tasks?search=` returns all tasks (empty search is no-op)
6. Filtering does not return soft-deleted tasks
7. Response time for filtering 100+ tasks is < 100ms

## Constraints

- Only title is searchable (not description)
- Search must be case-insensitive
- Valid status values: `todo`, `in-progress`, `done`
- Database queries must use indexed columns
- No breaking changes to existing API contract

## Done When

- [ ] SQL query layer supports filtering by status and search term
- [ ] Route handler validates query parameters and calls the filter logic
- [ ] All 7 testable requirements pass (integration tests in `tests/tasks.test.js`)
- [ ] Performance test passes (< 100ms for 100+ tasks)
- [ ] API documentation updated in `/app/README.md` with examples
- [ ] No regression in existing `GET /tasks` behavior (returns all tasks when no filters)
