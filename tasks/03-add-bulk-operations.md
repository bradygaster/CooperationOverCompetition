# Task 03: Add Bulk Operations

## Problem Statement

Users need to perform operations on multiple tasks at once: bulk status updates (e.g., mark 5 tasks as done) and bulk delete (e.g., delete all completed tasks). Currently, operations must be done one task at a time.

## Acceptance Criteria

### Objective
- `PATCH /tasks/bulk` accepts an array of task IDs and a new status
- `DELETE /tasks/bulk` accepts an array of task IDs and deletes them
- Bulk operations are atomic (all succeed or all fail)
- Clear error messages when partial operations fail
- Audit trail logs bulk operations

### Testable Requirements
1. `PATCH /tasks/bulk` with valid IDs and status updates all tasks
2. `PATCH /tasks/bulk?status=done` with IDs [1, 2, 3] marks all three as done
3. `PATCH /tasks/bulk` with non-existent ID responds with HTTP 400 (transaction rolled back)
4. `PATCH /tasks/bulk` with invalid status responds with HTTP 400
5. `PATCH /tasks/bulk` with empty array responds with HTTP 400
6. `DELETE /tasks/bulk` with valid IDs deletes all specified tasks
7. `DELETE /tasks/bulk` with non-existent ID responds with HTTP 400 (transaction rolled back)
8. Bulk status updates respect state machine rules (todo → in-progress → done, no backward moves)
9. Each bulk operation produces one audit log entry (not one per task)

## Constraints

- Both endpoints must use database transactions (all-or-nothing)
- Status transitions must follow the state machine (no backward moves)
- Empty ID array is an error
- Max 100 tasks per bulk operation (to prevent DoS)
- Audit log records the bulk operation as a single event with ID array and outcome

## Done When

- [ ] `PATCH /tasks/bulk` endpoint implemented with transaction handling
- [ ] `DELETE /tasks/bulk` endpoint implemented with transaction handling
- [ ] Both endpoints validate input and reject partial failures
- [ ] All 9 testable requirements pass
- [ ] Transaction rollback is tested (partial failure scenario)
- [ ] Audit log records bulk operations correctly
- [ ] API documentation describes bulk operation behavior and limits
