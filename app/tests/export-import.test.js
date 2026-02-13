const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { setupTestDb } = require('./helpers');

let teardown;
let app;

describe('Export / Import API', () => {
  before(() => {
    teardown = setupTestDb();
    const { createApp } = require('../src/app');
    app = createApp();
  });

  after(() => {
    teardown();
  });

  describe('GET /tasks/export', () => {
    it('returns export metadata with empty database', async () => {
      const res = await request(app).get('/tasks/export').expect(200);

      assert.ok(res.body.export_version);
      assert.ok(res.body.exported_at);
      assert.equal(res.body.task_count, 0);
      assert.ok(Array.isArray(res.body.tasks));
      assert.equal(res.body.tasks.length, 0);
    });

    it('exports all tasks with all fields', async () => {
      await request(app).post('/tasks').send({ title: 'Export 1', description: 'desc1', priority: 'high' }).expect(201);
      await request(app).post('/tasks').send({ title: 'Export 2', description: 'desc2', priority: 'low' }).expect(201);

      const res = await request(app).get('/tasks/export').expect(200);

      assert.equal(res.body.export_version, '1.0');
      assert.ok(res.body.exported_at);
      assert.equal(res.body.task_count, 2);
      assert.equal(res.body.tasks.length, 2);

      const task = res.body.tasks[0];
      assert.ok('id' in task);
      assert.ok('title' in task);
      assert.ok('description' in task);
      assert.ok('status' in task);
      assert.ok('priority' in task);
      assert.ok('created_at' in task);
      assert.ok('updated_at' in task);
    });

    it('returns valid JSON', async () => {
      const res = await request(app).get('/tasks/export').expect(200);
      assert.equal(typeof res.body, 'object');
      assert.doesNotThrow(() => JSON.stringify(res.body));
    });
  });

  describe('POST /tasks/import', () => {
    it('imports tasks from valid JSON', async () => {
      const importData = {
        tasks: [
          { title: 'Imported 1', status: 'todo', priority: 'high', description: 'imp desc 1' },
          { title: 'Imported 2', status: 'in-progress', priority: 'low', description: 'imp desc 2' },
        ]
      };

      const res = await request(app)
        .post('/tasks/import')
        .send(importData)
        .expect(200);

      assert.equal(res.body.imported, 2);
      assert.equal(res.body.tasks.length, 2);
      assert.equal(res.body.tasks[0].title, 'Imported 1');
      assert.equal(res.body.tasks[0].priority, 'high');
      assert.equal(res.body.tasks[1].title, 'Imported 2');
      assert.equal(res.body.tasks[1].status, 'in-progress');
    });

    it('rejects request without tasks array', async () => {
      const res = await request(app)
        .post('/tasks/import')
        .send({ data: 'not an array' })
        .expect(400);

      assert.ok(res.body.error);
    });

    it('rejects invalid JSON with 400', async () => {
      const res = await request(app)
        .post('/tasks/import')
        .set('Content-Type', 'application/json')
        .send('not valid json{{{')
        .expect(400);
    });

    it('rejects tasks missing required field title', async () => {
      const res = await request(app)
        .post('/tasks/import')
        .send({ tasks: [{ status: 'todo' }] })
        .expect(400);

      assert.ok(res.body.error);
      assert.ok(res.body.error.includes('title'));
    });

    it('rejects tasks missing required field status', async () => {
      const res = await request(app)
        .post('/tasks/import')
        .send({ tasks: [{ title: 'No status' }] })
        .expect(400);

      assert.ok(res.body.error);
      assert.ok(res.body.error.includes('status'));
    });

    it('rejects invalid status values', async () => {
      const res = await request(app)
        .post('/tasks/import')
        .send({ tasks: [{ title: 'Bad status', status: 'invalid' }] })
        .expect(400);

      assert.ok(res.body.error);
    });

    it('rejects invalid priority values', async () => {
      const res = await request(app)
        .post('/tasks/import')
        .send({ tasks: [{ title: 'Bad priority', status: 'todo', priority: 'urgent' }] })
        .expect(400);

      assert.ok(res.body.error);
    });

    it('rejects empty title', async () => {
      const res = await request(app)
        .post('/tasks/import')
        .send({ tasks: [{ title: '   ', status: 'todo' }] })
        .expect(400);

      assert.ok(res.body.error);
    });

    it('rejects title exceeding 200 characters', async () => {
      const res = await request(app)
        .post('/tasks/import')
        .send({ tasks: [{ title: 'a'.repeat(201), status: 'todo' }] })
        .expect(400);

      assert.ok(res.body.error);
    });

    it('overwrites existing tasks with same IDs (idempotent)', async () => {
      // Create a task
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Original', description: 'orig desc', priority: 'low' })
        .expect(201);

      const taskId = created.body.id;

      // Import with same ID
      const res = await request(app)
        .post('/tasks/import')
        .send({
          tasks: [{
            id: taskId,
            title: 'Overwritten',
            description: 'new desc',
            status: 'done',
            priority: 'high',
          }]
        })
        .expect(200);

      assert.equal(res.body.imported, 1);
      assert.equal(res.body.tasks[0].id, taskId);
      assert.equal(res.body.tasks[0].title, 'Overwritten');
      assert.equal(res.body.tasks[0].description, 'new desc');
      assert.equal(res.body.tasks[0].status, 'done');
      assert.equal(res.body.tasks[0].priority, 'high');

      // Verify via GET
      const fetched = await request(app).get(`/tasks/${taskId}`).expect(200);
      assert.equal(fetched.body.title, 'Overwritten');
    });

    it('is atomic: bad data in last task rolls back entire import', async () => {
      // Get current task count
      const before = await request(app).get('/tasks').expect(200);
      const countBefore = before.body.length;

      // Import with valid first task and invalid last task
      const res = await request(app)
        .post('/tasks/import')
        .send({
          tasks: [
            { title: 'Good task', status: 'todo', priority: 'medium' },
            { title: 'Another good', status: 'todo', priority: 'low' },
            { title: '', status: 'todo' }, // invalid: empty title
          ]
        })
        .expect(400);

      assert.ok(res.body.error);

      // Verify no tasks were added
      const afterReq = await request(app).get('/tasks').expect(200);
      assert.equal(afterReq.body.length, countBefore);
    });

    it('logs a single audit event for import', async () => {
      const importData = {
        tasks: [
          { title: 'Audit import 1', status: 'todo' },
          { title: 'Audit import 2', status: 'todo' },
        ]
      };

      await request(app)
        .post('/tasks/import')
        .send(importData)
        .expect(200);

      // Check audit log for import operation (task_id=0 for import)
      const { getConnection } = require('../src/db/connection');
      const db = getConnection();
      const logs = db.prepare("SELECT * FROM audit_log WHERE operation = 'import' ORDER BY id DESC LIMIT 1").all();

      assert.equal(logs.length, 1);
      assert.equal(logs[0].operation, 'import');

      const oldValue = JSON.parse(logs[0].old_value);
      assert.ok('file_size' in oldValue);
      assert.ok('task_count' in oldValue);
      assert.equal(oldValue.task_count, 2);

      const newValue = JSON.parse(logs[0].new_value);
      assert.equal(newValue.outcome, 'success');
    });

    it('preserves task IDs from export', async () => {
      // Create tasks and export
      const t1 = await request(app).post('/tasks').send({ title: 'Preserve ID 1', status: 'todo' }).expect(201);

      const exportRes = await request(app).get('/tasks/export').expect(200);
      const exportedTask = exportRes.body.tasks.find(t => t.id === t1.body.id);
      assert.ok(exportedTask);

      // Delete the task
      await request(app).delete(`/tasks/${t1.body.id}`).expect(200);

      // Re-import with same data
      const importRes = await request(app)
        .post('/tasks/import')
        .send({ tasks: [exportedTask] })
        .expect(200);

      assert.equal(importRes.body.tasks[0].id, t1.body.id);
    });

    it('round-trips through export then import', async () => {
      // Create some tasks
      await request(app).post('/tasks').send({ title: 'Round trip A', description: 'desc A', priority: 'high' }).expect(201);
      await request(app).post('/tasks').send({ title: 'Round trip B', description: 'desc B', priority: 'low' }).expect(201);

      // Export
      const exportRes = await request(app).get('/tasks/export').expect(200);
      const exported = exportRes.body;

      // Import the exported data (should be idempotent overwrite)
      const importRes = await request(app)
        .post('/tasks/import')
        .send({ tasks: exported.tasks })
        .expect(200);

      assert.equal(importRes.body.imported, exported.task_count);
    });

    it('defaults priority to medium when not specified', async () => {
      const res = await request(app)
        .post('/tasks/import')
        .send({
          tasks: [{ title: 'No priority', status: 'todo' }]
        })
        .expect(200);

      assert.equal(res.body.tasks[0].priority, 'medium');
    });

    it('defaults description to empty string when not specified', async () => {
      const res = await request(app)
        .post('/tasks/import')
        .send({
          tasks: [{ title: 'No desc', status: 'todo' }]
        })
        .expect(200);

      assert.equal(res.body.tasks[0].description, '');
    });
  });
});
