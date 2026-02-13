const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { setupTestDb } = require('./helpers');

let teardown;
let app;

describe('Task History / Audit Log', () => {
  before(() => {
    teardown = setupTestDb();
    const { createApp } = require('../src/app');
    app = createApp();
  });

  after(() => {
    teardown();
  });

  describe('create operation logging', () => {
    it('logs a create entry with all task fields', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'Audit create', description: 'desc', priority: 'high' })
        .expect(201);

      const history = await request(app)
        .get(`/tasks/${res.body.id}/history`)
        .expect(200);

      assert.equal(history.body.length, 1);
      const entry = history.body[0];
      assert.equal(entry.task_id, res.body.id);
      assert.equal(entry.operation, 'create');
      assert.equal(entry.field_name, null);
      assert.equal(entry.old_value, null);

      const newVal = JSON.parse(entry.new_value);
      assert.equal(newVal.title, 'Audit create');
      assert.equal(newVal.description, 'desc');
      assert.equal(newVal.status, 'todo');
      assert.equal(newVal.priority, 'high');
      assert.ok(entry.timestamp);
    });
  });

  describe('update operation logging', () => {
    it('logs status change with old and new status', async () => {
      const task = await request(app)
        .post('/tasks')
        .send({ title: 'Status update log' })
        .expect(201);

      await request(app)
        .patch(`/tasks/${task.body.id}`)
        .send({ status: 'in-progress' })
        .expect(200);

      const history = await request(app)
        .get(`/tasks/${task.body.id}/history`)
        .expect(200);

      const updates = history.body.filter(e => e.operation === 'update');
      assert.equal(updates.length, 1);
      assert.equal(updates[0].field_name, 'status');
      assert.equal(updates[0].old_value, 'todo');
      assert.equal(updates[0].new_value, 'in-progress');
    });

    it('logs multiple field changes as single entry', async () => {
      const task = await request(app)
        .post('/tasks')
        .send({ title: 'Multi update', description: 'old desc', priority: 'low' })
        .expect(201);

      await request(app)
        .patch(`/tasks/${task.body.id}`)
        .send({ title: 'Multi updated', description: 'new desc' })
        .expect(200);

      const history = await request(app)
        .get(`/tasks/${task.body.id}/history`)
        .expect(200);

      const updates = history.body.filter(e => e.operation === 'update');
      assert.equal(updates.length, 1);
      assert.ok(updates[0].field_name.includes('title'));
      assert.ok(updates[0].field_name.includes('description'));

      const oldVals = JSON.parse(updates[0].old_value);
      const newVals = JSON.parse(updates[0].new_value);
      assert.equal(oldVals.title, 'Multi update');
      assert.equal(newVals.title, 'Multi updated');
      assert.equal(oldVals.description, 'old desc');
      assert.equal(newVals.description, 'new desc');
    });

    it('does not log when no fields actually change', async () => {
      const task = await request(app)
        .post('/tasks')
        .send({ title: 'No change' })
        .expect(201);

      await request(app)
        .patch(`/tasks/${task.body.id}`)
        .send({ title: 'No change' })
        .expect(200);

      const history = await request(app)
        .get(`/tasks/${task.body.id}/history`)
        .expect(200);

      const updates = history.body.filter(e => e.operation === 'update');
      assert.equal(updates.length, 0);
    });
  });

  describe('bulk status update logging', () => {
    it('logs one entry per task in bulk update', async () => {
      const t1 = await request(app).post('/tasks').send({ title: 'Bulk log 1' }).expect(201);
      const t2 = await request(app).post('/tasks').send({ title: 'Bulk log 2' }).expect(201);

      await request(app)
        .patch('/tasks/bulk')
        .send({ ids: [t1.body.id, t2.body.id], status: 'in-progress' })
        .expect(200);

      const h1 = await request(app).get(`/tasks/${t1.body.id}/history`).expect(200);
      const h2 = await request(app).get(`/tasks/${t2.body.id}/history`).expect(200);

      const updates1 = h1.body.filter(e => e.operation === 'update');
      const updates2 = h2.body.filter(e => e.operation === 'update');
      assert.equal(updates1.length, 1);
      assert.equal(updates2.length, 1);
      assert.equal(updates1[0].field_name, 'status');
      assert.equal(updates1[0].old_value, 'todo');
      assert.equal(updates1[0].new_value, 'in-progress');
    });
  });

  describe('delete operation logging', () => {
    it('logs delete with final state of task', async () => {
      const task = await request(app)
        .post('/tasks')
        .send({ title: 'Delete log', description: 'will be deleted', priority: 'high' })
        .expect(201);

      await request(app).delete(`/tasks/${task.body.id}`).expect(200);

      const history = await request(app)
        .get(`/tasks/${task.body.id}/history`)
        .expect(200);

      const deletes = history.body.filter(e => e.operation === 'delete');
      assert.equal(deletes.length, 1);
      assert.equal(deletes[0].new_value, null);

      const oldVal = JSON.parse(deletes[0].old_value);
      assert.equal(oldVal.title, 'Delete log');
      assert.equal(oldVal.description, 'will be deleted');
      assert.equal(oldVal.priority, 'high');
    });
  });

  describe('GET /tasks/:id/history', () => {
    it('returns audit log in chronological order', async () => {
      const task = await request(app)
        .post('/tasks')
        .send({ title: 'Chrono test' })
        .expect(201);

      await request(app).patch(`/tasks/${task.body.id}`).send({ status: 'in-progress' }).expect(200);
      await request(app).patch(`/tasks/${task.body.id}`).send({ status: 'done' }).expect(200);

      const history = await request(app)
        .get(`/tasks/${task.body.id}/history`)
        .expect(200);

      assert.equal(history.body.length, 3);
      assert.equal(history.body[0].operation, 'create');
      assert.equal(history.body[1].operation, 'update');
      assert.equal(history.body[2].operation, 'update');

      // Verify chronological order (by id since timestamps may be same)
      assert.ok(history.body[0].id < history.body[1].id);
      assert.ok(history.body[1].id < history.body[2].id);
    });

    it('filters by operation type', async () => {
      const task = await request(app)
        .post('/tasks')
        .send({ title: 'Filter op' })
        .expect(201);

      await request(app).patch(`/tasks/${task.body.id}`).send({ title: 'Filter op updated' }).expect(200);
      await request(app).patch(`/tasks/${task.body.id}`).send({ status: 'in-progress' }).expect(200);

      const updates = await request(app)
        .get(`/tasks/${task.body.id}/history?operation=update`)
        .expect(200);

      assert.equal(updates.body.length, 2);
      assert.ok(updates.body.every(e => e.operation === 'update'));

      const creates = await request(app)
        .get(`/tasks/${task.body.id}/history?operation=create`)
        .expect(200);

      assert.equal(creates.body.length, 1);
      assert.equal(creates.body[0].operation, 'create');
    });

    it('returns 400 for invalid operation filter', async () => {
      const res = await request(app)
        .get('/tasks/1/history?operation=invalid')
        .expect(400);

      assert.ok(res.body.error);
    });

    it('returns history for deleted tasks', async () => {
      const task = await request(app)
        .post('/tasks')
        .send({ title: 'Deleted but queryable' })
        .expect(201);

      await request(app).patch(`/tasks/${task.body.id}`).send({ status: 'in-progress' }).expect(200);
      await request(app).delete(`/tasks/${task.body.id}`).expect(200);

      // Task is gone
      await request(app).get(`/tasks/${task.body.id}`).expect(404);

      // But history is still available
      const history = await request(app)
        .get(`/tasks/${task.body.id}/history`)
        .expect(200);

      assert.equal(history.body.length, 3);
      assert.equal(history.body[0].operation, 'create');
      assert.equal(history.body[1].operation, 'update');
      assert.equal(history.body[2].operation, 'delete');
    });

    it('returns empty array for non-existent task with no history', async () => {
      const history = await request(app)
        .get('/tasks/99999/history')
        .expect(200);

      assert.deepEqual(history.body, []);
    });
  });

  describe('each log entry includes required fields', () => {
    it('has timestamp, operation, field_name, old_value, new_value', async () => {
      const task = await request(app)
        .post('/tasks')
        .send({ title: 'Entry fields test' })
        .expect(201);

      const history = await request(app)
        .get(`/tasks/${task.body.id}/history`)
        .expect(200);

      const entry = history.body[0];
      assert.ok('timestamp' in entry);
      assert.ok('operation' in entry);
      assert.ok('field_name' in entry);
      assert.ok('old_value' in entry);
      assert.ok('new_value' in entry);
      assert.ok('task_id' in entry);
    });
  });

  describe('audit log is append-only', () => {
    it('bulk delete logs one entry per task', async () => {
      const t1 = await request(app).post('/tasks').send({ title: 'BulkDel log 1' }).expect(201);
      const t2 = await request(app).post('/tasks').send({ title: 'BulkDel log 2' }).expect(201);

      await request(app)
        .delete('/tasks/bulk')
        .send({ ids: [t1.body.id, t2.body.id] })
        .expect(200);

      const h1 = await request(app).get(`/tasks/${t1.body.id}/history`).expect(200);
      const h2 = await request(app).get(`/tasks/${t2.body.id}/history`).expect(200);

      const del1 = h1.body.filter(e => e.operation === 'delete');
      const del2 = h2.body.filter(e => e.operation === 'delete');
      assert.equal(del1.length, 1);
      assert.equal(del2.length, 1);
    });
  });
});
