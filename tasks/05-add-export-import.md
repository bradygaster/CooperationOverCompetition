# Task 05: Add Export/Import

## Problem Statement

Users need to back up and migrate their task boards: export to JSON, import from JSON. This enables disaster recovery, switching to another system, or bulk data loading.

## Acceptance Criteria

### Objective
- `GET /tasks/export` returns all tasks (including deleted) as a JSON file
- `POST /tasks/import` accepts a JSON file and creates/updates tasks
- Import validates schema and rejects malformed data
- Import is idempotent (importing twice produces same state)

### Testable Requirements
1. `GET /tasks/export` returns tasks with all fields (id, title, description, status, priority, created_at, updated_at)
2. Export format is valid JSON with array of task objects
3. Export includes metadata: export_version, exported_at, task_count
4. `POST /tasks/import` with valid JSON creates all tasks from file
5. Import rejects invalid JSON with HTTP 400
6. Import rejects missing required fields (title, status) with HTTP 400
7. Import with existing task IDs overwrites existing tasks (idempotent)
8. Import is atomic: bad data in last task rolls back entire import
9. Import logs a single audit event: `import` with file size, task count, outcome

## Constraints

- Export includes all tasks, not just non-deleted ones (audit trail requirement)
- Import must validate title length, status values, priority values
- Import must be transaction-safe (all or nothing)
- Max import file size: 10MB
- Import increments updated_at only for tasks that changed
- Exported task IDs are preserved in import (no new IDs generated)

## Done When

- [ ] `GET /tasks/export` endpoint implemented with correct JSON format
- [ ] `POST /tasks/import` endpoint implemented with validation
- [ ] Export includes metadata and all task fields
- [ ] All 9 testable requirements pass
- [ ] Import transaction and rollback behavior is tested
- [ ] Both endpoints have rate limiting (1 export per 5 seconds, 1 import per minute)
- [ ] API documentation describes JSON schema for export and import
