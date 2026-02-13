# Task 02: Add Task Priorities

## Problem Statement

Users need to organize tasks by priority (low, medium, high) and sort the task list by priority level. Currently, all tasks are treated equally.

## Acceptance Criteria

### Objective
- Tasks have a `priority` field (low, medium, high; default = medium)
- `GET /tasks` accepts optional `sort` parameter for priority ordering
- Priority is preserved across all CRUD operations
- Priority constraints are enforced at the API and database levels

### Testable Requirements
1. `POST /tasks` accepts optional `priority` field (low|medium|high)
2. `POST /tasks` without priority defaults to `medium`
3. `POST /tasks?priority=invalid` responds with HTTP 400
4. `GET /tasks?sort=priority` returns tasks ordered high → medium → low
5. `GET /tasks?sort=priority&order=desc` returns low → medium → high
6. `PATCH /tasks/:id` can update priority without affecting other fields
7. Priority sorting works correctly with filtered results (status + priority sort)
8. All existing tasks after migration have priority = `medium` (backward compatible)

## Constraints

- Exactly three valid priority levels: `low`, `medium`, `high`
- Sort order: high priority first (descending) by default
- Priority field must be added via schema migration (not SQL ALTER at request time)
- Sorting must work efficiently with filters (e.g., status + priority)
- Default priority = `medium` for backward compatibility

## Done When

- [ ] Database schema migration adds `priority` column to tasks table
- [ ] Model layer supports priority defaults and validation
- [ ] Route handler validates and accepts priority in POST/PATCH requests
- [ ] Sorting logic handles priority + filter combinations
- [ ] All 8 testable requirements pass (tests in `tests/tasks.test.js`)
- [ ] Existing tasks are migrated with priority = `medium`
- [ ] API documentation updated with priority field and sort examples
