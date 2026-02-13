# Task 04: Add Task History / Audit Log

## Problem Statement

Users need to track what changed in the task board over time: who created tasks, when statuses were changed, what fields were modified. Currently, there is no audit trail.

## Acceptance Criteria

### Objective
- Every task mutation (create, update, delete) is logged with timestamp, operation type, and field changes
- `GET /tasks/:id/history` returns the audit log for a task
- Audit log is queryable and immutable (append-only)
- Both single and bulk operations are logged

### Testable Requirements
1. Creating a task logs operation `create` with all fields
2. Updating task status logs operation `update` with old and new status
3. Updating multiple fields logs a single entry with all changes
4. Bulk status updates log one entry per task (or one with bulk flag)
5. Deleting a task logs operation `delete` with reason
6. `GET /tasks/:id/history` returns audit log in chronological order
7. Each log entry includes: timestamp, operation, field_name (or null for create/delete), old_value, new_value, user_id (or null for now)
8. History endpoint filters by operation type: `GET /tasks/:id/history?operation=update`
9. Deleted tasks are queryable via history: `GET /tasks/:id/history` works even after DELETE

## Constraints

- Audit log is append-only (no updates or deletes to log records)
- Log entries must be transaction-safe (committed with the operation)
- Delete operation logs the task's final state
- Timestamp is server time, not user-provided
- For now, user_id can be null (user auth is out of scope)

## Done When

- [ ] Database schema includes `audit_log` table with correct columns
- [ ] Model layer auto-logs on create, update, delete
- [ ] Middleware or trigger pattern ensures all mutations are logged
- [ ] `GET /tasks/:id/history` endpoint returns paginated audit log
- [ ] All 9 testable requirements pass
- [ ] Audit log survives transaction rollback (logged before rollback, not rolled back)
- [ ] Tests verify create, update, bulk, delete logging scenarios
- [ ] API documentation explains audit log schema and query parameters
