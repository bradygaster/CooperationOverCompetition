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
    });

    it('rejects creation without title', () => {
      // The model itself doesn't validate — the DB NOT NULL constraint does
      assert.throws(() => {
        Task.create({});
      });
    });
  });

  describe('getAll', () => {
    it('returns all tasks', () => {
      const tasks = Task.getAll();
      assert.ok(Array.isArray(tasks));
      assert.ok(tasks.length >= 2, 'Should have at least the 2 tasks created above');
    });
  });

  describe('getFiltered', () => {
    it('returns all tasks when no filters are given', () => {
      const all = Task.getAll();
      const filtered = Task.getFiltered();
      assert.equal(filtered.length, all.length);
    });

    it('filters by status', () => {
      Task.create({ title: 'Model filter todo' });
      const t = Task.create({ title: 'Model filter progress' });
      Task.update(t.id, { status: 'in-progress' });

      const results = Task.getFiltered({ status: 'in-progress' });
      assert.ok(results.every(t => t.status === 'in-progress'));
    });

    it('filters by search (case-insensitive)', () => {
      Task.create({ title: 'UPPERCASE test' });
      Task.create({ title: 'lowercase uppercase mix' });

      const results = Task.getFiltered({ search: 'uppercase' });
      assert.ok(results.length >= 2);
      assert.ok(results.every(t => t.title.toLowerCase().includes('uppercase')));
    });

    it('throws for invalid status', () => {
      assert.throws(() => {
        Task.getFiltered({ status: 'invalid' });
      }, (err) => {
        assert.equal(err.code, 'INVALID_STATUS');
        return true;
      });
    });

    it('treats empty search as no filter', () => {
      const all = Task.getAll();
      const filtered = Task.getFiltered({ search: '' });
      assert.equal(filtered.length, all.length);
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

  describe('priority', () => {
    it('defaults to medium when not specified', () => {
      const task = Task.create({ title: 'Default priority' });
      assert.equal(task.priority, 'medium');
    });

    it('creates a task with explicit priority', () => {
      const task = Task.create({ title: 'High priority', priority: 'high' });
      assert.equal(task.priority, 'high');
    });

    it('accepts all valid priority values', () => {
      const low = Task.create({ title: 'Low', priority: 'low' });
      const med = Task.create({ title: 'Med', priority: 'medium' });
      const high = Task.create({ title: 'High2', priority: 'high' });
      assert.equal(low.priority, 'low');
      assert.equal(med.priority, 'medium');
      assert.equal(high.priority, 'high');
    });

    it('rejects invalid priority', () => {
      assert.throws(() => {
        Task.create({ title: 'Bad priority', priority: 'urgent' });
      }, (err) => {
        assert.equal(err.code, 'INVALID_PRIORITY');
        return true;
      });
    });

    it('updates priority without affecting other fields', () => {
      const task = Task.create({ title: 'Update prio', description: 'desc', priority: 'low' });
      const updated = Task.update(task.id, { priority: 'high' });
      assert.equal(updated.priority, 'high');
      assert.equal(updated.title, 'Update prio');
      assert.equal(updated.description, 'desc');
      assert.equal(updated.status, 'todo');
    });

    it('rejects invalid priority on update', () => {
      const task = Task.create({ title: 'Bad update prio' });
      assert.throws(() => {
        Task.update(task.id, { priority: 'critical' });
      }, (err) => {
        assert.equal(err.code, 'INVALID_PRIORITY');
        return true;
      });
    });

    it('sorts by priority high → medium → low (default asc)', () => {
      // Clear by creating fresh tasks with unique titles
      const low = Task.create({ title: 'Sort-Low', priority: 'low' });
      const high = Task.create({ title: 'Sort-High', priority: 'high' });
      const med = Task.create({ title: 'Sort-Med', priority: 'medium' });

      const results = Task.getFiltered({ search: 'Sort-', sort: 'priority' });
      assert.ok(results.length >= 3);
      const priorities = results.map(t => t.priority);
      // high should come before medium, medium before low
      const highIdx = priorities.indexOf('high');
      const medIdx = priorities.indexOf('medium');
      const lowIdx = priorities.indexOf('low');
      assert.ok(highIdx < medIdx, 'high should come before medium');
      assert.ok(medIdx < lowIdx, 'medium should come before low');
    });

    it('sorts by priority low → medium → high (desc)', () => {
      const results = Task.getFiltered({ search: 'Sort-', sort: 'priority', order: 'desc' });
      assert.ok(results.length >= 3);
      const priorities = results.map(t => t.priority);
      const lowIdx = priorities.indexOf('low');
      const medIdx = priorities.indexOf('medium');
      const highIdx = priorities.indexOf('high');
      assert.ok(lowIdx < medIdx, 'low should come before medium in desc');
      assert.ok(medIdx < highIdx, 'medium should come before high in desc');
    });

    it('priority sort works with status filter', () => {
      const t1 = Task.create({ title: 'Prio-Status-Low', priority: 'low' });
      const t2 = Task.create({ title: 'Prio-Status-High', priority: 'high' });
      // both are 'todo' status
      const results = Task.getFiltered({ status: 'todo', sort: 'priority', search: 'Prio-Status' });
      assert.ok(results.length >= 2);
      const titles = results.map(t => t.title);
      const highIdx = titles.indexOf('Prio-Status-High');
      const lowIdx = titles.indexOf('Prio-Status-Low');
      assert.ok(highIdx < lowIdx, 'high priority should come first');
    });
  });
});
