const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { setupTestDb } = require('./helpers');

let teardown;
let Task;

describe('Task model', () => {
  before(() => {
    teardown = setupTestDb();
    // Require model AFTER DB is patched (cache was cleared by setupTestDb)
    Task = require('../src/models/task');
  });

  after(() => {
    teardown();
  });

  describe('create', () => {
    it('creates a task with title and description', () => {
      const task = Task.create({ title: 'Buy milk', description: 'Whole milk please' });
      assert.ok(task.id);
      assert.equal(task.title, 'Buy milk');
      assert.equal(task.description, 'Whole milk please');
      assert.equal(task.status, 'todo');
      assert.ok(task.created_at);
      assert.ok(task.updated_at);
    });

    it('creates a task with title only (description optional)', () => {
      const task = Task.create({ title: 'Walk the dog' });
      assert.ok(task.id);
      assert.equal(task.title, 'Walk the dog');
      assert.equal(task.description, '');
      assert.equal(task.status, 'todo');
      assert.equal(task.priority, 'medium');
    });

    it('rejects creation without title', () => {
      // The model itself doesn't validate — the DB NOT NULL constraint does
      assert.throws(() => {
        Task.create({});
      });
    });

    it('creates a task with explicit priority', () => {
      const task = Task.create({ title: 'Urgent fix', priority: 'high' });
      assert.equal(task.priority, 'high');
    });

    it('defaults priority to medium when not specified', () => {
      const task = Task.create({ title: 'Normal task' });
      assert.equal(task.priority, 'medium');
    });
  });

  describe('getAll', () => {
    it('returns all tasks', () => {
      const tasks = Task.getAll();
      assert.ok(Array.isArray(tasks));
      assert.ok(tasks.length >= 2, 'Should have at least the 2 tasks created above');
    });
  });

  describe('getById', () => {
    it('returns a task by ID', () => {
      const created = Task.create({ title: 'Find me' });
      const found = Task.getById(created.id);
      assert.equal(found.id, created.id);
      assert.equal(found.title, 'Find me');
    });

    it('returns undefined for a non-existent ID', () => {
      const result = Task.getById(99999);
      assert.equal(result, undefined);
    });
  });

  describe('update', () => {
    it('updates task title', () => {
      const task = Task.create({ title: 'Old title' });
      const updated = Task.update(task.id, { title: 'New title' });
      assert.equal(updated.title, 'New title');
      assert.equal(updated.description, task.description);
    });

    it('updates task description', () => {
      const task = Task.create({ title: 'Desc test', description: 'old desc' });
      const updated = Task.update(task.id, { description: 'new desc' });
      assert.equal(updated.description, 'new desc');
      assert.equal(updated.title, 'Desc test');
    });

    it('transitions status: todo → in-progress', () => {
      const task = Task.create({ title: 'Status test 1' });
      const updated = Task.update(task.id, { status: 'in-progress' });
      assert.equal(updated.status, 'in-progress');
    });

    it('transitions status: in-progress → done', () => {
      const task = Task.create({ title: 'Status test 2' });
      Task.update(task.id, { status: 'in-progress' });
      const updated = Task.update(task.id, { status: 'done' });
      assert.equal(updated.status, 'done');
    });

    it('rejects invalid transition: todo → done', () => {
      const task = Task.create({ title: 'Skip test' });
      assert.throws(() => {
        Task.update(task.id, { status: 'done' });
      }, (err) => {
        assert.equal(err.code, 'INVALID_TRANSITION');
        return true;
      });
    });

    it('rejects invalid transition: done → todo', () => {
      const task = Task.create({ title: 'Backwards test 1' });
      Task.update(task.id, { status: 'in-progress' });
      Task.update(task.id, { status: 'done' });
      assert.throws(() => {
        Task.update(task.id, { status: 'todo' });
      }, (err) => {
        assert.equal(err.code, 'INVALID_TRANSITION');
        return true;
      });
    });

    it('rejects invalid transition: in-progress → todo', () => {
      const task = Task.create({ title: 'Backwards test 2' });
      Task.update(task.id, { status: 'in-progress' });
      assert.throws(() => {
        Task.update(task.id, { status: 'todo' });
      }, (err) => {
        assert.equal(err.code, 'INVALID_TRANSITION');
        return true;
      });
    });

    it('returns null for non-existent task', () => {
      const result = Task.update(99999, { title: 'Ghost' });
      assert.equal(result, null);
    });

    it('updates priority without affecting other fields', () => {
      const task = Task.create({ title: 'Priority update', description: 'keep me', priority: 'low' });
      const updated = Task.update(task.id, { priority: 'high' });
      assert.equal(updated.priority, 'high');
      assert.equal(updated.title, 'Priority update');
      assert.equal(updated.description, 'keep me');
      assert.equal(updated.status, 'todo');
    });
  });

  describe('remove', () => {
    it('deletes a task and returns it', () => {
      const task = Task.create({ title: 'Delete me' });
      const deleted = Task.remove(task.id);
      assert.equal(deleted.id, task.id);
      assert.equal(deleted.title, 'Delete me');
      // Verify it's gone
      const gone = Task.getById(task.id);
      assert.equal(gone, undefined);
    });

    it('returns null when deleting a non-existent task', () => {
      const result = Task.remove(99999);
      assert.equal(result, null);
    });
  });

  describe('getFiltered', () => {
    before(() => {
      // Create tasks with various statuses for filtering tests
      const t1 = Task.create({ title: 'Design homepage', description: 'UI work' });
      Task.update(t1.id, { status: 'in-progress' });
      Task.create({ title: 'Buy groceries', description: 'Food shopping' });
      const t3 = Task.create({ title: 'Design API schema', description: 'Backend work' });
      Task.update(t3.id, { status: 'in-progress' });
      Task.create({ title: 'Write README', description: 'Docs' });
    });

    it('filters by status', () => {
      const results = Task.getFiltered({ status: 'in-progress' });
      assert.ok(results.length >= 2);
      results.forEach(t => assert.equal(t.status, 'in-progress'));
    });

    it('filters by search term (case-insensitive)', () => {
      const results = Task.getFiltered({ search: 'buy' });
      assert.ok(results.length >= 1);
      results.forEach(t => assert.ok(t.title.toLowerCase().includes('buy')));
    });

    it('filters by both status and search', () => {
      const results = Task.getFiltered({ status: 'in-progress', search: 'design' });
      assert.ok(results.length >= 1);
      results.forEach(t => {
        assert.equal(t.status, 'in-progress');
        assert.ok(t.title.toLowerCase().includes('design'));
      });
    });

    it('returns all tasks when no filters provided', () => {
      const all = Task.getAll();
      const filtered = Task.getFiltered({});
      assert.equal(filtered.length, all.length);
    });

    it('returns empty array when no tasks match', () => {
      const results = Task.getFiltered({ search: 'zzz_nonexistent_zzz' });
      assert.equal(results.length, 0);
    });
  });

  describe('bulkUpdateStatus', () => {
    it('updates multiple tasks in a transaction', () => {
      const t1 = Task.create({ title: 'Bulk up 1' });
      const t2 = Task.create({ title: 'Bulk up 2' });
      const result = Task.bulkUpdateStatus([t1.id, t2.id], 'in-progress');
      assert.equal(result.length, 2);
      result.forEach(t => assert.equal(t.status, 'in-progress'));
    });

    it('throws and rolls back when a task does not exist', () => {
      const t1 = Task.create({ title: 'Bulk exist' });
      assert.throws(() => {
        Task.bulkUpdateStatus([t1.id, 99999], 'in-progress');
      }, (err) => {
        assert.equal(err.code, 'BULK_FAILED');
        return true;
      });
      // Verify rollback
      const check = Task.getById(t1.id);
      assert.equal(check.status, 'todo');
    });

    it('throws and rolls back on invalid status transition', () => {
      const t1 = Task.create({ title: 'Bulk transition' });
      assert.throws(() => {
        Task.bulkUpdateStatus([t1.id], 'done');
      }, (err) => {
        assert.equal(err.code, 'BULK_FAILED');
        assert.ok(err.message.includes('Invalid status transition'));
        return true;
      });
      const check = Task.getById(t1.id);
      assert.equal(check.status, 'todo');
    });

    it('rolls back all when one task has invalid transition', () => {
      const t1 = Task.create({ title: 'Bulk mixed 1' });
      const t2 = Task.create({ title: 'Bulk mixed 2' });
      Task.update(t2.id, { status: 'in-progress' });
      Task.update(t2.id, { status: 'done' });
      // t1 is 'todo', t2 is 'done' — transitioning to 'in-progress' works for t1 but not t2
      assert.throws(() => {
        Task.bulkUpdateStatus([t1.id, t2.id], 'in-progress');
      }, (err) => {
        assert.equal(err.code, 'BULK_FAILED');
        return true;
      });
      // t1 should still be 'todo' due to rollback
      assert.equal(Task.getById(t1.id).status, 'todo');
    });
  });

  describe('bulkRemove', () => {
    it('removes multiple tasks in a transaction', () => {
      const t1 = Task.create({ title: 'Bulk rm 1' });
      const t2 = Task.create({ title: 'Bulk rm 2' });
      const result = Task.bulkRemove([t1.id, t2.id]);
      assert.equal(result.length, 2);
      assert.equal(Task.getById(t1.id), undefined);
      assert.equal(Task.getById(t2.id), undefined);
    });

    it('throws and rolls back when a task does not exist', () => {
      const t1 = Task.create({ title: 'Bulk rm exist' });
      assert.throws(() => {
        Task.bulkRemove([t1.id, 99999]);
      }, (err) => {
        assert.equal(err.code, 'BULK_FAILED');
        return true;
      });
      // Verify rollback: t1 should still exist
      assert.ok(Task.getById(t1.id));
    });
  });

  describe('getHistory', () => {
    it('logs create operation with all fields', () => {
      const task = Task.create({ title: 'Audit create', description: 'desc', priority: 'high' });
      const history = Task.getHistory(task.id);
      assert.equal(history.length, 1);
      assert.equal(history[0].operation, 'create');
      assert.ok(Array.isArray(history[0].changes));
      const fields = history[0].changes.map(c => c.field);
      assert.ok(fields.includes('title'));
      assert.ok(fields.includes('description'));
      assert.ok(fields.includes('status'));
      assert.ok(fields.includes('priority'));
      const titleChange = history[0].changes.find(c => c.field === 'title');
      assert.equal(titleChange.old_value, null);
      assert.equal(titleChange.new_value, 'Audit create');
    });

    it('logs update operation with old and new status', () => {
      const task = Task.create({ title: 'Audit update' });
      Task.update(task.id, { status: 'in-progress' });
      const history = Task.getHistory(task.id);
      const updateEntry = history.find(h => h.operation === 'update');
      assert.ok(updateEntry);
      const statusChange = updateEntry.changes.find(c => c.field === 'status');
      assert.equal(statusChange.old_value, 'todo');
      assert.equal(statusChange.new_value, 'in-progress');
    });

    it('logs a single entry when updating multiple fields', () => {
      const task = Task.create({ title: 'Multi field' });
      Task.update(task.id, { title: 'Updated title', description: 'Updated desc' });
      const history = Task.getHistory(task.id);
      const updates = history.filter(h => h.operation === 'update');
      assert.equal(updates.length, 1);
      assert.equal(updates[0].changes.length, 2);
      const fields = updates[0].changes.map(c => c.field);
      assert.ok(fields.includes('title'));
      assert.ok(fields.includes('description'));
    });

    it('logs one entry per task for bulk status updates', () => {
      const t1 = Task.create({ title: 'Bulk audit 1' });
      const t2 = Task.create({ title: 'Bulk audit 2' });
      Task.bulkUpdateStatus([t1.id, t2.id], 'in-progress');
      const h1 = Task.getHistory(t1.id);
      const h2 = Task.getHistory(t2.id);
      const bulk1 = h1.filter(h => h.operation === 'bulk_update');
      const bulk2 = h2.filter(h => h.operation === 'bulk_update');
      assert.equal(bulk1.length, 1);
      assert.equal(bulk2.length, 1);
    });

    it('logs delete operation', () => {
      const task = Task.create({ title: 'Audit delete' });
      const taskId = task.id;
      Task.remove(taskId);
      const history = Task.getHistory(taskId);
      const deleteEntry = history.find(h => h.operation === 'delete');
      assert.ok(deleteEntry);
      const titleChange = deleteEntry.changes.find(c => c.field === 'title');
      assert.equal(titleChange.old_value, 'Audit delete');
      assert.equal(titleChange.new_value, null);
    });

    it('returns history in chronological order', () => {
      const task = Task.create({ title: 'Chrono' });
      Task.update(task.id, { status: 'in-progress' });
      Task.update(task.id, { status: 'done' });
      const history = Task.getHistory(task.id);
      assert.equal(history[0].operation, 'create');
      assert.ok(history.length >= 3);
      for (let i = 1; i < history.length; i++) {
        assert.ok(history[i].id > history[i - 1].id);
      }
    });

    it('filters by operation type', () => {
      const task = Task.create({ title: 'Filter ops' });
      Task.update(task.id, { status: 'in-progress' });
      const updates = Task.getHistory(task.id, { operation: 'update' });
      assert.ok(updates.length >= 1);
      updates.forEach(h => assert.equal(h.operation, 'update'));
    });

    it('returns history for deleted tasks', () => {
      const task = Task.create({ title: 'Deleted history' });
      const taskId = task.id;
      Task.update(taskId, { status: 'in-progress' });
      Task.remove(taskId);
      assert.equal(Task.getById(taskId), undefined);
      const history = Task.getHistory(taskId);
      assert.ok(history.length >= 3);
      const ops = history.map(h => h.operation);
      assert.ok(ops.includes('create'));
      assert.ok(ops.includes('update'));
      assert.ok(ops.includes('delete'));
    });

    it('each entry includes timestamp, operation, and changes', () => {
      const task = Task.create({ title: 'Entry fields' });
      const history = Task.getHistory(task.id);
      assert.ok(history[0].created_at);
      assert.ok(history[0].operation);
      assert.ok(Array.isArray(history[0].changes));
      history[0].changes.forEach(c => {
        assert.ok('field' in c);
        assert.ok('old_value' in c);
        assert.ok('new_value' in c);
      });
    });
  });

  describe('priority sorting', () => {
    it('getAll sorts by priority ascending (high first)', () => {
      // Create tasks with different priorities
      Task.create({ title: 'Low pri', priority: 'low' });
      Task.create({ title: 'High pri', priority: 'high' });
      Task.create({ title: 'Med pri', priority: 'medium' });

      const tasks = Task.getAll({ sort: 'priority' });
      const priorities = tasks.map(t => t.priority);
      const firstHigh = priorities.indexOf('high');
      const firstMed = priorities.indexOf('medium');
      const firstLow = priorities.indexOf('low');
      assert.ok(firstHigh < firstMed, 'high should come before medium');
      assert.ok(firstMed < firstLow, 'medium should come before low');
    });

    it('getAll sorts by priority descending (low first)', () => {
      const tasks = Task.getAll({ sort: 'priority', order: 'desc' });
      const priorities = tasks.map(t => t.priority);
      const firstLow = priorities.indexOf('low');
      const firstMed = priorities.indexOf('medium');
      const firstHigh = priorities.indexOf('high');
      assert.ok(firstLow < firstMed, 'low should come before medium');
      assert.ok(firstMed < firstHigh, 'medium should come before high');
    });

    it('getFiltered sorts by priority with status filter', () => {
      const t1 = Task.create({ title: 'Sort filter low', priority: 'low' });
      Task.update(t1.id, { status: 'in-progress' });
      const t2 = Task.create({ title: 'Sort filter high', priority: 'high' });
      Task.update(t2.id, { status: 'in-progress' });

      const results = Task.getFiltered({ status: 'in-progress', sort: 'priority' });
      const priorities = results.map(t => t.priority);
      const firstHigh = priorities.indexOf('high');
      const lastLow = priorities.lastIndexOf('low');
      assert.ok(firstHigh < lastLow, 'high should come before low in filtered results');
    });
  });
});
