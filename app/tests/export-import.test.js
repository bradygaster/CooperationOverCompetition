const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { setupTestDb } = require('./helpers');

let teardown;
let app;

describe('Export/Import API', () => {
  before(() => {
    teardown = setupTestDb();
    const { createApp } = require('../src/app');
    app = createApp();
  });

  after(() => {
    teardown();
  });

  describe('GET /tasks/export', () => {
    it('returns tasks with all fields (id, title, description, status, priority, created_at, updated_at)', async () => {
      await request(app).post('/tasks').send({ title: 'Export task 1', description: 'desc1', priority: 'high' }).expect(201);
      await request(app).post('/tasks').send({ title: 'Export task 2', priority: 'low' }).expect(201);

      const res = await request(app).get('/tasks/export').expect(200);

      assert.ok(Array.isArray(res.body.tasks));
      assert.ok(res.body.tasks.length >= 2);
      const task = res.body.tasks.find(t => t.title === 'Export task 1');
      assert.ok(task.id);
      assert.equal(task.title, 'Export task 1');
      assert.equal(task.description, 'desc1');
      assert.equal(task.status, 'todo');
      assert.equal(task.priority, 'high');
      assert.ok(task.created_at);
      assert.ok(task.updated_at);
    });

    it('returns valid JSON with array of task objects', async () => {
      const res = await request(app).get('/tasks/export').expect(200);
      assert.ok(Array.isArray(res.body.tasks));
      res.body.tasks.forEach(t => {
        assert.equal(typeof t, 'object');
        assert.ok(t.id);
        assert.ok(t.title);
      });
    });

    it('includes metadata: export_version, exported_at, task_count', async () => {
      const res = await request(app).get('/tasks/export').expect(200);

      assert.equal(res.body.export_version, '1.0');
      assert.ok(res.body.exported_at);
      // Verify exported_at is a valid ISO timestamp
      assert.ok(!isNaN(Date.parse(res.body.exported_at)));
      assert.equal(typeof res.body.task_count, 'number');
      assert.equal(res.body.task_count, res.body.tasks.length);
    });
  });

  describe('POST /tasks/import', () => {
    it('with valid JSON creates all tasks from file', async () => {
      const tasksToImport = [
        { title: 'Imported 1', status: 'todo', priority: 'high' },
        { title: 'Imported 2', status: 'in-progress', priority: 'low' },
        { title: 'Imported 3', status: 'done', priority: 'medium' },
      ];

      const res = await request(app)
        .post('/tasks/import')
        .send({ tasks: tasksToImport })
        .expect(200);

      assert.equal(res.body.imported, 3);
      assert.equal(res.body.message, 'Import successful');

      // Verify tasks exist
      const all = await request(app).get('/tasks').expect(200);
      const imported1 = all.body.find(t => t.title === 'Imported 1');
      assert.ok(imported1);
      assert.equal(imported1.priority, 'high');
    });

    it('rejects invalid JSON (non-array tasks)', async () => {
      const res = await request(app)
        .post('/tasks/import')
        .send({ tasks: 'not an array' })
        .expect(400);

      assert.ok(res.body.error);
    });

    it('rejects missing required fields (title)', async () => {
      const res = await request(app)
        .post('/tasks/import')
        .send({ tasks: [{ status: 'todo' }] })
        .expect(400);

      assert.ok(res.body.error);
      assert.ok(res.body.error.includes('title'));
    });

    it('rejects missing required fields (status)', async () => {
      const res = await request(app)
        .post('/tasks/import')
        .send({ tasks: [{ title: 'No status' }] })
        .expect(400);

      assert.ok(res.body.error);
      assert.ok(res.body.error.includes('status'));
    });

    it('rejects invalid status value', async () => {
      const res = await request(app)
        .post('/tasks/import')
        .send({ tasks: [{ title: 'Bad status', status: 'invalid' }] })
        .expect(400);

      assert.ok(res.body.error);
    });

    it('rejects invalid priority value', async () => {
      const res = await request(app)
        .post('/tasks/import')
        .send({ tasks: [{ title: 'Bad priority', status: 'todo', priority: 'urgent' }] })
        .expect(400);

      assert.ok(res.body.error);
    });

    it('with existing task IDs overwrites existing tasks (idempotent)', async () => {
      // Create a task
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Original title', description: 'orig', priority: 'low' })
        .expect(201);

      const taskId = created.body.id;

      // Import with same ID but different data
      const res = await request(app)
        .post('/tasks/import')
        .send({ tasks: [{ id: taskId, title: 'Overwritten title', status: 'done', priority: 'high', description: 'new desc' }] })
        .expect(200);

      assert.equal(res.body.imported, 1);

      // Verify the task was overwritten
      const check = await request(app).get(`/tasks/${taskId}`).expect(200);
      assert.equal(check.body.title, 'Overwritten title');
      assert.equal(check.body.status, 'done');
      assert.equal(check.body.priority, 'high');
      assert.equal(check.body.description, 'new desc');
    });

    it('is atomic: bad data in last task rolls back entire import', async () => {
      const beforeAll = await request(app).get('/tasks').expect(200);
      const beforeCount = beforeAll.body.length;

      const res = await request(app)
        .post('/tasks/import')
        .send({
          tasks: [
            { title: 'Good task 1', status: 'todo' },
            { title: 'Good task 2', status: 'todo' },
            { title: '', status: 'todo' }, // bad: empty title
          ],
        })
        .expect(400);

      assert.ok(res.body.error);

      // Verify rollback: count should be the same
      const afterAll = await request(app).get('/tasks').expect(200);
      assert.equal(afterAll.body.length, beforeCount);
    });

    it('logs a single audit event with operation=import', async () => {
      // Create a task to get a known task_id pattern
      const res = await request(app)
        .post('/tasks/import')
        .send({ tasks: [{ title: 'Audit import test', status: 'todo' }] })
        .expect(200);

      assert.equal(res.body.imported, 1);

      // Check audit log for import operation (task_id=0 for import events)
      const history = await request(app).get('/tasks/0/history?operation=import').expect(200);
      assert.ok(history.body.length >= 1);
      const importEntry = history.body[history.body.length - 1];
      assert.equal(importEntry.operation, 'import');
      assert.ok(importEntry.changes);
      assert.ok(importEntry.changes.task_count);
      assert.ok(importEntry.changes.outcome === 'success');
    });

    it('rejects request without tasks field', async () => {
      const res = await request(app)
        .post('/tasks/import')
        .send({ data: [] })
        .expect(400);

      assert.ok(res.body.error);
    });

    it('round-trips export → import successfully', async () => {
      // Export current tasks
      const exportRes = await request(app).get('/tasks/export').expect(200);
      const exportedTasks = exportRes.body.tasks;
      const exportedCount = exportRes.body.task_count;

      // Delete all tasks
      for (const t of exportedTasks) {
        await request(app).delete(`/tasks/${t.id}`);
      }

      // Verify all deleted
      const emptyRes = await request(app).get('/tasks').expect(200);
      assert.equal(emptyRes.body.length, 0);

      // Import them back
      const importRes = await request(app)
        .post('/tasks/import')
        .send({ tasks: exportedTasks })
        .expect(200);

      assert.equal(importRes.body.imported, exportedCount);

      // Verify all restored
      const restored = await request(app).get('/tasks').expect(200);
      assert.equal(restored.body.length, exportedCount);
    });
  });
});
