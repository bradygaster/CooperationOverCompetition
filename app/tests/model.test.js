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
});
